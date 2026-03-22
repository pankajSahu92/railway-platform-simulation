

import { SimulationEngine } from './engine/engine.js';
import { TRACK_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, pX, pY, PLATFORMS } from './engine/config.js';


let engine = new SimulationEngine();
let simState = null;       // latest published state snapshot
let isRunning = false;
let speedMultiplier = 1;        // ticks-per-animation-frame burst
const SPEED_LEVELS = [1, 2, 5, 10, 20];
let speedIndex = 0;


const trainVisuals = new Map();

// rAF handle
let rafId = null;
let lastFrameTime = 0;

// Tooltip state
let tooltipTrainId = null;


// 2. SVG ELEMENT REFS
const svg = document.getElementById('track-svg');
const trainLayer = document.getElementById('train-layer');
const tooltip = document.getElementById('train-tooltip');



const VW = CANVAS_WIDTH;   // 1200
const VH = CANVAS_HEIGHT;  // 580


function segmentMidpoint(seg) {
    const p = seg.path;
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
}


function getPositionForSegment(segId, train) {
    if (!segId) return null;
    const segments = TRACK_CONFIG.segments;

    // Platform tracks
    if (train && train.platformId !== null) {
        const key = `PLATFORM_TRACK_${train.platformId}`;
        if (segments[key]) return segmentMidpoint(segments[key]);
    }

    
    const direct = segments[segId];
    if (direct) return segmentMidpoint(direct);

    
    if (segId.startsWith('UP_EXIT_')) return segmentMidpoint(segments['UP_EXIT']);
    if (segId.startsWith('DOWN_EXIT_')) return segmentMidpoint(segments['DOWN_EXIT']);

    // Fallback: vanish off-screen
    return { x: -100, y: -100 };
}



