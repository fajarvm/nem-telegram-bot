'use strict';

const Config = require('./configs/api_configs');
const Utils = require('./utils/utilities');

// Modules
const MarketDataManager = require('./MarketDataManager');
const NemTelegramBot = require('./NemTelegramBot');

function main() {
    const DataManager = new MarketDataManager();
    const NemBot = new NemTelegramBot(Config.TELEGRAM_BOT_API_TOKEN, DataManager);

    DataManager.start().then(
        success => {
            _log('DataManager is up and running.');

            NemBot.start().then(
                success => {
                    _log('DataManager and NemBot are up and running.');
                },
                error => {
                    _log('An error has occurred when starting NemBot: ' + error);
                }
            );
        },
        error => {
            _log('An error has occurred when starting DataManager: ' + error);
        }
    );
}


function _log(msg) {
    void Utils.consoleLog('main.js', msg);
}

main();