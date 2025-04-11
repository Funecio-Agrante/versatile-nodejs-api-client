import fs from "fs";
import { EventEmitter } from 'events';

const envJSON = JSON.parse(fs.readFileSync("env.json", "utf-8"));
const CGapiKey = envJSON.COINGECKO_API_KEY;

export class APIManager {
  constructor(collAddress) { // For GU cards: 0xacb3c6a43d15b907e8433077b6d38ae40936fe2c
    const self = this;
    this.params = {};
    this.bucketsID = null;
    this.collectionAddress = collAddress; // To handle requests of any IMX asset/NFT collection
    this.refillEmitter = new EventEmitter(); 
    this.#refillBuckets();
    this.APIendpoints = {
      'https://api.coingecko.com': {
        rateLimit: 5,
        rateHistory: [],
        currentTokens: 5,
        method: 'GET',
        headers: { 'x-cg-demo-api-key': CGapiKey },
        endpoints: {
          current_coin_price: {
            pathname: `api/v3/simple/price`,
            searchParams: {
              get ids() { return self.params.ids },
              get vs_currencies() { return self.params.vs_curr }
            }
          },
          historical_coin_price: {
            get pathname() {return `api/v3/coins/${self.params.coin}/history`},
            searchParams: {
              get date() { return self.params.date },
              localization: false,
            }
          }
        }
      },
    
      'https://api.immutable.com': {
        rateLimit: 5,
        rateHistory: [],
        currentTokens: 5,
        method: 'GET',
        endpoints: {
          payments: {
            pathname: '/v1/transfers', // https://docs.immutable.com/x/reference/#/operations/listTransfers
            searchParams: {
              page_size: 100,
              status: 'success',
              order_by: 'transaction_id',
              direction: 'asc',
              token_address: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97', // $GODS
              get user() { return self.params.user },
              get receiver() { return self.params.receiver },
              get min_quantity() { return self.params.min_quantity },
              get min_timestamp() { return self.params.min_ts },
              get max_timestamp() { return self.params.max_ts },
              get cursor() { return self.params.cursor }
            }
          },
          sealed: {
            pathname: '/v1/transfers',
            searchParams: {
              page_size: 100,
              status: 'success',
              order_by: 'transaction_id',
              direction: 'asc',
              token_address: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97', // $GODS
              get user() { return self.params.user },
              get receiver() { return self.params.receiver },
              get min_timestamp() { return self.params.min_ts },
              get max_timestamp() { return self.params.max_ts },
              get cursor() { return self.params.cursor }
            }
          },
          card_list: {
            pathname: '/v1/assets',
            searchParams: {
              page_size: 100,
              order_by: 'name',
              direction: 'asc',
              get status() { return self.params.status },
              sell_orders: false,
              buy_orders: false,
              include_fees: false,
              get collection() { return self.collectionAddress },
              get user() { return self.params.user },
              get cursor() { return self.params.cursor }
            }
          },
          mint_tx: { // Example without parameters
            get pathname() { return `/v2/account/${self.params.value}` },
            searchParams: {}
          }
        }
      },
    
      'https://api.godsunchained.com': {
        rateLimit: 5,
        rateHistory: [],
        currentTokens: 5,
        method: 'GET',
        endpoints: {
          match: { // Reference: https://github.com/immutable/gods-unchained-api#get-match-
            pathname: '/v0/match',
            searchParams: {
              get page() { return self.params.page },
              perPage: 1000,
              get sort() { return self.params.sort}, // Should prob be either start_time or end_time
              order: 'asc',
              get game_mode() { return self.params.mode_id },
              get player_won() { return self.params.player_won },
              get player_lost() { return self.params.player_lost },
              get start_time() { return self.params.start_time }, // Unix timestamp in seconds, could be a range ex. 1743943904-1744030304
              get end_time() { return self.params.end_time }      // Same as above
            }
          },
          game_modes: {
            pathname: '/v0/mode',
            searchParams: {}
          }
        }
      },

      'https://apollo-auth.prod.prod.godsunchained.com': {
        rateLimit: 5,
        rateHistory: [],
        currentTokens: 5,
        method: 'GET',
        endpoints: {
          gu_acc_addr: { // Example: https://apollo-auth.prod.prod.godsunchained.com/v2/account/11950
            get pathname() { return `/v2/account/${self.params.id}`; },
            searchParams: {}
          }
        }
      },

      'https://api.hive.blog': {
        rateLimit: 5,
        rateHistory: [],
        currentTokens: 5,
        method: 'POST',
        endpoints: {
          hive_post_comp: { 
            pathname: '',
            searchParams: {},
            body: {
              jsonrpc: "2.0",
              method: "bridge.get_post",
              params: {
                get author() { return self.params.author },
                get permlink() { return self.params.permlink },
              },
              "id": 1
            }
          }
        }
      },
    };
  }