function buildTrackSVG() {
    const ns = 'http://www.w3.org/2000/svg';

    const g = document.getElementById('track-layer');
    g.innerHTML = '';

    function line(x1, y1, x2, y2, cls) {
        const l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('class', `track-line ${cls}`);
        g.appendChild(l);
        return l;
    }

    function path(d, cls) {
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', d);
        p.setAttribute('class', `track-line ${cls}`);
        g.appendChild(p);
        return p;
    }

    function text(x, y, txt, cls) {
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', x); t.setAttribute('y', y);
        t.setAttribute('class', cls);
        t.textContent = txt;
        g.appendChild(t);
        return t;
    }

    function rect(x, y, w, h, cls, id) {
        const r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', x); r.setAttribute('y', y);
        r.setAttribute('width', w); r.setAttribute('height', h);
        r.setAttribute('rx', 3);
        if (cls) r.setAttribute('class', cls);
        if (id) r.setAttribute('id', id);
        g.appendChild(r);
        return r;
    }

    // ── Background tint bands ──
    const bands = [
        { y: pY.UP_LOOP - 18, h: 30, col: 'rgba(59,130,246,.04)' },
        { y: pY.P1 - 22, h: 95, col: 'rgba(34,197,94,.04)' },
        { y: pY.PASS - 14, h: 28, col: 'rgba(168,85,247,.04)' },
        { y: pY.DOWN_MAIN - 12, h: 105, col: 'rgba(249,115,22,.04)' },
        { y: pY.DOWN_LOOP - 12, h: 34, col: 'rgba(249,115,22,.04)' },
    ];
    bands.forEach(b => {
        const r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', 0); r.setAttribute('y', b.y);
        r.setAttribute('width', VW); r.setAttribute('height', b.h);
        r.setAttribute('fill', b.col);
        g.appendChild(r);
    });

    // ── UP LOOP track (dashed) ──
    // Loop spur from UP main line going up-left
    path(`M ${pX.LOOP_BRANCH} ${pY.UP_MAIN} Q ${pX.LOOP_BRANCH - 20} ${(pY.UP_MAIN + pY.UP_LOOP) / 2} ${pX.THROAT_ENTRY_START} ${pY.UP_LOOP}`, 'track-loop');
    // Loop goes left to the edge
    line(0, pY.UP_LOOP, pX.THROAT_ENTRY_START, pY.UP_LOOP, 'track-loop');
    text(10, pY.UP_LOOP - 7, '▲ UP HOLDING LOOP', 'loop-label');

    // ── DOWN LOOP track (dashed) ──
    path(`M ${VW - pX.LOOP_BRANCH} ${pY.DOWN_MAIN} Q ${VW - pX.LOOP_BRANCH + 20} ${(pY.DOWN_MAIN + pY.DOWN_LOOP) / 2} ${VW - pX.THROAT_ENTRY_START} ${pY.DOWN_LOOP}`, 'track-loop');
    line(VW - pX.THROAT_ENTRY_START, pY.DOWN_LOOP, VW, pY.DOWN_LOOP, 'track-loop');
    text(VW - 160, pY.DOWN_LOOP - 7, '▼ DOWN HOLDING LOOP', 'loop-label');

    // ── PASSING LINE ──
    line(0, pY.PASS, VW, pY.PASS, 'track-pass');
    text(VW / 2 - 50, pY.PASS - 7, '— PASSING LINE —', 'loop-label');

    // ── UP MAIN LINE (leftmost segment and exit) ──
    line(0, pY.UP_MAIN, pX.THROAT_ENTRY_START, pY.UP_MAIN, 'track-main');
    line(pX.THROAT_EXIT_END, pY.UP_MAIN, VW, pY.UP_MAIN, 'track-main');

    // UP THROAT (entry) — diverge to P1 and P2
    path(`M ${pX.THROAT_ENTRY_START} ${pY.UP_MAIN}
        L ${pX.THROAT_ENTRY_MID} ${(pY.P1 + pY.P2) / 2}
        L ${pX.THROAT_ENTRY_END} ${pY.P1}`, 'track-main');
    path(`M ${pX.THROAT_ENTRY_MID} ${(pY.P1 + pY.P2) / 2}
        L ${pX.THROAT_ENTRY_END} ${pY.P2}`, 'track-main');

    // UP THROAT (exit) — converge from P1 and P2
    path(`M ${pX.THROAT_EXIT_START} ${pY.P1}
        L ${pX.THROAT_EXIT_MID} ${(pY.P1 + pY.P2) / 2}
        L ${pX.THROAT_EXIT_END} ${pY.UP_MAIN}`, 'track-main');
    path(`M ${pX.THROAT_EXIT_START} ${pY.P2}
        L ${pX.THROAT_EXIT_MID} ${(pY.P1 + pY.P2) / 2}`, 'track-main');

    // ── DOWN MAIN LINE ──
    line(0, pY.DOWN_MAIN, pX.THROAT_ENTRY_START, pY.DOWN_MAIN, 'track-main');
    line(pX.THROAT_EXIT_END, pY.DOWN_MAIN, VW, pY.DOWN_MAIN, 'track-main');

    // DOWN THROAT (entry from right) — diverge to P3 and P4
    path(`M ${pX.THROAT_EXIT_END} ${pY.DOWN_MAIN}
        L ${pX.THROAT_EXIT_MID} ${(pY.P3 + pY.P4) / 2}
        L ${pX.THROAT_EXIT_START} ${pY.P3}`, 'track-main');
    path(`M ${pX.THROAT_EXIT_MID} ${(pY.P3 + pY.P4) / 2}
        L ${pX.THROAT_EXIT_START} ${pY.P4}`, 'track-main');

    // DOWN THROAT (exit to left) — converge from P3 and P4
    path(`M ${pX.THROAT_ENTRY_END} ${pY.P3}
        L ${pX.THROAT_ENTRY_MID} ${(pY.P3 + pY.P4) / 2}
        L ${pX.THROAT_ENTRY_START} ${pY.DOWN_MAIN}`, 'track-main');
    path(`M ${pX.THROAT_ENTRY_END} ${pY.P4}
        L ${pX.THROAT_ENTRY_MID} ${(pY.P3 + pY.P4) / 2}`, 'track-main');

    // ── PLATFORM TRACKS ──
    const platformDefs = [
        { id: 1, y: pY.P1, dir: 'UP' },
        { id: 2, y: pY.P2, dir: 'UP' },
        { id: 3, y: pY.P3, dir: 'DOWN' },
        { id: 4, y: pY.P4, dir: 'DOWN' },
    ];
    platformDefs.forEach(pl => {
        const pw = pX.PLATFORM_END - pX.PLATFORM_START;
        const ph = 18;
        const py = pl.y - ph / 2;

        // Track line
        line(pX.PLATFORM_START, pl.y, pX.PLATFORM_END, pl.y, 'track-platform');

        // Platform box (station area)
        rect(pX.PLATFORM_START, py, pw, ph, 'platform-box', `platform-box-${pl.id}`);

        // Platform label
        const lbl = document.createElementNS(ns, 'text');
        lbl.setAttribute('x', pX.PLATFORM_START + pw / 2);
        lbl.setAttribute('y', pl.y + 1);
        lbl.setAttribute('class', 'platform-label');
        lbl.setAttribute('id', `platform-label-${pl.id}`);
        lbl.textContent = `P${pl.id} — ${pl.dir}`;
        g.appendChild(lbl);
    });

    // ── Direction arrows at edges ──
    text(8, pY.UP_MAIN + 4, '▶ UP', 'direction-label');
    text(VW - 45, pY.UP_MAIN + 4, 'UP ▶', 'direction-label');
    text(8, pY.DOWN_MAIN + 4, '◀ DOWN', 'direction-label');
    text(VW - 60, pY.DOWN_MAIN + 4, 'DOWN ◀', 'direction-label');

    // ── Station name ──
    const stationX = (pX.PLATFORM_START + pX.PLATFORM_END) / 2;
    text(stationX, (pY.P2 + pY.PASS) / 2, 'CENTRAL STATION', 'direction-label');
}

