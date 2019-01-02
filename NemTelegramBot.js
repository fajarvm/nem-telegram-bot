'use strict';

// Telegram module
const Telegraf = require('telegraf');

// Application modules
const Constants = require('./configs/constants');
const Utils = require('./utils/utilities');
const FormattedMarketData = require('./model/FormattedMarketData');

/**
 * @class NemTelegramBot
 * @author Fajar van Megen
 * @description A Telegram chat bot service that fetches and broadcasts the price of XEM, a cryptocurrency of the NEM blockchain.
 * @example
 *      const NemTelegramBot = require('NemTelegramBot');
 *      const NemBot = new NemTelegramBot('YOUR_TELEGRAM_BOT_API_TOKEN', marketDataManager);
 *      NemBot.start(); // to start the bot
 *      NemBot.stop();  // to stop it
 * @public
 * @version 0.2.5
 * @license MIT, GPL3
 */
class NemTelegramBot {
    constructor(apiToken, dataManager) {
        this._dataManager = dataManager;
        this._bot = new Telegraf(apiToken);
    };

    start() {
        return new Promise((resolve, reject) => {
            try {
                this._bot.startPolling();
                this._bot.on("text", (context) => {
                    // Note: message.date is UNIX time in SECONDS
                    // (JavaScript/ECMA Script Date.now() works with milliseconds)
                    // Ignore request older than CHAT_TIMEOUT_SECONDS into the past
                    const nowInSeconds = Math.floor(Date.now() / 1000);
                    if ((nowInSeconds - context.message.date) > Constants.CHAT_REQUEST_TIMEOUT_S) {
                        NemTelegramBot._log("Ignored. Chat message timestamp is older than " + Constants.CHAT_REQUEST_TIMEOUT_S + " seconds ago ");
                        // no-op
                        return;
                    }

                    if (context.message.text.toLowerCase().indexOf("/price") === 0) {
                        this._postPrice(context);
                    }

                    if (context.message.text.toLowerCase().indexOf("/stats") === 0) {
                        this._postStats(context);
                    }

                    if (context.message.text.toLowerCase().indexOf("/marketcap") === 0) {
                        this._postMarketCap(context);
                    }
                });

                NemTelegramBot._log("NemBot has started.");

                resolve('OK');
            } catch (error) {
                NemTelegramBot._log("Error occurred when starting. Error: " + error);

                reject(error);
            }
        });
    };

    stop() {
        return new Promise(((resolve, reject) => {
            try {
                this._bot.stop();

                NemTelegramBot._log("NemBot has stopped.");


                resolve('OK');
            } catch (error) {
                NemTelegramBot._log("Error occurred when stopping. Error: " + error);

                reject(error);
            }
        }));
    };

// ----------------------------------------- protected/private methods ----------------------------------------- //

    _postPrice(context) {
        const message = "1 " + FormattedMarketData.ISO_SYMBOL_NEM +
            " = " + this._dataManager.marketDataObject.getPriceInSatoshiFormatted() +
            " = " + this._dataManager.marketDataObject.getPriceInUsdFormatted() +
            " = " + this._dataManager.marketDataObject.getPriceInEuroFormatted();

        NemTelegramBot._sendMessage(context, message);
    }

    _postStats(context) {
        const h1 = FormattedMarketData.getPercentWithIndicatorIcon(this._dataManager.marketDataObject.getPercentChange1hInUsd());
        const h24 = FormattedMarketData.getPercentWithIndicatorIcon(this._dataManager.marketDataObject.getPercentChange24hInUsd());
        const d7 = FormattedMarketData.getPercentWithIndicatorIcon(this._dataManager.marketDataObject.getPercentChange7dInUsd());
        const volUsd = FormattedMarketData.getPriceWithSymbolUsFormatted(
            FormattedMarketData.ISO_CODE_USD,
            this._dataManager.marketDataObject.getTotalVolumeInUsd()
        );
        const volEur = FormattedMarketData.getPriceWithSymbolUsFormatted(
            FormattedMarketData.ISO_CODE_EUR,
            this._dataManager.marketDataObject.getTotalVolumeInEuro()
        );

        const message = "Price movements: " +
            "\n1h" + h1 + " | 24h" + h24 + " | 7d" + d7 +
            "\nVolume (24h): " +
            "\n" + volUsd + " | " + volEur;

        NemTelegramBot._sendMessage(context, message);
        NemTelegramBot._sendPicture(context, this._dataManager.sparklineImagePath);
    }

    _postMarketCap(context) {
        const capUsd = FormattedMarketData.getPriceWithSymbolUsFormatted(
            FormattedMarketData.ISO_CODE_USD,
            this._dataManager.marketDataObject.getMarketcapInUsd()
        );
        const capEur = FormattedMarketData.getPriceWithSymbolUsFormatted(
            FormattedMarketData.ISO_CODE_EUR,
            this._dataManager.marketDataObject.getMarketcapInEuro()
        );

        const msg = "Market Cap: " +
            "\n" + capUsd + " | " + capEur;

        NemTelegramBot._sendMessage(context, msg);
    }

    static _sendMessage(context, message) {
        // context.telegram.sendMessage(context.message.chat.id, message);
        context.reply(message);
    }

    static _sendPicture(context, pathToPic) {
        context.replyWithPhoto({source: pathToPic});
    };

    static _log(msg) {
        void Utils.consoleLog('NemTelegramBot', msg);
    }
}

module.exports = exports = NemTelegramBot;
