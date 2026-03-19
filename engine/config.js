export const SIMULATION_START_TIME = 10 * 60; // 10:00 AM in minutes from midnight
export const TOTAL_TRAINS = 50;
export const TRAIN_INTERVAL = 1; // 1 train per minute

export const PLATFORMS = [
    { id: 1, direction: 'UP' },
    { id: 2, direction: 'UP' },
    { id: 3, direction: 'DOWN' },
    { id: 4, direction: 'DOWN' },
];

const canvasWidth = 1200;

export const pY = {
    UP_LOOP: 50,
    P1: 150,
    P2: 200,
    UP_MAIN: 250,
    PASS: 300,
    DOWN_MAIN: 350,
    P3: 400,
    P4: 450,
    DOWN_LOOP: 510,
};

export const pX = {
    LOOP_BRANCH: 150,
    THROAT_ENTRY_START: 250,
    THROAT_ENTRY_MID: 325,
    THROAT_ENTRY_END: 400,
    PLATFORM_START: 450,
    PLATFORM_END: 750,
    THROAT_EXIT_START: 800,
    THROAT_EXIT_MID: 875,
    THROAT_EXIT_END: 950,
    LOOP_REJOIN: 1050,
};

export const TRACK_CONFIG = {
    segments: {
        // --- UP DIRECTION ---
        UP_LOOP: { id: 'UP_LOOP', direction: 'UP', path: [{ x: pX.LOOP_BRANCH, y: pY.UP_MAIN }, { x: pX.THROAT_ENTRY_START, y: pY.UP_LOOP }] },
        UP_ENTRY: { id: 'UP_ENTRY', direction: 'UP', path: [{ x: 0, y: pY.UP_MAIN }, { x: pX.THROAT_ENTRY_START, y: pY.UP_MAIN }] },

        UP_THROAT_DIVERGE: { id: 'UP_THROAT_DIVERGE', direction: 'UP', path: [{ x: pX.THROAT_ENTRY_START, y: pY.UP_MAIN }, { x: pX.THROAT_ENTRY_MID, y: (pY.P1 + pY.P2) / 2 }] },
        UP_THROAT_TO_P1: { id: 'UP_THROAT_TO_P1', direction: 'UP', path: [{ x: pX.THROAT_ENTRY_MID, y: (pY.P1 + pY.P2) / 2 }, { x: pX.THROAT_ENTRY_END, y: pY.P1 }] },
        UP_THROAT_TO_P2: { id: 'UP_THROAT_TO_P2', direction: 'UP', path: [{ x: pX.THROAT_ENTRY_MID, y: (pY.P1 + pY.P2) / 2 }, { x: pX.THROAT_ENTRY_END, y: pY.P2 }] },
        UP_PLATFORM_APPROACH_1: { id: 'UP_PLATFORM_APPROACH_1', direction: 'UP', path: [{ x: pX.THROAT_ENTRY_END, y: pY.P1 }, { x: pX.PLATFORM_START, y: pY.P1 }] },
        UP_PLATFORM_APPROACH_2: { id: 'UP_PLATFORM_APPROACH_2', direction: 'UP', path: [{ x: pX.THROAT_ENTRY_END, y: pY.P2 }, { x: pX.PLATFORM_START, y: pY.P2 }] },

        PLATFORM_TRACK_1: { id: 'PLATFORM_TRACK_1', direction: 'UP', path: [{ x: pX.PLATFORM_START, y: pY.P1 }, { x: pX.PLATFORM_END, y: pY.P1 }] },
        PLATFORM_TRACK_2: { id: 'PLATFORM_TRACK_2', direction: 'UP', path: [{ x: pX.PLATFORM_START, y: pY.P2 }, { x: pX.PLATFORM_END, y: pY.P2 }] },

        UP_EXIT_1: { id: 'UP_EXIT_1', direction: 'UP', path: [{ x: pX.PLATFORM_END, y: pY.P1 }, { x: pX.THROAT_EXIT_START, y: pY.P1 }] },
        UP_EXIT_2: { id: 'UP_EXIT_2', direction: 'UP', path: [{ x: pX.PLATFORM_END, y: pY.P2 }, { x: pX.THROAT_EXIT_START, y: pY.P2 }] },

        UP_THROAT_FROM_P1: { id: 'UP_THROAT_FROM_P1', direction: 'UP', path: [{ x: pX.THROAT_EXIT_START, y: pY.P1 }, { x: pX.THROAT_EXIT_MID, y: (pY.P1 + pY.P2) / 2 }] },
        UP_THROAT_FROM_P2: { id: 'UP_THROAT_FROM_P2', direction: 'UP', path: [{ x: pX.THROAT_EXIT_START, y: pY.P2 }, { x: pX.THROAT_EXIT_MID, y: (pY.P1 + pY.P2) / 2 }] },
        UP_THROAT_CONVERGE: { id: 'UP_THROAT_CONVERGE', direction: 'UP', path: [{ x: pX.THROAT_EXIT_MID, y: (pY.P1 + pY.P2) / 2 }, { x: pX.THROAT_EXIT_END, y: pY.UP_MAIN }] },
        UP_EXIT: { id: 'UP_EXIT', direction: 'UP', path: [{ x: pX.THROAT_EXIT_END, y: pY.UP_MAIN }, { x: canvasWidth, y: pY.UP_MAIN }] },

        // --- DOWN DIRECTION ---
        DOWN_LOOP: { id: 'DOWN_LOOP', direction: 'DOWN', path: [{ x: canvasWidth - pX.LOOP_BRANCH, y: pY.DOWN_MAIN }, { x: canvasWidth - pX.THROAT_ENTRY_START, y: pY.DOWN_LOOP }] },
        DOWN_ENTRY: { id: 'DOWN_ENTRY', direction: 'DOWN', path: [{ x: canvasWidth, y: pY.DOWN_MAIN }, { x: pX.THROAT_EXIT_END, y: pY.DOWN_MAIN }] },

        DOWN_THROAT_DIVERGE: { id: 'DOWN_THROAT_DIVERGE', direction: 'DOWN', path: [{ x: pX.THROAT_EXIT_END, y: pY.DOWN_MAIN }, { x: pX.THROAT_EXIT_MID, y: (pY.P3 + pY.P4) / 2 }] },
        DOWN_THROAT_TO_P3: { id: 'DOWN_THROAT_TO_P3', direction: 'DOWN', path: [{ x: pX.THROAT_EXIT_MID, y: (pY.P3 + pY.P4) / 2 }, { x: pX.THROAT_EXIT_START, y: pY.P3 }] },
        DOWN_THROAT_TO_P4: { id: 'DOWN_THROAT_TO_P4', direction: 'DOWN', path: [{ x: pX.THROAT_EXIT_MID, y: (pY.P3 + pY.P4) / 2 }, { x: pX.THROAT_EXIT_START, y: pY.P4 }] },
        DOWN_PLATFORM_APPROACH_3: { id: 'DOWN_PLATFORM_APPROACH_3', direction: 'DOWN', path: [{ x: pX.THROAT_EXIT_START, y: pY.P3 }, { x: pX.PLATFORM_END, y: pY.P3 }] },
        DOWN_PLATFORM_APPROACH_4: { id: 'DOWN_PLATFORM_APPROACH_4', direction: 'DOWN', path: [{ x: pX.THROAT_EXIT_START, y: pY.P4 }, { x: pX.PLATFORM_END, y: pY.P4 }] },

        PLATFORM_TRACK_3: { id: 'PLATFORM_TRACK_3', direction: 'DOWN', path: [{ x: pX.PLATFORM_END, y: pY.P3 }, { x: pX.PLATFORM_START, y: pY.P3 }] },
        PLATFORM_TRACK_4: { id: 'PLATFORM_TRACK_4', direction: 'DOWN', path: [{ x: pX.PLATFORM_END, y: pY.P4 }, { x: pX.PLATFORM_START, y: pY.P4 }] },

        DOWN_EXIT_3: { id: 'DOWN_EXIT_3', direction: 'DOWN', path: [{ x: pX.PLATFORM_START, y: pY.P3 }, { x: pX.THROAT_ENTRY_END, y: pY.P3 }] },
        DOWN_EXIT_4: { id: 'DOWN_EXIT_4', direction: 'DOWN', path: [{ x: pX.PLATFORM_START, y: pY.P4 }, { x: pX.THROAT_ENTRY_END, y: pY.P4 }] },

        DOWN_THROAT_FROM_P3: { id: 'DOWN_THROAT_FROM_P3', direction: 'DOWN', path: [{ x: pX.THROAT_ENTRY_END, y: pY.P3 }, { x: pX.THROAT_ENTRY_MID, y: (pY.P3 + pY.P4) / 2 }] },
        DOWN_THROAT_FROM_P4: { id: 'DOWN_THROAT_FROM_P4', direction: 'DOWN', path: [{ x: pX.THROAT_ENTRY_END, y: pY.P4 }, { x: pX.THROAT_ENTRY_MID, y: (pY.P3 + pY.P4) / 2 }] },
        DOWN_THROAT_CONVERGE: { id: 'DOWN_THROAT_CONVERGE', direction: 'DOWN', path: [{ x: pX.THROAT_ENTRY_MID, y: (pY.P3 + pY.P4) / 2 }, { x: pX.THROAT_ENTRY_START, y: pY.DOWN_MAIN }] },
        DOWN_EXIT: { id: 'DOWN_EXIT', direction: 'DOWN', path: [{ x: pX.THROAT_ENTRY_START, y: pY.DOWN_MAIN }, { x: 0, y: pY.DOWN_MAIN }] },

        // --- PASSING LINE ---
        UP_PASS: { id: 'UP_PASS', direction: 'UP', path: [{ x: 0, y: pY.PASS }, { x: canvasWidth, y: pY.PASS }] },
        DOWN_PASS: { id: 'DOWN_PASS', direction: 'DOWN', path: [{ x: canvasWidth, y: pY.PASS }, { x: 0, y: pY.PASS }] },
    },

    platformPositions: {
        1: { position: { x: pX.PLATFORM_START, y: pY.P1 } },
        2: { position: { x: pX.PLATFORM_START, y: pY.P2 } },
        3: { position: { x: pX.PLATFORM_START, y: pY.P3 } },
        4: { position: { x: pX.PLATFORM_START, y: pY.P4 } },
    },
};

export const CANVAS_WIDTH = canvasWidth;
export const CANVAS_HEIGHT = 580;
