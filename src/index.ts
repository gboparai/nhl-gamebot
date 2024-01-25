
const config = require('../config.json');

enum GameStates {
    WAITING = 'WAITING',
    PREGAME = 'PREGAME',
    INGAME = 'INGAME',
    POSTGAME = 'POSTGAME',
    POSTGAMEVID = 'POSTGAMEVID'
}

const sleep = (milliseconds: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

const sleepUntilNextTime = (targetHour: number, targetMinute: number): Promise<void> => {
    const calculateTimeUntilNextTime = (): number => {
        const now = new Date();
        const nextTime = new Date(now);
        nextTime.setHours(targetHour, targetMinute, 0, 0);

        if (now > nextTime) {
            // If it's already past the target time, calculate the time until the next day at the target time
            nextTime.setDate(now.getDate() + 1);
        }

        return nextTime.getTime() - now.getTime();
    };

    return (async () => {
        const timeUntilNextTime = calculateTimeUntilNextTime();
        await sleep(timeUntilNextTime);
    })();
};

const main = async (): Promise<void> => {
    let CurrentState: GameStates = GameStates.WAITING;
    while (true) {
        if (CurrentState === GameStates.WAITING) {
            await sleepUntilNextTime(7, 0);
            CurrentState = GameStates.PREGAME;
        }
        else if (CurrentState === GameStates.PREGAME) {
            CurrentState = GameStates.INGAME;
        }
        else if (CurrentState === GameStates.INGAME) {
            await sleep(30000); //replaced from config
            CurrentState = GameStates.POSTGAME
        }
        else if (CurrentState === GameStates.POSTGAME) {
            CurrentState = GameStates.POSTGAME
        }
        else if (CurrentState === GameStates.POSTGAMEVID) {
            await sleep(60000); //replaced from config
            CurrentState = GameStates.WAITING
        }
    }

}

main();