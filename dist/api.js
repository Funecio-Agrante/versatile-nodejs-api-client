import fs from "fs";
import { EventEmitter } from 'events';
export function asEVMAddress(address) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        console.error(`Error: Invalid EVM address: ${address}`);
        process.exit(1);
    }
    return address;
}
export function asISODate(dateStr) {
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (!isoRegex.test(dateStr) || isNaN(Date.parse(dateStr))) {
        console.error(`Error: Invalid ISO date: ${dateStr}`);
        process.exit(1);
    }
    const originalDate = dateStr.replace(/\.\d+Z$/, "Z");
    const dateCheck = new Date(dateStr).toISOString().slice(0, -5) + 'Z';
    if (originalDate !== dateCheck) {
        console.error(`Error: Invalid calendar date: ${dateStr}`);
        process.exit(1);
    }
    return dateStr;
}
const envJSON = JSON.parse(fs.readFileSync("env.json", "utf-8"));
const CGapiKey = envJSON.COINGECKO_API_KEY;
export class APIManager {
    params = {};
    bucketsID = null;
    collectionAddress;
    refillEmitter = new EventEmitter();
    APIendpoints = {};
    constructor(collAddress) {
        const self = this;
        this.collectionAddress = collAddress; // To handle requests of any IMX asset/NFT collection
        this.#refillBuckets();
        this.APIendpoints = {
            'https://api.coingecko.com': {
                rateLimit: 5,
                rateHistory: [],
                currentTokens: 5,
                headers: { 'x-cg-demo-api-key': CGapiKey },
                endpoints: {
                    current_coin_price: {
                        method: 'GET',
                        pathname: `api/v3/simple/price`,
                        searchParams: {
                            get ids() { return self.params.ids; },
                            get vs_currencies() { return self.params.vs_curr; }
                        }
                    },
                    historical_coin_price: {
                        method: 'GET',
                        get pathname() { return `api/v3/coins/${self.params.coin}/history`; },
                        searchParams: {
                            get date() { return self.params.date; },
                            localization: false,
                        }
                    }
                }
            },
            'https://api.immutable.com': {
                rateLimit: 5,
                rateHistory: [],
                currentTokens: 5,
                endpoints: {
                    payments: {
                        method: 'GET',
                        pathname: '/v1/transfers', // https://docs.immutable.com/x/reference/#/operations/listTransfers
                        searchParams: {
                            page_size: 100,
                            status: 'success',
                            order_by: 'transaction_id',
                            direction: 'asc',
                            token_address: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97', // $GODS
                            get user() { return self.params.user ? asEVMAddress(self.params.user) : undefined; },
                            get receiver() { return self.params.receiver ? asEVMAddress(self.params.receiver) : undefined; },
                            get min_quantity() { return self.params.min_quantity; },
                            get min_timestamp() { return self.params.min_ts ? asISODate(self.params.min_ts) : undefined; },
                            get max_timestamp() { return self.params.max_ts ? asISODate(self.params.max_ts) : undefined; },
                            get cursor() { return self.params.cursor; }
                        }
                    },
                    sealed: {
                        method: 'GET',
                        pathname: '/v1/transfers',
                        searchParams: {
                            page_size: 100,
                            status: 'success',
                            order_by: 'transaction_id',
                            direction: 'asc',
                            token_address: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97', // $GODS
                            get user() { return self.params.user ? asEVMAddress(self.params.user) : undefined; },
                            get receiver() { return self.params.receiver ? asEVMAddress(self.params.receiver) : undefined; },
                            get min_timestamp() { return self.params.min_ts ? asISODate(self.params.min_ts) : undefined; },
                            get max_timestamp() { return self.params.max_ts ? asISODate(self.params.max_ts) : undefined; },
                            get cursor() { return self.params.cursor; }
                        }
                    },
                    card_list: {
                        method: 'GET',
                        pathname: '/v1/assets',
                        searchParams: {
                            page_size: 100,
                            order_by: 'name',
                            direction: 'asc',
                            get status() { return self.params.status; },
                            sell_orders: false,
                            buy_orders: false,
                            include_fees: false,
                            get collection() { return self.collectionAddress; },
                            get user() { return self.params.user ? asEVMAddress(self.params.user) : undefined; },
                            get cursor() { return self.params.cursor; }
                        }
                    },
                    mint_tx: {
                        method: 'GET',
                        get pathname() { return `/v2/account/${self.params.value}`; },
                        searchParams: {}
                    }
                }
            },
            'https://api.godsunchained.com': {
                rateLimit: 5,
                rateHistory: [],
                currentTokens: 5,
                endpoints: {
                    match: {
                        method: 'GET',
                        pathname: '/v0/match',
                        searchParams: {
                            get page() { return self.params.page; },
                            perPage: 1000,
                            get sort() { return self.params.sort; }, // Should prob be either start_time or end_time
                            order: 'asc',
                            get game_mode() { return self.params.mode_id; },
                            get player_won() { return self.params.player_won; },
                            get player_lost() { return self.params.player_lost; },
                            get start_time() { return self.params.start_time; }, // Unix timestamp in seconds, could be a range ex. 1743943904-1744030304
                            get end_time() { return self.params.end_time; } // Same as above
                        }
                    },
                    game_modes: {
                        method: 'GET',
                        pathname: '/v0/mode',
                        searchParams: {}
                    }
                }
            },
            'https://apollo-auth.prod.prod.godsunchained.com': {
                rateLimit: 5,
                rateHistory: [],
                currentTokens: 5,
                endpoints: {
                    gu_acc_addr: {
                        method: 'GET',
                        get pathname() { return `/v2/account/${self.params.id}`; },
                        searchParams: {}
                    }
                }
            },
            'https://api.hive.blog': {
                rateLimit: 5,
                rateHistory: [],
                currentTokens: 5,
                endpoints: {
                    hive_post_comp: {
                        method: 'POST',
                        pathname: '',
                        searchParams: {},
                        body: {
                            jsonrpc: "2.0",
                            method: "bridge.get_post",
                            params: {
                                get author() { return self.params.author; },
                                get permlink() { return self.params.permlink; },
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
                    if (value)
                        url.searchParams.append(key, value);
                }
                //console.warn(url.href);
                //process.exit(0); // for debugging
                return url;
            }
        }
        console.error(`FATAL: Endpoint ${targetEndpoint} not found.`);
        process.exit(1);
    };
    // Build the headers object for each request
    #buildHeaders = (targetEndpoint) => {
        const headers = { 'Content-Type': 'application/json' };
        for (const params of Object.values(this.APIendpoints)) {
            if (params.endpoints[targetEndpoint]) {
                Object.assign(headers, params.headers);
            }
        }
        return headers;
    };
    // Build the body object for each request
    #buildBody = (targetEndpoint) => {
        for (const params of Object.values(this.APIendpoints)) {
            if (params.endpoints[targetEndpoint]) {
                return params.endpoints[targetEndpoint].body ?? undefined; // Don't create empty body objects in this.APIendpoints
            }
        }
    };
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
            if (this.APIendpoints[baseURL].currentTokens === 0)
                await this.#waitForRefill();
            fetchCounter++;
            this.APIendpoints[baseURL].currentTokens--; // Consume a token
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                const response = await fetch(url, {
                    method: this.APIendpoints[baseURL].endpoints[type].method,
                    headers,
                    body,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    return response.json();
                }
                else if (response.status >= 429) {
                    delay = this.#expDecayDelay(fetchCounter);
                    console.warn(`${type}: Error ${response.status}: ${response.statusText} - Retrying in ${delay} seconds`);
                    await this.sleep(delay * 1000);
                }
                else {
                    console.warn(`URL: ${url}`);
                    console.error(`${type}: Error ${response.status}: ${response.statusText}`);
                    process.exit(1);
                }
            }
            catch (error) {
                if (error.name === 'AbortError' || // Timeout
                    error.name === 'TypeError' || // Network failure
                    error.message.includes('ECONN') // Connection errors
                ) {
                    delay = this.#expDecayDelay(fetchCounter);
                    console.warn(`${type}: Error ${error.name}: ${error.message} Retrying in ${delay} seconds`);
                    await this.sleep(delay * 1000);
                }
                else {
                    console.error(`${error.name}: ${error.message}`);
                    process.exit(1);
                }
            }
            if (fetchCounter > 50) {
                console.error(`FetchAPIData() yielding recurring errors fetching "${type}" data\n${url}`);
                process.exit(1);
            }
        }
    };
    // Pause function
    sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
    // Exponential backing off function to calculate the delay between API requests
    #expDecayDelay = (retry) => {
        const delay = 2 + (120 - 2) * (1 - Math.pow(1.5, -0.06 * retry));
        return Math.round(delay);
    };
    // Rate limiting via token bucket algorithm
    #refillBuckets = () => {
        this.bucketsID = setInterval(() => {
            for (const params of Object.values(this.APIendpoints)) {
                params.rateHistory.push(params.rateLimit - params.currentTokens); // Just for calculating and reporting the request rate
                if (params.rateHistory.length > 5)
                    params.rateHistory.shift(); // Remove oldest count. Same as above
                params.currentTokens = params.rateLimit;
            }
            this.refillEmitter.emit('refill');
        }, 1000);
    };
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
}
;
