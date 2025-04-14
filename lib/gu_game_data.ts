// Demo for the match endpoint of the Gods Unchained API
// https://github.com/immutable/gods-unchained-api

import { APIManager, gameModeID } from './api.js';

const apiManager = new APIManager();

const startDate = new Date('2025-03-01T07:00:00Z');
const endDate   = new Date('2025-03-01T09:59:59Z');

if (isNaN(+startDate)) {
    console.error('Invalid start date');
    process.exit(1);
}

if (isNaN(+endDate)) {
    console.error('Invalid end date');
    process.exit(1);
}

const startTime = Math.floor(startDate.getTime() / 1000); // API takes Unix timestamps in seconds
const endTime = Math.floor(endDate.getTime() / 1000);

const DateInterval = (startTime: number, endTime: number | undefined) => {
    if (endTime && (endTime - startTime) > 259200) endTime = undefined;
    return `${startTime}-${endTime ?? ''}`;
}

const ListGameModes = async () => {
    const gameModesListAPI = await apiManager.fetchAPIData('game_modes');

    const gameModes = [];
    for (const mode of gameModesListAPI) {
        gameModes.push({ Name: mode.name, Code: mode.id});
    }
    gameModes.sort((a, b) => a.Name.localeCompare(b.Name));
    console.table(gameModes);
}
//await ListGameModes();

const SealedGames = async (startTime: number, endTime: number | undefined) => { // game mode 7
    let page = 0;
    const gameRecords = [];
    const dateRange = DateInterval(startTime, endTime);

    consolidate: while (true) {
        page++;
        const sealedDataAPI = await apiManager.fetchAPIData('match', 
            { sort: 'end_time', mode_id: 7, end_time: dateRange, page });
        console.log('sealedDataAPI total:', sealedDataAPI.total);
        
        for (const record of sealedDataAPI.records) {
            if (typeof endTime === 'number' && record.end_time > endTime) {
                console.log(record.end_time, endTime); // debugging
                break consolidate;
            }
            gameRecords.push(record);
        }

        if (page * sealedDataAPI.perPage >= sealedDataAPI.total ) break;
    }

    const matchData = [];
    for (const match of gameRecords) {
        const endDate = new Date(match.end_time * 1000).toISOString();
        matchData.push({ 'End Time': endDate, 'Winner ID': match.player_won, 'Loser ID': match.player_lost, 'Total Rounds': match.total_rounds });
    }
    console.table(matchData);
    console.log('Total game records array length:', gameRecords.length);
}
//await SealedGames(startTime, endTime); // works with undefined for open-ended ranges

const PlayerMatches = async (mode_id: gameModeID, playerID: number, startTime: number, endTime: number | undefined) => {
    let page = 0;
    const gameRecords = [];
    const dateRange = DateInterval(startTime, endTime);
    console.log('dateRange', dateRange);

    consolidateWins: while (true) {
        page++;

        const wonMatchesAPI = await apiManager.fetchAPIData('match', 
            { sort: 'end_time', mode_id, player_won: playerID, end_time: dateRange, page });
        
        if (!wonMatchesAPI.records) break; // If there are no records, this will be null

        for (const record of wonMatchesAPI.records) {
            if (typeof endTime === 'number' && record.end_time > endTime) {
                break consolidateWins;
            }
            gameRecords.push(record);
        }

        if (page * wonMatchesAPI.perPage >= wonMatchesAPI.total ) break;
    }

    page = 0;
    consolidateLosses: while (true) {
        page++;

        const lostMatchesAPI = await apiManager.fetchAPIData('match', 
            { sort: 'end_time', mode_id, player_lost: playerID, end_time: dateRange, page });

        if (!lostMatchesAPI.records) break; // If there are no records, this will be null

        for (const record of lostMatchesAPI.records) {
            if (typeof endTime === 'number' && record.end_time > endTime) {
                break consolidateLosses;
            }
            gameRecords.push(record);
        }

        if (page * lostMatchesAPI.perPage >= lostMatchesAPI.total ) break;
    }
    gameRecords.sort((a, b) => a.end_time - b.end_time);

    const matchData = [];
    for (const match of gameRecords) {
        const endDate = new Date(match.end_time * 1000).toISOString();
        matchData.push({ 'End Time': endDate, 'Winner ID': match.player_won, 'Loser ID': match.player_lost, 'Total Rounds': match.total_rounds });
    }
    console.table(matchData);
    console.log('Total game records array length:', gameRecords.length);
}
//PlayerMatches(13, 2009776, startTime, endTime); // works with undefined endTime for open-ended ranges

// Close listener and end the script cleanly
apiManager.stopInterval();