// ════════════════════════════════════════════════════
// 5. TRAIN RENDERING
// ════════════════════════════════════════════════════

const TRAIN_W = 36;
const TRAIN_H = 12;

function getTrainStateClass(state) {
    return `train-state-${state.toLowerCase()}`;
}

function getDirClass(train) {
    if (train.type === 'PASS') return 'train-dir-pass';
    return train.direction === 'UP' ? 'train-dir-up' : 'train-dir-down';
}

function ensureTrainElement(train) {
    const ns = 'http://www.w3.org/2000/svg';
    let g = document.getElementById(`train-${train.id}`);
    if (!g) {
        g = document.createElementNS(ns, 'g');
        g.setAttribute('id', `train-${train.id}`);
        g.setAttribute('class', 'train-group');

        const body = document.createElementNS(ns, 'rect');
        body.setAttribute('class', 'train-body');
        body.setAttribute('width', TRAIN_W);
        body.setAttribute('height', TRAIN_H);
        body.setAttribute('x', -TRAIN_W / 2);
        body.setAttribute('y', -TRAIN_H / 2);

        const lbl = document.createElementNS(ns, 'text');
        lbl.setAttribute('class', 'train-label');
        lbl.textContent = train.name;

        g.appendChild(body);
        g.appendChild(lbl);
        trainLayer.appendChild(g);

        // Tooltip events
        g.addEventListener('mouseenter', e => showTooltip(train.id, e));
        g.addEventListener('mouseleave', hideTooltip);
        g.addEventListener('mousemove', e => moveTooltip(e));
    }
    return g;
}

