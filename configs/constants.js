// General application-wide constants
const CONTENT_TYPE_APP_URLENCODED = 'application/x-www-form-urlencoded';
const CONTENT_TYPE_APP_JSON = 'application/json';
const ENCODING_UTF8 = 'UTF-8';

// Database and caching
const DATABASE_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TIMEOUT_MS = 60 * 1000;  // 1 minute
const CACHE_UPDATE_INTERVAL_MS = 60 * 1000; // 1 minute
const CACHE_DIR = './data';
const CACHE_FILENAME = 'cacheObject.json';

// Chat related
const CHAT_REQUEST_TIMEOUT_S = 10;
const CHAT_REQUEST_RETRY_MS = 1000;

module.exports = {
    CONTENT_TYPE_APP_URLENCODED,
    CONTENT_TYPE_APP_JSON,
    ENCODING_UTF8,
    DATABASE_UPDATE_INTERVAL_MS,
    CACHE_TIMEOUT_MS,
    CACHE_UPDATE_INTERVAL_MS,
    CACHE_DIR,
    CACHE_FILENAME,
    CHAT_REQUEST_TIMEOUT_S,
    CHAT_REQUEST_RETRY_MS
};