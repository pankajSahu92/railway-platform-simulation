import { TOTAL_TRAINS, SIMULATION_START_TIME } from './config.js';

export function generateTrains() {
    const trains = [];
    const haltDurations = [3, 4, 5, 6];
    let currentTime = SIMULATION_START_TIME;

    for (let i = 0; i < TOTAL_TRAINS; i++) {
        const direction = i % 2 === 0 ? 'UP' : 'DOWN';
        const isSpecialPassTrain = (i + 1) % 7 === 0;
        const type = isSpecialPassTrain ? 'PASS' : 'STOP';

        if (i > 0) {
            const precedingTrainNumber = i;
            let interval;
            if (precedingTrainNumber < 10) interval = 1;
            else if (precedingTrainNumber < 15) interval = 2;
            else if (precedingTrainNumber < 25) interval = 1;
            else if (precedingTrainNumber < 30) interval = 2;
            else interval = 1;
            currentTime += interval;
        }

        trains.push({
            id: i + 1,
            name: `${direction === 'UP' ? 'U' : 'D'}${i + 1}`,
            direction,
            type,
            scheduledArrivalTime: currentTime,
            actualArrivalTime: 0,
            scheduledDepartureTime: 0,
            actualDepartureTime: 0,
            haltDuration: type === 'STOP' ? haltDurations[i % haltDurations.length] : 0,
            state: 'UPCOMING',
            delay: 0,
            platformId: null,
            trackSegmentId: null,
        });
    }

    return trains;
}
