'use strict';

// Modules
const axios = require('axios');
const fs = require('fs');
const queryString = require('querystring');
const window = require('svgdom');
const document = window.document;
const SVG = require('svg.js')(window);
const svg2img = require('svg2img');

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
        this._cacheManager = new CacheManager(Constants.DATA_DIR, Constants.CACHE_FILENAME, Constants.CACHE_TIMEOUT_MS);

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
        this._sparklineImagePath = MarketDataManager.DEFAULT_SPARKLINE_PATH;
        this._canvas = SVG(document.documentElement).size(Constants.SPARKLINE_IMAGE_WIDTH, Constants.SPARKLINE_IMAGE_HEIGHT);
        this._chartObj = this._canvas.fill('none').stroke({color: 'orange', width: 2});
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

    get sparklineImagePath() {
        return this._sparklineImagePath;
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
                .finally(() => {
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

                        this._generateSparklineImage();
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

    _generateSparklineImage() {
        if (this._includeSparkline) {
            // plot sparkline chart
            let values = this._getSparklineValue(this._marketDataObject.getSparkline7dInUsd());
            this._chartObj.polyline(values);

            // save to an image file
            try {
                svg2img(this._canvas.svg(),
                    {
                        'width': Constants.SPARKLINE_IMAGE_WIDTH,
                        'height': Constants.SPARKLINE_IMAGE_HEIGHT
                    },
                    (error, buffer) => {
                        fs.writeFileSync(this._sparklineImagePath, buffer);
                    });

                MarketDataManager._log('Sparkline image is saved.');
            } catch (error) {
                MarketDataManager._log('Failed saving sparkline image. Error: ' + error);
            }
        }
    }

    // calculate raw data into 2D points on Canvas
    _getSparklineValue(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);

        let values = '';
        let unit = 100 / (max - min);
        for (let i = 0; i < data.length; i++) {
            const val = data[i];
            let y = (Constants.SPARKLINE_IMAGE_HEIGHT - (((val - min) * unit) / 100) * Constants.SPARKLINE_IMAGE_HEIGHT);
            // console.log("y=" + (((val - min) * unit) / 100));
            values += i + ', ' + y;
            if (i < (data.length - 1)) {
                values += ' ';
            }
        }
        return values;
    }

    static _log(msg) {
        void Utils.consoleLog('MarketDataManager', msg);
    }
}

MarketDataManager.DEFAULT_SPARKLINE_DIR = './data';
MarketDataManager.DEFAULT_SPARKLINE_FILENAME = 'sparkline.png';
MarketDataManager.DEFAULT_SPARKLINE_PATH = MarketDataManager.DEFAULT_SPARKLINE_DIR + '/' + MarketDataManager.DEFAULT_SPARKLINE_FILENAME;

module.exports = exports = MarketDataManager;
