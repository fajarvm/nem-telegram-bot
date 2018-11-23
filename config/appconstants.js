module.exports = Object.freeze({
    // General application-wide constants
    CONTENT_TYPE_APP_URLENCODED: 'application/x-www-form-urlencoded',
    CONTENT_TYPE_APP_JSON: 'application/json',
    ENCODING_UTF8: 'UTF-8',

    // Database and caching
    DATABASE_UPDATE_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
    CACHE_TIMEOUT_MS: 60 * 1000,  // 1 minute
    CACHE_UPDATE_INTERVAL_MS: 60 * 1000, // 1 minute
    CACHE_FILE_PATH: './data/cache.json',

    // Chat related
    CHAT_REQUEST_TIMEOUT_S: 10,
    CHAT_REQUEST_RETRY_MS: 1000,

    // Currencies
    ISO_CODE_BTC: 'BTC',
    ISO_CODE_EUR: 'EUR',
    ISO_CODE_NEM: 'NEM',
    ISO_CODE_USD: 'USD',
    ISO_SYMBOL_EUR: '€',
    ISO_SYMBOL_NEM: 'XEM',
    ISO_SYMBOL_USD: '$'
});