function updateTrainElements(trains) {
    const visibleStates = new Set(['ARRIVING', 'AT_PLATFORM', 'WAITING_ON_LOOP', 'DEPARTING', 'PASSING']);

    trains.forEach(train => {
        const pos = getPositionForSegment(train.trackSegmentId, train);
        if (!pos || !visibleStates.has(train.state)) {
            // Hide
            const el = document.getElementById(`train-${train.id}`);
            if (el) el.style.display = 'none';
            return;
        }

        const g = ensureTrainElement(train);
        g.style.display = '';

        // Smooth animation: interpolate towards target
        let vis = trainVisuals.get(train.id);
        if (!vis) {
            vis = { x: pos.x, y: pos.y, targetX: pos.x, targetY: pos.y };
            trainVisuals.set(train.id, vis);
        }

        // If segment changed, update target
        if (train.trackSegmentId !== vis.lastSegId || train.platformId !== vis.lastPlatformId) {
            vis.targetX = pos.x;
            vis.targetY = pos.y;
            vis.lastSegId = train.trackSegmentId;
            vis.lastPlatformId = train.platformId;
        }

        // Lerp towards target
        const LERP = 0.08;
        vis.x += (vis.targetX - vis.x) * LERP;
        vis.y += (vis.targetY - vis.y) * LERP;

        g.setAttribute('transform', `translate(${vis.x.toFixed(1)},${vis.y.toFixed(1)})`);

        // State + direction colour classes
        const stateClass = getTrainStateClass(train.state);
        const dirClass = getDirClass(train);
        g.setAttribute('class', `train-group ${dirClass} ${stateClass}`);
    });

    // Remove elements for trains that are fully DEPARTED and out of view
    trains.forEach(train => {
        if (train.state === 'DEPARTED') {
            const el = document.getElementById(`train-${train.id}`);
            if (el) el.style.display = 'none';
        }
    });
}

// ════════════════════════════════════════════════════
// 6. STATUS BOARD
// ════════════════════════════════════════════════════

