import { PriorityQueue } from './priorityQueue.js';
import { generateTrains } from './trainGenerator.js';
import { PLATFORMS, SIMULATION_START_TIME } from './config.js';

export class SimulationEngine {
    constructor() {
        this.state = SimulationEngine.getInitialState();
        this.onStateUpdate = null;
        this._initialize();
    }

    static getInitialState() {
        return {
            currentTime: SIMULATION_START_TIME,
            trains: [],
            platforms: PLATFORMS.map(p => ({ ...p, isOccupied: false, trainId: null })),
            upLoop: [],
            downLoop: [],
            events: new PriorityQueue(),
        };
    }

    _initialize() {
        this.state = SimulationEngine.getInitialState();
        const trains = generateTrains();
        this.state.trains = trains;

        trains.forEach(train => {
            this.state.events.push({
                type: train.type === 'PASS' ? 'TRAIN_PASSING_ARRIVAL' : 'TRAIN_ARRIVAL',
                timestamp: train.scheduledArrivalTime,
                trainId: train.id,
            });
        });

        this._publishState();
    }

    reset() {
        this._initialize();
    }

    getState() {
        return this.state;
    }

    _publishState() {
        if (this.onStateUpdate) {
            const copy = {
                ...this.state,
                trains: this.state.trains.map(t => ({ ...t })),
                platforms: this.state.platforms.map(p => ({ ...p })),
                upLoop: [...this.state.upLoop],
                downLoop: [...this.state.downLoop],
                events: this.state.events.clone(),
            };
            this.onStateUpdate(copy);
        }
    }

    /** Process the next event. Returns true if more events remain. */
    tick() {
        if (this.state.events.isEmpty()) return false;

        const event = this.state.events.pop();
        this.state.currentTime = event.timestamp;

        const train = this.state.trains.find(t => t.id === event.trainId);
        if (!train) { this._publishState(); return !this.state.events.isEmpty(); }

        switch (event.type) {
            case 'TRAIN_ARRIVAL': this._handleTrainArrival(train); break;
            case 'TRAIN_DEPARTURE': this._handleTrainDeparture(train); break;
            case 'TRAIN_PASSING_ARRIVAL': this._handleTrainPassingArrival(train); break;
            case 'TRAIN_PASSING_DEPARTURE': this._handleTrainPassingDeparture(train); break;
        }

        this._publishState();
        return !this.state.events.isEmpty();
    }

    _handleTrainArrival(train) {
        train.state = 'ARRIVING';
        train.actualArrivalTime = this.state.currentTime;
        train.delay = Math.max(0, this.state.currentTime - train.scheduledArrivalTime);
        train.trackSegmentId = `${train.direction}_ENTRY`;

        const platform = this._findAvailablePlatform(train.direction);
        if (platform) {
            this._assignTrainToPlatform(train, platform);
        } else {
            train.state = 'WAITING_ON_LOOP';
            train.trackSegmentId = `${train.direction}_LOOP`;
            if (train.direction === 'UP') {
                this.state.upLoop.push(train.id);
            } else {
                this.state.downLoop.push(train.id);
            }
        }
    }

    _handleTrainPassingArrival(train) {
        train.state = 'PASSING';
        train.actualArrivalTime = this.state.currentTime;
        train.trackSegmentId = `${train.direction}_PASS`;
        this.state.events.push({
            type: 'TRAIN_PASSING_DEPARTURE',
            timestamp: this.state.currentTime + 2,
            trainId: train.id,
        });
    }

    _handleTrainPassingDeparture(train) {
        train.state = 'DEPARTED';
        train.trackSegmentId = `${train.direction}_EXIT`;
    }

    _handleTrainDeparture(train) {
        train.state = 'DEPARTING';
        train.actualDepartureTime = this.state.currentTime;

        const platform = this.state.platforms.find(p => p.id === train.platformId);
        if (platform) {
            platform.isOccupied = false;
            platform.trainId = null;
        }
        train.platformId = null;
        train.trackSegmentId = `${train.direction}_EXIT_${platform?.id}`;

        // Check loop for waiting trains
        const waitingId = train.direction === 'UP'
            ? this.state.upLoop.shift()
            : this.state.downLoop.shift();

        if (waitingId !== undefined && platform) {
            const waiting = this.state.trains.find(t => t.id === waitingId);
            waiting.actualArrivalTime = this.state.currentTime;
            waiting.delay = this.state.currentTime - waiting.scheduledArrivalTime;
            this._assignTrainToPlatform(waiting, platform);
        }

        // Schedule final removal from view
        this.state.events.push({
            type: 'TRAIN_PASSING_DEPARTURE',
            timestamp: this.state.currentTime + 2,
            trainId: train.id,
        });
    }

    _findAvailablePlatform(direction) {
        return this.state.platforms.find(p => p.direction === direction && !p.isOccupied);
    }

    _assignTrainToPlatform(train, platform) {
        train.state = 'AT_PLATFORM';
        train.platformId = platform.id;
        platform.isOccupied = true;
        platform.trainId = train.id;

        const departure = this.state.currentTime + train.haltDuration;
        train.scheduledDepartureTime = departure;

        this.state.events.push({
            type: 'TRAIN_DEPARTURE',
            timestamp: departure,
            trainId: train.id,
        });
    }
}
