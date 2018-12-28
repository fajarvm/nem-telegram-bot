'use strict';

// Modules
const axios = require('axios');
const queryString = require('querystring');

// Application modules
const Config = require('./configs/api_configs');
const Constants = require('./configs/constants');
const Utils = require('./utils/utilities');
const FormattedMarketData = require('./model/FormattedMarketData');
const CacheManager = require('./CacheManager');

/**
 * @class MarketDataManager
 * @author Fajar van Megen
 * @description A class that regularly fetches market data from CoinGecko endpoint.
 * @example
 *      const MarketDataManager = require('MarketDataManager');
 *      const DataManger = new MarketDataManager(true); // set constructor parameter to 'true' to include sparkline data
 *      DataManger.start(); // to start the process
 *      DataManger.stop();  // to end it
 * @public
 * @version 0.2.5
 * @license MIT, GPL3
 */
class MarketDataManager {
    constructor(includeSparkline = false) {
        // prepare caching
        this._cacheManager = new CacheManager(Constants.CACHE_DIR, Constants.CACHE_FILENAME, Constants.CACHE_TIMEOUT_MS);

        // Request options for the HTTP client
        this._httpClient = axios.create({baseURL: Config.CG_API_URL});
        this._includeSparkline = includeSparkline;
        const params = {
            market_data: true,
            sparkline: this._includeSparkline,
            community_data: false,
            developer_data: false,
            localization: false,
            tickers: false
        };
        this._requestOptions = this._buildRequestOption(params);
        this._intervalObject = null;
    }

    get marketDataObject() {
        return this._marketDataObject;
    }

    get cacheManager() {
        return this._cacheManager;
    }

    get httpClient() {
        return this._httpClient;
    }

    get requestOptions() {
        return this._requestOptions;
    }

    get instance() {
        return this;
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this._fetchMarketData(); // initial call to populate the cache object

                MarketDataManager._log('Starting data manager...');
                this._intervalObject = setInterval(() => {
                        // passing the instance as the application context,
                        // otherwise reference to 'this' would get lost in an anonymous function
                        this._fetchMarketData(this.instance);
                    },
                    Constants.CACHE_UPDATE_INTERVAL_MS
                );

                resolve('OK');
            } catch (error) {
                reject(error);
            }
        });
    }

    stop() {
        MarketDataManager._log('Stopping data manager...');

        return new Promise((resolve, reject) => {
            try {
                clearInterval(this._intervalObject);
                this.intervalObject = null;
                this._isCommunicating = null;

                MarketDataManager._log('Data manager has stopped.');

                resolve('OK');
            } catch (error) {
                reject(error);
            }
        });
    }

// ----------------------------------------- protected/private methods ----------------------------------------- //

    _fetchMarketData(context = null) {
        if (Utils.isNullOrUndefined(context)) {
            context = this;
        }

        if (context._isCommunicating) {
            MarketDataManager._log('Warning: Already communicating with the endpoint. Ignoring data request.');
        } else {
            context._isCommunicating = true;
            MarketDataManager._log('Communicating with the endpoint. Requesting data...');

            context.httpClient.request(context.requestOptions)
                .then((response) => {
                    context._handleResponse(response);
                })
                .catch((error) => {
                    context._handleErrorResponse(error);
                })
                .finally(()=>{
                    context._isCommunicating = false;
                    MarketDataManager._log('Communication with the endpoint is closed.');
                    }
                );
        }
    }

    _buildRequestOption(params, path = '') {
        if (path === '') {
            path = Config.CG_API_PATH;
        }

        if (!Utils.isObject(params)) {
            params = undefined;
        }

        return {
            url: path,
            headers: {
                'Content-type': Constants.CONTENT_TYPE_APP_URLENCODED,
                'Accept': Constants.CONTENT_TYPE_APP_JSON,
                'Accept-Encoding': 'deflate, gzip'
            },
            params: params,
            paramsSerializer: function (params) {
                return queryString.stringify(params);
            }
        };
    }

    _handleResponse(response) {
        if (Utils.isNullOrUndefined(response)) {
            MarketDataManager._log('Warning: Undefined response from server.');
        } else {
            const statusText = Utils.isNullOrUndefined(response.statusText) ? 'Unknown' : response.statusText;
            MarketDataManager._log('Response from server: ' + statusText + ' (' + response.status + ')');

            if (String(response.status) === '200') {
                this._cacheManager.update(response.data).then(
                    (success) => {
                        this._marketDataObject = new FormattedMarketData(this.cacheManager.cacheObject.data);
                        MarketDataManager._log('cacheObject is updated successfully.');
                    },
                    (error) => {
                        MarketDataManager._log('Failed updating cacheObject. Error: ' + error);
                    }
                );
            }
        }
    }

    _handleErrorResponse(error) {
        if (error.response) {
            // Error when server responded with a status code grater than 2xx
            MarketDataManager._log('Error status: ' + error.response.status);
            MarketDataManager._log('Error data: \n' + error.response.data);
        } else {
            MarketDataManager._log(error.message); // Error when setting up the request
        }
    }

    static _log(msg) {
        void Utils.consoleLog('MarketDataManager', msg);
    }
}

module.exports = exports = MarketDataManager;
