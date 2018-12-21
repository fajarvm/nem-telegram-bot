'use strict';

const Utils = require('../utils/utilities');

class MarketData {

    // accept a JSON object of market data
    constructor(marketData) {
        try {
            this._priceInSatoshi = marketData.current_price.btc;
            this._priceInEuro = marketData.current_price.eur;
            this._priceInUsd = marketData.current_price.usd;

            this._percentChange1hInUsd = marketData.price_change_percentage_1h_in_currency.usd;
            this._percentChange24hInUsd = marketData.price_change_percentage_24h;
            this._percentChange7dInUsd = marketData.price_change_percentage_7d;
            this._percentChangeAthInUsd = marketData.ath_change_percentage.usd;
            this._totalVolumeInUsd = marketData.total_volume.usd;
            this._totalVolumeInEuro = marketData.total_volume.eur;

            this._marketcapInUsd = marketData.market_cap.usd;
            this._marketcapInEuro = marketData.market_cap.eur;

            this._sparkline7dInUsd = Utils.isNullOrUndefined(marketData.sparkline_7d) ? null : marketData.sparkline_7d.price;
        } catch (error) {
            MarketData._log('Error occurred when parsing market data JSON object. Error:' + error);
            throw error;
        }
    }

    getPriceInSatoshi(decimal = 0) {
        return MarketData._parseFloat(this._priceInSatoshi * 100000000, decimal);
    }

    getPriceInEuro(decimal = 2) {
        return MarketData._parseFloat(this._priceInEuro, decimal);
    }

    getPriceInUsd(decimal = 2) {
        return MarketData._parseFloat(this._priceInUsd, decimal);
    }

    getPercentChange1hInUsd(decimal = 2) {
        return MarketData._parseFloat(this._percentChange1hInUsd, decimal);
    }

    getPercentChange24hInUsd(decimal = 2) {
        return MarketData._parseFloat(this._percentChange24hInUsd, decimal);
    }

    getPercentChange7dInUsd(decimal = 2) {
        return MarketData._parseFloat(this._percentChange7dInUsd, decimal);
    }

    getPercentChangeAthInUsd(decimal = 2) {
        return MarketData._parseFloat(this._percentChangeAthInUsd, decimal);
    }

    getTotalVolumeInUsd(decimal = 0) {
        return MarketData._parseFloat(this._totalVolumeInUsd, decimal);
    }

    getTotalVolumeInEuro(decimal = 0) {
        return MarketData._parseFloat(this._totalVolumeInEuro, decimal);
    }

    getMarketcapInUsd(decimal = 0) {
        return MarketData._parseFloat(this._marketcapInUsd, decimal);
    }

    getMarketcapInEuro(decimal = 0) {
        return MarketData._parseFloat(this._marketcapInEuro, decimal);
    }

    getSparkline7dInUsd() {
        return this._sparkline7dInUsd;
    }

    // ----------------------------- protected/private methods ----------------------------- //

    static _parseFloat(value, decimal = 0) {
        try {
            return parseFloat(value).toFixed(decimal);
        } catch (error) {
            MarketData._log('Error parsing value: ' + value + ' into float with decimal: ' + decimal + '. \nError: ' + error);
            throw error;
        }
    }

    static _log(msg) {
        void Utils.consoleLog('MarketData', msg);
    }
}

module.exports = exports = MarketData;