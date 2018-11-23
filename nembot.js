const Config = require('./config/apiconfig');
const Constants = require('./config/appconstants');
// const ChatConstants = require('./config/chatconstants');
const currency = require('currency-formatter');
let fs = require('fs');

// Telegram
const Telegraf = require('telegraf');
const teleBot = new Telegraf(Config.TELEGRAM_BOT_API_TOKEN);

// Caching
let cacheObj = {
    request_time_ms: 0,
    expiry_time_ms: 0,
    data: null
};

// Local variables
let isLoggingEnabled = true;
let isFeelingFunny = false;
const usFormat = {precision: 0, thousand: ',', decimal: '.', format: '%v'};

_log("NEMbot has started.");
teleBot.startPolling();

teleBot.on("text", function (context) {
    // Note: message.date is UNIX time in SECONDS (JavaScript/ECMA Script Date.now() works with milliseconds)
    // Ignore request older than CHAT_TIMEOUT_SECONDS into the past
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if ((nowInSeconds - context.message.date) > Constants.CHAT_REQUEST_TIMEOUT_S) {
        _log("Ignored. Chat message timestamp is older than " + Constants.CHAT_REQUEST_TIMEOUT_S + " seconds ago ");
        // no-op
        return;
    }

    if (context.message.text.toLowerCase().indexOf("/price") === 0) {
        requestData(sendPriceData, context);
    }

    if (context.message.text.toLowerCase().indexOf("/stats") === 0) {
        requestData(sendStatsData, context);
    }

    if (context.message.text.toLowerCase().indexOf("/marketcap") === 0) {
        requestData(sendMarketCapData, context);
    }
});

function requestData(callback, context) {
    if (isCacheEmptyOrExpired()) {
        readCacheFile(callback, context);
    } else {
        callback(context);
    }
}

function sendPriceData(context, attempt) {
    if (attempt === undefined) {
        attempt = 1;
    }

    if (isCacheEmptyOrExpired()) {
        if (attempt >= 3) {
            _log("Warning: Unexpected result. Could not retrieve price data from server.");
            return;
        }
        attempt++;
        setTimeout(sendPriceData, Constants.CHAT_REQUEST_RETRY_MS, context, attempt);
    } else {
        sendPriceDataToChat(context);
    }
}

function sendStatsData(context, attempt) {
    if (attempt === undefined) {
        attempt = 1;
    }

    if (isCacheEmptyOrExpired()) {
        if (attempt >= 3) {
            _log("Warning: Unexpected result. Could not retrieve price data from server.");
            return;
        }
        attempt++;
        setTimeout(sendStatsData, Constants.CHAT_REQUEST_RETRY_MS, context, attempt);
    } else {
        sendStatsDataToChat(context);
    }
}

function sendMarketCapData(context, attempt) {
    if (attempt === undefined) {
        attempt = 1;
    }

    if (isCacheEmptyOrExpired()) {
        if (attempt >= 3) {
            _log("Warning: Unexpected result. Could not retrieve price data from server.");
            return;
        }
        attempt++;
        setTimeout(sendMarketCapData, Constants.CHAT_REQUEST_RETRY_MS, context, attempt);
    } else {
        sendMarketCapDataToChat(context);
    }
}

function sendPriceDataToChat(context) {
    const msg = getPriceWithRandomMessage();
    sendMessage(context, msg);
}

function sendStatsDataToChat(context) {
    const h1 = parseFloat(cacheObj.data.price_change_percentage_1h_in_currency.usd).toFixed(2); // there's no price_change_percentage_1h
    const h24 = parseFloat(cacheObj.data.price_change_percentage_24h).toFixed(2);
    const d7 = parseFloat(cacheObj.data.price_change_percentage_7d).toFixed(2);
    const ath = parseFloat(cacheObj.data.ath_change_percentage.usd).toFixed(2);
    const volUsd = parseFloat(cacheObj.data.total_volume.usd);
    const volEur = parseFloat(cacheObj.data.total_volume.eur);

    const msg = "Price movements: " +
        "\n1h" + getSignIcon(h1) + "" + h1 + "% | 24h" + getSignIcon(h24) + "" + h24 + "% | 7d" + getSignIcon(d7) + "" + d7 + "% | ATH" + getSignIcon(ath) + "" + ath + "%" +
        "\nVolume (24h): " +
        "\n" + Constants.ISO_SYMBOL_USD + currency.format(volUsd, usFormat) +
        " | " + Constants.ISO_SYMBOL_EUR + currency.format(volEur, usFormat);

    sendMessage(context, msg);
}

function sendMarketCapDataToChat(context) {
    const capUsd = parseFloat(cacheObj.data.market_cap.usd);
    const capEur = parseFloat(cacheObj.data.market_cap.eur);

    const msg = "Market Cap: " +
        "\n" + Constants.ISO_SYMBOL_USD + currency.format(capUsd, usFormat) +
        " | " + Constants.ISO_SYMBOL_EUR + currency.format(capEur, usFormat);

    sendMessage(context, msg);
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

    if (isNullOrUndefined(cacheObj.expiry_time_ms)) {
        _log("Data cache expiration time is null or undefined.");
        return true;
    }

    var diff = Date.now() - cacheObj.expiry_time_ms;
    if (diff > 0) {
        _log("Data cache has expired. Expiration time was: " + cacheObj.expiry_time_ms);
        return true;
    }

    return false;
}

function readCacheFile(callback, param1) {
    fs.readFile(Constants.CACHE_FILE_PATH, Constants.ENCODING_UTF8, function (error, data) {
        if (error) {
            catchFileIOErrors(error);
        } else {
            cacheObj = JSON.parse(data);
            callback(param1);
        }
    });
}

function getPrice(curr) {
    let priceTag = "NaN";
    switch (curr) {
        case Constants.ISO_CODE_BTC:
            let inSatoshi = parseFloat(cacheObj.data.current_price.btc) * 100000000;
            priceTag = inSatoshi.toFixed(0);
            break;
        case Constants.ISO_CODE_EUR:
            let inEur = parseFloat(cacheObj.data.current_price.eur);
            priceTag = inEur.toFixed(2);
            break;
        case Constants.ISO_CODE_USD:
            let inUsd = parseFloat(cacheObj.data.current_price.usd);
            priceTag = inUsd.toFixed(2);
            break;
        default:
            priceTag = "Unsupported currency";
    }

    return priceTag;
}

function sendMessage(context, message) {
    // context.telegram.sendMessage(context.message.chat.id, message);
    context.reply(message);
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

function getPriceWithRandomMessage() {
    const priceMsg = "1 XEM" +
        " = " + getPrice(Constants.ISO_CODE_BTC) + " sat" +
        " = " + Constants.ISO_SYMBOL_USD + getPrice(Constants.ISO_CODE_USD) +
        " = " + Constants.ISO_SYMBOL_EUR + getPrice(Constants.ISO_CODE_EUR);

    return priceMsg;

    // Fiddles
    /*
    let message = "";
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
                let lamboPrice = inUsd / 330000;
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
    */
}

// Fiddles
/*
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
*/