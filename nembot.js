const Config = require('./config/apiconfig');
const Constants = require('./config/appconstants');
const ChatConstants = require('./config/chatconstants');
const currency = require('currency-formatter');
var fs = require('fs');

// Telegram
const TelegramBot = require('node-telegram-bot-api');
const teleBot = new TelegramBot(Config.TELEGRAM_BOT_API_TOKEN, {polling: true});

// Caching
var cacheObj = {
    request_time_ms: 0,
    expire_time_ms: 0,
    data: null
};

// Local variables
const isLoggingEnabled = true;
const isFeelingFunny = false;
const usFormat = {precision: 0, thousand: ',', decimal: '.', format: '%v'};

_log("NEMbot has started.");

teleBot.on("text", function (message) {
    // Note: message.date is UNIX time in SECONDS (JavaScript/ECMA Script Date.now() works with milliseconds)
    // Ignore request older than CHAT_TIMEOUT_SECONDS into the past
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if ((nowInSeconds - message.date) > Constants.CHAT_REQUEST_TIMEOUT_S) {
        _log("Ignored. Chat message timestamp is older than " + Constants.CHAT_REQUEST_TIMEOUT_S + " seconds ago ");
        // no-op
        return;
    }

    const chatId = message.chat.id;
    if (message.text.toLowerCase().indexOf("/price") === 0) {
        requestData(sendPriceData, chatId);
    }

    if (message.text.toLowerCase().indexOf("/stats") === 0) {
        requestData(sendStatsData, chatId);
    }

    if (message.text.toLowerCase().indexOf("/marketcap") === 0) {
        requestData(sendMarketCapData, chatId);
    }
});

function requestData(callback, chatId) {
    if (isCacheEmptyOrExpired()) {
        readCacheFile(callback, chatId);
    } else {
        callback(chatId);
    }
}

function sendPriceData(chatId, attempt) {
    if (attempt === undefined) {
        attempt = 1;
    }

    if (isCacheEmptyOrExpired()) {
        if (attempt >= 3) {
            _log("Warning: Unexpected result. Could not retrieve price data from server.");
            return;
        }
        attempt++;
        setTimeout(sendPriceData, Constants.CHAT_REQUEST_RETRY_MS, chatId, attempt);
    } else {
        sendPriceDataToChat(chatId);
    }
}

function sendStatsData(chatId, attempt) {
    if (attempt === undefined) {
        attempt = 1;
    }

    if (isCacheEmptyOrExpired()) {
        if (attempt >= 3) {
            _log("Warning: Unexpected result. Could not retrieve price data from server.");
            return;
        }
        attempt++;
        setTimeout(sendStatsData, Constants.CHAT_REQUEST_RETRY_MS, chatId, attempt);
    } else {
        sendStatsDataToChat(chatId);
    }
}

function sendMarketCapData(chatId, attempt) {
    if (attempt === undefined) {
        attempt = 1;
    }

    if (isCacheEmptyOrExpired()) {
        if (attempt >= 3) {
            _log("Warning: Unexpected result. Could not retrieve price data from server.");
            return;
        }
        attempt++;
        setTimeout(sendMarketCapData, Constants.CHAT_REQUEST_RETRY_MS, chatId, attempt);
    } else {
        sendMarketCapDataToChat(chatId);
    }
}

function sendPriceDataToChat(chatId) {
    const msg = getPriceWithRandomMessage(chatId);

    sendMessage(chatId, msg);
}

function sendStatsDataToChat(chatId) {
    const h1 = parseFloat(cacheObj.data.percent_change_1h);
    const h24 = parseFloat(cacheObj.data.percent_change_24h);
    const d7 = parseFloat(cacheObj.data.percent_change_7d);
    const volEur = parseFloat(cacheObj.data["24h_volume_eur"]);
    const volUsd = parseFloat(cacheObj.data["24h_volume_usd"]);

    const msg = "Price movements: " +
        "\n1h" + getSignIcon(h1) + "" + h1 + "% | 24h" + getSignIcon(h24) + "" + h24 + "% | " + "7d" + getSignIcon(d7) + "" + d7 + "%" +
        "\nVolume (24h): " +
        "\n" + Constants.ISO_SYMBOL_USD + currency.format(volUsd, usFormat) +
        " | " + Constants.ISO_SYMBOL_EUR + currency.format(volEur, usFormat);

    sendMessage(chatId, msg);
}

function sendMarketCapDataToChat(chatId) {
    const capUsd = parseFloat(cacheObj.data.market_cap_usd);
    const capEur = parseFloat(cacheObj.data.market_cap_eur);

    const msg = "Market Cap: " +
        "\n" + Constants.ISO_SYMBOL_USD + currency.format(capUsd, usFormat) +
        " | " + Constants.ISO_SYMBOL_EUR + currency.format(capEur, usFormat);

    sendMessage(chatId, msg);
}

function getSignIcon(floatNumber) {
    if (floatNumber === 0.000) {
        return "";
    }

    return floatNumber < 0 ? "▼" : "▲";
}

