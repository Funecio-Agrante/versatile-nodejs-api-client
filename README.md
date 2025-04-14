# Versatile Javascript API Client Class

A Node.js Class able to manage generic API 'GET' and 'POST' requests to multiple servers.

The repository also includes a number of scripts with real-case examples, demonstrating usage of the Class to obtain data. I will be expanding the list of examples over time.

It simplifies ad-hoc API requests by delegating rate-limit and error handling to a self-contained class, requiring only initial endpoint configuration and headers configuartion, if necessary.

## Features

- Asynchronous queues for simple, individual tasks

- Can handle both GET and POST requests

- Supports multiple servers and endpoint configurations

- HTTP error handling

- Can incorporate an authentication key when necessary

- Can incorporate custom headers when necessary

- Token bucket algorithm to manage rate limits per server

- Automatic retries with exponential backoff

- Exposes the 5-second rolling request rate per server

- TypeScript support

## Missing features

- No rate-limit management for multiple concurrent processes to the same server

- Send me suggestions for new features!

## Installation

1. [Download](https://nodejs.org/en/download) and install Node.js (tested with v22.2.0) 

2. Clone the repository. There are no dependencies to install.

3. Make edits to reflect your requirements and import the class into your project. See the real-case scripts for usage examples.

4. If you need to set up API Keys or any other environment variables, create a JSON file (in my case `env.json`) and save the keys like in the example below and edit `api.js` accordingly.

    ```
    {
        "COINGECKO_API_KEY": "your-key-here"
    }
    ```

## Usage

1. Following the established pattern, modify `this.APIendpoints` to include the servers you need to use and the corresponding rate-limit, headers, body, endpoints and their parameters. 

    1. The endpoint names must be unique. 
    
    2. Only create `body` objects where necessary, and don't leave them empty.

2. To obtain data from an endpoint, 

    1. `import` / `require` the Class into your script, ex.:
    
        `import { APIManager } from './api.js';`

    2. Initialize a new instance: 
    
        `const apiManager = new APIManager();`

    3. Call the fetching function and assign the result to a variable:

        `const cardList = await apiManager.fetchAPIData('card_list', { user: 'value1', status: 'value2', cursor });`

        - The first term (ex. 'card_list') corresponds to the particular endpoint configuration you intend to use.

        - The second term is an object where the keys / value pair corresponds to the URL or `body` parameters. You need to match the key name to the corresponding getter function property value in `this.APIendpoints`.

        - If you make the key name the same as the variable name you want to pass along, you can use property shorthands (ex. `cursor`).

        - You can uncomment the debug lines in the `#buildURL` method to inspect how URLs are constructed.

## Included examples

For an overview of the example scripts, see [this](docs/script_examples.md) page.

## License

This code is licensed under the [CC-BY-4.0](LICENSE).

You are free to use, modify, and distribute the code as long as you include proper attribution. See the [LICENSE](LICENSE) file for details.