function formatTime(mins) {
    if (!mins) return '--:--';
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function stateLabel(state) {
    const map = {
        UPCOMING: 'Upcoming',
        ARRIVING: 'Arriving',
        AT_PLATFORM: 'At Platform',
        WAITING_ON_LOOP: 'On Loop',
        DEPARTING: 'Departing',
        PASSING: 'Passing',
        DEPARTED: 'Departed',
    };
    return map[state] || state;
}

function buildStatusBoard(trains) {
    const board = document.getElementById('status-board');
    board.innerHTML = '';

    const sorted = [...trains].sort((a, b) => a.scheduledArrivalTime - b.scheduledArrivalTime);

    sorted.forEach(t => {
        const div = document.createElement('div');
        div.className = 'train-card';
        div.dataset.trainId = t.id;

        const badgeClass = t.type === 'PASS' ? 'dir-pass' : (t.direction === 'UP' ? 'dir-up' : 'dir-down');
        const stCls = `state-${t.state.toLowerCase()}`;

        const pInfo = t.platformId ? `P${t.platformId}` : (t.state === 'WAITING_ON_LOOP' ? 'Loop' : '—');

        const delayStr = (t.totalDelay ?? t.delay) > 0 ? ` (+${t.totalDelay ?? t.delay}m)` : '';

        const stars = '★'.repeat(t.priority ?? 0);

        div.innerHTML = `
      <div class="tc-badge ${badgeClass}">${t.name}</div>
      <div class="tc-info">
        <div class="tc-name">${t.direction} · ${t.type}<span class="tc-priority">${stars}</span></div>
        <div class="tc-meta">${formatTime(t.actualArrivalTime)}${delayStr} · ${pInfo}</div>
      </div>
      <div class="tc-state ${stCls}">${stateLabel(t.state)}</div>
    `;
        board.appendChild(div);
    });

    // Update count
    const active = trains.filter(t => !['UPCOMING', 'DEPARTED'].includes(t.state)).length;
    document.getElementById('train-count-badge').textContent = `${active} active`;
}

// ════════════════════════════════════════════════════
// 7. METRICS PANEL
// ════════════════════════════════════════════════════

function updateMetrics(state) {
    const trains = state.trains;
    const platforms = state.platforms;

    const departed = trains.filter(t => ['DEPARTED', 'DEPARTING'].includes(t.state));
    const delayed = trains.filter(t => t.delay > 0);
    const atPlatform = trains.filter(t => t.state === 'AT_PLATFORM');
    const onLoop = trains.filter(t => t.state === 'WAITING_ON_LOOP');
    const passing = trains.filter(t => t.state === 'PASSING');
    const upcoming = trains.filter(t => t.state === 'UPCOMING');

    const avgDelay = delayed.length
        ? (delayed.reduce((s, t) => s + t.delay, 0) / delayed.length).toFixed(1)
        : '0.0';

    const utilPct = platforms.map(p => p.isOccupied ? 100 : 0);

    const completedPct = Math.round((departed.length / trains.length) * 100);

    // Fill metrics
    document.getElementById('m-current-time').textContent = formatTime(state.currentTime);
    document.getElementById('m-completed').textContent = departed.length;
    document.getElementById('m-upcoming').textContent = upcoming.length;
    document.getElementById('m-at-platform').textContent = atPlatform.length;
    document.getElementById('m-on-loop').textContent = onLoop.length;
    document.getElementById('m-passing').textContent = passing.length;
    document.getElementById('m-avg-delay').textContent = `${avgDelay}m`;
    document.getElementById('m-delayed').textContent = delayed.length;
    document.getElementById('m-events').textContent = state.events.size();

    // Platform utilization bars
    PLATFORMS.forEach(p => {
        const fill = document.getElementById(`util-fill-${p.id}`);
        if (fill) {
            const occ = platforms.find(pl => pl.id === p.id)?.isOccupied;
            fill.style.width = occ ? '100%' : '0%';
            fill.style.background = occ ? 'var(--accent-green)' : 'var(--bg-elevated)';
        }
        const lbl = document.getElementById(`util-lbl-${p.id}`);
        if (lbl) {
            const pl = platforms.find(x => x.id === p.id);
            lbl.textContent = pl?.isOccupied ? `P${p.id}●` : `P${p.id}○`;
        }
    });

    // Platform box occupied classes
    PLATFORMS.forEach(p => {
        const box = document.getElementById(`platform-box-${p.id}`);
        const pl = state.platforms.find(x => x.id === p.id);
        if (box && pl) {
            box.classList.toggle('occupied', pl.isOccupied);
        }
    });

    document.getElementById('m-progress').style.width = `${completedPct}%`;
    document.getElementById('m-progress-label').textContent = `${completedPct}% complete`;
}

// ════════════════════════════════════════════════════
// 8. TOOLTIP
// ════════════════════════════════════════════════════

function showTooltip(trainId, e) {
    tooltipTrainId = trainId;
    tooltip.classList.add('visible');
    moveTooltip(e);
}

function hideTooltip() {
    tooltipTrainId = null;
    tooltip.classList.remove('visible');
}

function moveTooltip(e) {
    const svgRect = svg.getBoundingClientRect();
    let tx = e.clientX - svgRect.left + 16;
    let ty = e.clientY - svgRect.top - 10;
    // keep in view
    if (tx + 160 > svgRect.width) tx = e.clientX - svgRect.left - 170;
    if (ty + 90 > svgRect.height) ty = e.clientY - svgRect.top - 100;
    tooltip.style.left = `${tx}px`;
    tooltip.style.top = `${ty}px`;
    renderTooltip();
}

function renderTooltip() {
    if (!simState || tooltipTrainId === null) return;
    const t = simState.trains.find(x => x.id === tooltipTrainId);
    if (!t) return;

    const totalDelay = t.delay;
    const primaryDelay = t.primaryDelay ?? 0;

    document.getElementById('tt-name').textContent = `${t.name} (${t.type})`;
    document.getElementById('tt-dir').textContent = t.direction;
    document.getElementById('tt-state').textContent = stateLabel(t.state);
    document.getElementById('tt-sched').textContent = formatTime(t.scheduledArrivalTime);
    document.getElementById('tt-total-delay').textContent = totalDelay > 0 ? `+${totalDelay}m` : 'On time';
    document.getElementById('tt-primary-delay').textContent = primaryDelay > 0 ? `+${primaryDelay}m` : 'None';
    document.getElementById('tt-plat').textContent = t.platformId ? `P${t.platformId}` : '—';
    document.getElementById('tt-halt').textContent = t.haltDuration ? `${t.haltDuration}m` : '—';
}

// ════════════════════════════════════════════════════
// 9. SIMULATION LOOP
// ════════════════════════════════════════════════════

const REAL_MS_PER_SIM_MIN = 400; // at speed×1, 1 sim-minute = 400ms
let accumulatedMs = 0;
let running = false;

function simLoop(timestamp) {
    if (!isRunning) return;

    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // How many sim-minutes to advance this frame?
    const speed = SPEED_LEVELS[speedIndex];
    const msPerMin = REAL_MS_PER_SIM_MIN / speed;

    accumulatedMs += delta;
    let ticksNeeded = Math.floor(accumulatedMs / msPerMin);
    accumulatedMs -= ticksNeeded * msPerMin;

    let hasMore = true;
    for (let i = 0; i < ticksNeeded && hasMore; i++) {
        hasMore = engine.tick();
    }

    // Update visuals using latest published state
    if (simState) {
        updateTrainElements(simState.trains);
        buildStatusBoard(simState.trains);
        updateMetrics(simState);
    }

    document.getElementById('run-indicator').className =
        `run-indicator ${isRunning ? 'running' : 'paused'}`;

    if (hasMore) {
        rafId = requestAnimationFrame(simLoop);
    } else {
        isRunning = false;
        document.getElementById('btn-play').textContent = '▶ Start';
        document.getElementById('btn-play').classList.remove('paused');
        document.getElementById('run-indicator').className = 'run-indicator';
    }
}

// ════════════════════════════════════════════════════
// 10. CONTROLS
// ════════════════════════════════════════════════════

document.getElementById('btn-play').addEventListener('click', () => {
    isRunning = !isRunning;
    const btn = document.getElementById('btn-play');

    if (isRunning) {
        btn.textContent = '⏸ Pause';
        btn.classList.add('paused');
        lastFrameTime = performance.now();
        accumulatedMs = 0;
        rafId = requestAnimationFrame(simLoop);
    } else {
        btn.textContent = '▶ Resume';
        btn.classList.remove('paused');
        cancelAnimationFrame(rafId);
    }

    document.getElementById('run-indicator').className =
        `run-indicator ${isRunning ? 'running' : 'paused'}`;
});

document.getElementById('btn-reset').addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(rafId);
    trainVisuals.clear();
    trainLayer.innerHTML = '';
    engine.reset();

    const btn = document.getElementById('btn-play');
    btn.textContent = '▶ Start';
    btn.classList.remove('paused');
    document.getElementById('run-indicator').className = 'run-indicator';
});

document.getElementById('btn-speed-up').addEventListener('click', () => {
    speedIndex = Math.min(speedIndex + 1, SPEED_LEVELS.length - 1);
    document.getElementById('speed-display').textContent = `${SPEED_LEVELS[speedIndex]}×`;
});

document.getElementById('btn-speed-down').addEventListener('click', () => {
    speedIndex = Math.max(speedIndex - 1, 0);
    document.getElementById('speed-display').textContent = `${SPEED_LEVELS[speedIndex]}×`;
});

// ════════════════════════════════════════════════════
// 11. ENGINE STATE SUBSCRIPTION
// ════════════════════════════════════════════════════

engine.onStateUpdate = (state) => {
    simState = state;
    // Update sim time in header
    document.getElementById('sim-time').textContent = formatTime(state.currentTime);
};



function init() {
    buildTrackSVG();

    // Initial state render
    const initial = engine.getState();
    simState = {
        ...initial,
        trains: initial.trains.map(t => ({ ...t })),
        platforms: initial.platforms.map(p => ({ ...p })),
        upLoop: [...initial.upLoop],
        downLoop: [...initial.downLoop],
        events: initial.events.clone(),
    };

    buildStatusBoard(simState.trains);
    updateMetrics(simState);
}

init();
