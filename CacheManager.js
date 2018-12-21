'use strict';

// Modules
const fs = require('fs');
const Utils = require('./utils/utilities');

class CacheManager {

    constructor(cacheDir = '', cacheFilename = '', cacheTimeoutMs = null) {
        // create empty cache object
        this._cacheObject = {
            request_time_ms: 0,
            expiry_time_ms: 0,
            data: null
        };

        // empty option
        this._options = {
            cache_directory: null,
            cache_filename: null,
            cache_filepath: null,
            cache_timeout_ms: null,
            cache_encoding: null
        };

        this._options.cache_directory = Utils.isEmptyString(cacheDir) ? CacheManager.DEFAULT_CACHE_DIR : cacheDir;
        this._options.cache_filename = Utils.isEmptyString(cacheFilename) ? CacheManager.DEFAULT_CACHE_FILENAME : cacheFilename;
        this._options.cache_filepath = this._options.cache_directory + '/' + this._options.cache_filename;
        this._options.cache_timeout_ms = Utils.isNumber(cacheTimeoutMs) ? CacheManager.DEFAULT_CACHE_TIMEOUT_MS : cacheTimeoutMs;
        this._options.cache_encoding = CacheManager.DEFAULT_ENCODING_UTF8;
        this._checkDirectorySync();
    }

    get cacheObject() {
        return this._cacheObject;
    }

    // async process
    read() {
        return new Promise((resolve, reject) => {
            fs.readFile(
                this._options.cache_filepath,
                this._options.cache_encoding,
                (error, data) => {
                    if (error) {
                        CacheManager._log('Error while reading or writing a file. IO Error: ' + error);
                        reject(error);
                    } else {
                        resolve(JSON.parse(data));
                    }
                });
        });
    }

    update(newData) {
        return new Promise((resolve, reject) => {
            if (Utils.isNullOrUndefined(newData) || Utils.isNullOrUndefined(newData.market_data)) {
                CacheManager._log('Warning: new data is undefined or null. Cache update aborted.');
                reject(false);
            } else {
                const timestamp = Date.now();
                this._cacheObject.request_time_ms = timestamp;
                this._cacheObject.expiry_time_ms = timestamp + this._options.cache_timeout_ms;
                this._cacheObject.data = newData.market_data;

                CacheManager._log('Data cacheObject is updated. New expiration time is: ' + this._cacheObject.expiry_time_ms);

                // writing asynchronously
                fs.writeFile(
                    this._options.cache_filepath,
                    JSON.stringify(this._cacheObject),
                    this._options.cache_encoding,
                    (error) => {
                        if (error) {
                            CacheManager._log('Error while writing a cacheObject file. IO Error: ' + error);
                            reject(error);
                        } else {
                            CacheManager._log('Cache file is written successfully.');
                            resolve(true);
                        }
                    });
            }
        });
    }

// ----------------------------------------- protected/private methods ----------------------------------------- //

    // synced process
    _checkDirectorySync() {
        if (!fs.existsSync(this._options.cache_directory)) {
            fs.mkdirSync(this._options.cache_directory);
            CacheManager._log('Cache directory created');
        }
    }

    static _log(msg) {
        void Utils.consoleLog('CacheManager', msg);
    }
}

CacheManager.DEFAULT_CACHE_DIR = './data';
CacheManager.DEFAULT_CACHE_FILENAME = 'cacheObject.json';
CacheManager.DEFAULT_CACHE_FILEPATH = CacheManager.DEFAULT_CACHE_DIR + '/' + CacheManager.DEFAULT_CACHE_FILENAME;
CacheManager.DEFAULT_CACHE_TIMEOUT_MS = 6000; // 1 minute
CacheManager.DEFAULT_ENCODING_UTF8 = 'UTF-8';

module.exports = exports = CacheManager;