  // Calculate and expose the request rate for a given endpoint
  requestRateFor(targetEndpoint) {
    for (const params of Object.values(this.APIendpoints)) {
      if (params.endpoints[targetEndpoint]) {
        const rollingRequestRate = params.rateHistory.reduce((sum, count) => sum + count, 0) / params.rateHistory.length;
        return rollingRequestRate.toFixed(1); // Trim to 1 decimal place
      }
    }

    console.error(`FATAL: Endpoint ${targetEndpoint} not found.`);
    process.exit(1);
  }

  // Build the URL for each request
  #buildURL = (targetEndpoint) => {
    for (const [baseURL, params] of Object.entries(this.APIendpoints)) {
      if (params.endpoints[targetEndpoint]) {
        const url = new URL(baseURL);
        url.pathname = params.endpoints[targetEndpoint].pathname;
        for (const [key, value] of Object.entries(params.endpoints[targetEndpoint].searchParams)) {
          if (value) url.searchParams.append(key, value);
        }
        //console.warn(url.href);
        //process.exit(0); // for debugging
        return url;
      }
    }
  
    console.error(`FATAL: Endpoint ${targetEndpoint} not found.`);
    process.exit(1);
  }

  // Build the headers object for each request
  #buildHeaders = (targetEndpoint) => {
    const headers = {};
    for (const params of Object.values(this.APIendpoints)) {
      if (params.endpoints[targetEndpoint]) {
        Object.assign(headers, params.headers);
      }
    }
    headers['Content-Type'] = 'application/json';
    return headers;
  }

  // Build the body object for each request
  #buildBody = (targetEndpoint) => {
    for (const params of Object.values(this.APIendpoints)) {
      if (params.endpoints[targetEndpoint]) {
        return params.endpoints[targetEndpoint].body ?? undefined; // Don't create empty body objects in this.APIendpoints
      }
    }
  }

  // Fetch the data from the API
  fetchAPIData = async (type, parameters = {}) => {
    this.params = { ...parameters };
    let fetchCounter = 0;
    let delay;
    const url = this.#buildURL(type);
    const baseURL = url.origin;
    const headers = this.#buildHeaders(type);
    const body = JSON.stringify(this.#buildBody(type), null, 2); // Stringify to resolve the getters

    while (true) {
      if (this.APIendpoints[baseURL].currentTokens === 0) await this.#waitForRefill();
      
      fetchCounter++;
      this.APIendpoints[baseURL].currentTokens--; // Consume a token
      
      try {
        const response = await fetch(url, {
          method: this.APIendpoints[baseURL].method,
          headers,
          body,
          timeout: 5000,
        });
  
        if (response.ok) {
          return response.json();

        } else if (response.status >= 429) {
          delay = this.#expDecayDelay(fetchCounter);
          console.warn(`${type}: Error ${response.status}: ${response.statusText} - Retrying in ${delay} seconds`);
          await this.sleep(delay * 1000);
        
        } else {
          console.warn(`URL: ${url}`);
          console.error(`${type}: Error ${response.status}: ${response.statusText}`);
          process.exit(1);
        }
  
      } catch (error) {
        if (
          error.name === 'AbortError' || // Timeout
          error.name === 'TypeError' ||  // Network failure
          error.message.includes('ECONN') // Connection errors
          ) { 
          delay = this.#expDecayDelay(fetchCounter);
          console.warn(`${type}: Error ${error.name}: ${error.message} Retrying in ${delay} seconds`);
          await this.sleep(delay * 1000);

        } else {
          console.error(`${error.name}: ${error.message}`);
          process.exit(1);
        }
      }
  
      if (fetchCounter > 50) {
        console.error(`FetchAPIData() yielding recurring errors fetching "${type}" data\n${url}`);
        process.exit(1);
      }
    }
  }

  // Pause function
  sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Exponential backing off function to calculate the delay between API requests
  #expDecayDelay = (x) => {
    return parseInt(2 + (120 - 2) * (1 - Math.pow(1.5, -0.06 * x)));
  }

  // Rate limiting via token bucket algorithm
  #refillBuckets = () => {
    this.bucketsID = setInterval(() => {
      for (const params of Object.values(this.APIendpoints)) {
        params.rateHistory.push(params.rateLimit - params.currentTokens); // Just for calculating and reporting the request rate
        if (params.rateHistory.length > 5) params.rateHistory.shift(); // Remove oldest count. Same as above
        params.currentTokens = params.rateLimit;
      }

      this.refillEmitter.emit('refill');
    }, 1000);
  }

  #waitForRefill = () => {
    return new Promise(resolve => {
      this.refillEmitter.once('refill', resolve);
    });
  };

  // Clean up at the end of the execution
  stopInterval() {
    if (this.bucketsID) {
      clearInterval(this.bucketsID);
      this.bucketsID = null;
    }
  }
};
