// General application-wide constants
const CONTENT_TYPE_APP_URLENCODED = 'application/x-www-form-urlencoded';
const CONTENT_TYPE_APP_JSON = 'application/json';
const ENCODING_UTF8 = 'UTF-8';

// Database and caching
const DATABASE_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TIMEOUT_MS = 60 * 1000;  // 1 minute
const CACHE_UPDATE_INTERVAL_MS = 60 * 1000; // 1 minute
const DATA_DIR = './data';
const CACHE_FILENAME = 'cacheObject.json';
const SPARKLINE_IMAGE_WIDTH = 200; // in pixels
const SPARKLINE_IMAGE_HEIGHT = 50; // in pixels

// Chat related
const CHAT_REQUEST_TIMEOUT_S = 10;
const CHAT_REQUEST_RETRY_MS = 1000;

// Ordered alphabetically
module.exports = {
    DATA_DIR,
    CACHE_FILENAME,
    CACHE_TIMEOUT_MS,
    CACHE_UPDATE_INTERVAL_MS,
    CHAT_REQUEST_RETRY_MS,
    CHAT_REQUEST_TIMEOUT_S,
    CONTENT_TYPE_APP_JSON,
    CONTENT_TYPE_APP_URLENCODED,
    DATABASE_UPDATE_INTERVAL_MS,
    ENCODING_UTF8,
    SPARKLINE_IMAGE_WIDTH,
    SPARKLINE_IMAGE_HEIGHT
};
