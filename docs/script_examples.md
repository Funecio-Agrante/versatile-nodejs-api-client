# Included script examples

## Retrieve title and cover image of a Hive post

This very short script demonstrates how to fetch two components of a [Hive](https://hive.io/) blog post, using the 'POST' method.

## Gods Unchained game data

This script includes 3 functions to demonstrate how to retrieve data from the Gods Unchained API. I doesn't do anything with the data, it just displays some information in the console. 

Each example is self-contained in a function that can be turned on right after the end of the function. The functions are all disabled and you must uncomment which you intend to use.

- `ListGameModes()` - creates a table containing all the existing game modes. Useful to get the game codes to use in other requests, expecially when new modes come out.

- `SealedGames(startTime, endTime)` - counts how many Sealed games within the time range and displays a table with some game data. For testing purposes the ranges should be narrow, otherwise you will get *a lot* of records.

- `PlayerMatches(<game mode>, <player ID>, startTime, endTime)` - counts and lists information on games played by a specified player in a specified game mode. The API separates wins from losses, so the function collects data from both and combines everything in a single dataset.

Notes:

1. You must provide a date range when fetching game data. Choose whether you're interested in the start or the end time of the match, and then provide a range in Unix timestamp (seconds). 

    1. The date range must be provided formated with a dash like 12345678-12345679, but the maximum range is 72h (259200 seconds). However, if you ommit the last value ex. '12345678-' you get an open-ended dataset that goes all the way to the present day or to the start of recording (I didn't test this).

    2. The code implementation of an open-ended range is to leave `endTime` as `undefined`. Undefined `startTime` won't work, it will generate a date range like '-12345678' and that will yield a HTTP Error 400.

    3. It's not possible to request data for a whole week or a whole month for example (the selected range would be longer than 72h), but `DateInterval(startTime, endTime)` will convert it to an open-ended range and the data retrieval function will stop the data acquisition when the date is reached.

2. The API allows for fancier sorting and parameter usage than this demonstration allows. Check the documentation [here](https://github.com/immutable/gods-unchained-api) for details.

3. Sorting order ascending is hard-coded in the search parameters, as it interferes with some of the date logic in the functions. If you need to use descending, you must change `api.js` and then make sure the checks in the code are also adjusted to that, notably switch the 'greater than' signs for 'lesser than' when controlling the data aquisition loops, and perhaps adjust the logic in `DateInterval()`.