function isCacheEmptyOrExpired() {
    if (isNullOrUndefined(cacheObj) || isNullOrUndefined(cacheObj.data)) {
        _log("Data cache is null or undefined.");
        return true;
    }

    if (isNullOrUndefined(cacheObj.expire_time_ms)) {
        _log("Data cache expiration time is null or undefined.");
        return true;
    }

    var diff = Date.now() - cacheObj.expire_time_ms;
    if (diff > 0) {
        _log("Data cache has expired. Expiration time was: " + cacheObj.expire_time_ms);
        return true;
    }

    return false;
}

function readCacheFile(callback, param1) {
    fs.readFile(Constants.CACHE_FILE_PATH, Constants.UTF8, function (error, data) {
        if (error) {
            catchFileIOErrors(error);
        } else {
            cacheObj = JSON.parse(data);
            callback(param1);
        }
    });
}

function getPrice(curr) {
    var priceTag = "NaN";
    switch (curr) {
        case Constants.ISO_CODE_BTC:
            var inSatoshi = parseFloat(cacheObj.data.price_btc) * 100000000;
            priceTag = inSatoshi.toFixed(0);
            break;
        case Constants.ISO_CODE_EUR:
            var inEur = parseFloat(cacheObj.data.price_eur);
            priceTag = inEur.toFixed(2);
            break;
        case Constants.ISO_CODE_USD:
            var inUsd = parseFloat(cacheObj.data.price_usd);
            priceTag = inUsd.toFixed(2);
            break;
        default:
            priceTag = "Unsupported currency";
    }

    return priceTag;
}

function sendMessage(chatId, message) {
    teleBot.sendMessage(chatId, message);
}

function _log(msg) {
    if (isLoggingEnabled) {
        console.log(new Date().toISOString() + " | NEMbot: " + msg);
    }
}

function isNullOrUndefined(obj) {
    return obj === undefined || obj === null;
}

function catchFileIOErrors(error) {
    _log('Error while reading or writing a file. IO Error: ' + error);
}

function getPriceWithRandomMessage(chatId) {
    const priceMsg = "1 XEM" +
        " = " + getPrice(Constants.ISO_CODE_BTC) + " sat" +
        " = " + Constants.ISO_SYMBOL_USD + getPrice(Constants.ISO_CODE_USD) +
        " = " + Constants.ISO_SYMBOL_EUR + getPrice(Constants.ISO_CODE_EUR);

    var message = "";
    var inUsd = parseFloat(cacheObj.data.price_usd);
    inUsd = inUsd.toFixed(2);

    
    // if (getRandomNumber(1, 5) < 3) {
    if (true) {
        message = priceMsg;
    } else {
        if (getRandomNumber(1, 10) <= 5) {
            // Mood: content
            message = contentLines[getRandomNumber(0, contentLines.length - 1)];

            if (message === ChatConstants.PRICE_LAMBO) {
                var lamboPrice = inUsd / 330000;
                message = " = " + lamboPrice.toFixed(8) + message;
            } else {
                message = "\n" + message;
            }
        } else {
            // Mood: sad
            if (inUsd <= 0.20) {
                message = contentLines[getRandomNumber(0, contentLines.length - 1)];

                if (message === ChatConstants.PRICE_FAKE_MOON) {
                    _log('Message: ' + message);
                    message += "\n\n\nJust kidding. It's actually: \n" + priceMsg;
                    return message;
                } else {
                    message = "\n" + sadLines[getRandomNumber(0, sadLines.length - 1)];
                }
            } else if (inUsd >= 0.80) {
                // Mood: moon!
                message = "\n" + moonLines[getRandomNumber(0, moonLines.length - 1)];
            }
        }

        message = priceMsg + message;
        _log('Message: ' + message);
    }

    return message;
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * max) + min;
}

const contentLines = [
    ChatConstants.PRICE_LAMBO,
    ChatConstants.PRICE_WHEN_MOON,
    ChatConstants.PRICE_WHEN_CATAPULT,
    ChatConstants.PRICE_CATAPULT_TOMORROW,
    ChatConstants.PRICE_TREPID,
    ChatConstants.PRICE_STILL_UP
];

const moonLines = [
    ChatConstants.PRICE_MOON,
    ChatConstants.PRICE_TATTOO,
    ChatConstants.PRICE_FOMO,
    ChatConstants.PRICE_ROCKET,
    ChatConstants.PRICE_SMILEY
];

const sadLines = [
    ChatConstants.PRICE_FAKE_MOON,
    ChatConstants.PRICE_WHEN_SADNESS_END,
    ChatConstants.PRICE_IS_IT_OVER,
    ChatConstants.PRICE_THIS_IS_FINE,
    ChatConstants.PRICE_NEMWILL,
    ChatConstants.PRICE_ON_FIRE,
    ChatConstants.PRICE_ACCUMULATE,
    ChatConstants.PRICE_ALL_MARKET,
    ChatConstants.PRICE_TECH,
    ChatConstants.PRICE_DONT_ASK,
    ChatConstants.PRICE_NATTED,
    ChatConstants.PRICE_FELLS_SAD
];
