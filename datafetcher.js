const Config = require('./config/apiconfig');
const Constants = require('./config/appconstants');
let fs = require('fs');

// Caching
let cacheObj = {
    request_time_ms: 0,
    expiry_time_ms: 0,
    data: null
};

// HTTP client
const axios = require('axios');
const queryString = require('querystring');
let httpClient = axios.create({baseURL: Config.CG_API_URL, timeout: Config.CG_API_TIMEOUT});
let requestOptions = {
    url: Config.CG_API_PATH,
    headers: {
        'Content-type': Constants.CONTENT_TYPE_APP_URLENCODED,
        'Accept': Constants.CONTENT_TYPE_APP_JSON,
        'Accept-Encoding': 'deflate, gzip'
    },
    params: {
        market_data: true,
        sparkline: true,
        community_data: false,
        developer_data: false,
        localization: false,
        tickers: false
    },
    paramsSerializer: function (params) {
        return queryString.stringify(params);
    }
};

// Local variables
let isLoggingEnabled = true;
let isCommunicating = false;

init();

function init() {
    // Data update in intervals
    updateDataFromEndpoint();
    setInterval(updateDataFromEndpoint, Constants.CACHE_UPDATE_INTERVAL_MS);
}

function updateDataFromEndpoint() {
    if (isCommunicating) {
        _log('Warning: Already communicating with the endpoint. Ignoring data import.');
    } else {
        isCommunicating = true;
        _log('Communicating with the endpoint. Retrieving data for import.');

        httpClient.request(requestOptions)
            .catch(catchCommunicationErrors)
            .then(handleResponse);
    }
}

function handleResponse(response) {
    if (isNullOrUndefined(response)) {
        _log('Warning: Undefined response from server.');
    } else {
        const statusText = isNullOrUndefined(response.statusText) ? 'Unknown' : response.statusText;
        _log('Response from server: ' + statusText + ' (' + response.status + ')');

        if (String(response.status) === '200') {
            updateCache(response.data);
        }
    }

    isCommunicating = false;
    _log('Communication is closed.');
}

function updateCache(newData) {
    if (isNullOrUndefined(newData) || isNullOrUndefined(newData.market_data)) {
        _log('Warning: new data is undefined or null. Cache update aborted.');
    } else {
        const now = new Date();
        const timestamp = now.getTime();
        cacheObj.request_time_ms = timestamp;
        cacheObj.expiry_time_ms = timestamp + Constants.CACHE_TIMEOUT_MS;
        cacheObj.data = newData.market_data;

        _log('Data cache is updated. Expiration time is ' + cacheObj.expiry_time_ms);

        // writing asynchronously
        fs.writeFile(Constants.CACHE_FILE_PATH, JSON.stringify(cacheObj), Constants.ENCODING_UTF8, function (error) {
            if (error) {
                _log('Error while writing a cache file. IO Error: ' + error);
            } else {
                _log('Cache file is written successfully.');
            }
        });
    }
}

function catchCommunicationErrors(error) {
    if (error.response) {
        // Request sent. But the server responded with a status code grater than 2xx
        _log('Error status: ' + error.response.status);
        _log('Error data: ');
        _log(error.response.data);
        // _log(error.response.headers);
    } else {
        // Error when setting up the request
        _log(error.message);
    }

    isCommunicating = false;
    _log('Communication is closed.');
    // _log(error.config);
}

function _log(msg) {
    if (isLoggingEnabled) {
        console.log(new Date().toISOString() + ' | DataFetcher: ' + msg);
    }
}

function isNullOrUndefined(obj) {
    return obj === undefined || obj === null;
}
