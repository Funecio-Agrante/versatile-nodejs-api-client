# Included script examples

## Retrieve title and cover image of a Hive post

This very short script demonstrates how to fetch two components of a [Hive](https://hive.io/) blog post, using the 'POST' method.

## Gods Unchained game data

This script includes 3 functions to demonstrate how to retrieve data from the Gods Unchained API. I doesn't do anything with the data, it just displays some information in the console. The functions are all disabled and you must uncomment which you intend to use.

- `ListGameModes()` - creates a table containing all the existing game modes. Useful to get the game codes to use in other requests, expecially when new modes come out.

- `SealedGames(startTime, endTime)` - counts how many Sealed games within the time range and displays a table with some game data. For testing purposes the ranges should be narrow, otherwise you will get *a lot* of records.

- `PlayerMatches(<game mode>, <player ID>, startTime, endTime)` - counts and lists information on games played by a specified player in a specified game mode. The API separates wins from losses, so the function collects data from both and combines everything in a single dataset.

Notes:

1. You must provide a date range when fetching game data. Choose whether you're interested in the start or the end time of the match, and then provide a range in Unix timestamp (seconds). 

    1. If you want an open-ended range - all records from date x until now or all records from date y until the earliest record - leave the corresponding date as `undefined`.

    2. Weirdly, the API only accepts date ranges up to 72h. If your selected range is longer than that, `DateInterval(startTime, endTime)` will convert it to an open-ended range and the data retrieval function will then check if the limit was reached and stop collecting data.

2. The API allows for fancier sorting and parameter usage than this demonstration allows. Check the documentation [here](https://github.com/immutable/gods-unchained-api) for details.

3. Sorting order ascending is hard-coded in the search parameters, as it interferes with some of the date logic in the functions. If you need to use descending, you must change `api.js` and then make sure the checks in the code are also adjusted to that.