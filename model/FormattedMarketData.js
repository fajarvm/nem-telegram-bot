'use strict';

const MarketData = require('./MarketData');
const currency = require('currency-formatter');

class FormattedMarketData extends MarketData {
    constructor(marketData) {
        super(marketData);
    }

    getPriceInSatoshiFormatted(decimal = 0) {
        return FormattedMarketData.getPriceWithSymbol(FormattedMarketData.ISO_CODE_BTC, super.getPriceInSatoshi(decimal));
    }

    getPriceInEuroFormatted(decimal = 2) {
        return FormattedMarketData.getPriceWithSymbol(FormattedMarketData.ISO_CODE_EUR, super.getPriceInEuro(decimal));
    }

    getPriceInUsdFormatted(decimal = 2) {
        return FormattedMarketData.getPriceWithSymbol(FormattedMarketData.ISO_CODE_USD, super.getPriceInUsd(decimal));
    }

    static getPercentWithIndicatorIcon(value) {
        return FormattedMarketData.getSignIcon(value) + value + FormattedMarketData.ISO_SYMBOL_PERCENT;
    }

    static getPriceWithSymbol(curr, value) {
        let formatted = "NaN";
        switch (curr) {
            case FormattedMarketData.ISO_CODE_BTC:
                formatted = value + " sat";
                break;
            case FormattedMarketData.ISO_CODE_EUR:
                formatted = FormattedMarketData.ISO_SYMBOL_EUR + value;
                break;
            case FormattedMarketData.ISO_CODE_USD:
                formatted = FormattedMarketData.ISO_SYMBOL_USD + value;
                break;
            default:
                formatted = FormattedMarketData.UNSUPPORTED_CURRENCY;
        }

        return formatted;
    }

    static getPriceWithSymbolUsFormatted(curr, value) {
        let formatted = "";
        switch (curr) {
            case FormattedMarketData.ISO_CODE_BTC:
                formatted = currency.format(value, FormattedMarketData.DEFAULT_US_FORMAT) + " sat";
                break;
            case FormattedMarketData.ISO_CODE_EUR:
                formatted = FormattedMarketData.ISO_SYMBOL_EUR + currency.format(value, FormattedMarketData.DEFAULT_US_FORMAT);
                break;
            case FormattedMarketData.ISO_CODE_USD:
                formatted = FormattedMarketData.ISO_SYMBOL_USD + currency.format(value, FormattedMarketData.DEFAULT_US_FORMAT);
                break;
            default:
                formatted = FormattedMarketData.UNSUPPORTED_CURRENCY;
        }

        return formatted;
    }

    static getSignIcon(floatNumber) {
        if (floatNumber === 0.000) {
            return "";
        }

        return floatNumber < 0 ? FormattedMarketData.ICON_DOWN : FormattedMarketData.ICON_UP;
    }
}

// Currency related constants
FormattedMarketData.ISO_CODE_BTC = 'BTC';
FormattedMarketData.ISO_CODE_EUR = 'EUR';
FormattedMarketData.ISO_CODE_NEM = 'NEM';
FormattedMarketData.ISO_CODE_USD = 'USD';
FormattedMarketData.ISO_SYMBOL_EUR = '€';
FormattedMarketData.ISO_SYMBOL_NEM = 'XEM';
FormattedMarketData.ISO_SYMBOL_USD = '$';
FormattedMarketData.ISO_SYMBOL_PERCENT = '%';
FormattedMarketData.ICON_UP = '▲';
FormattedMarketData.ICON_DOWN = '▼';
FormattedMarketData.DEFAULT_US_FORMAT = {
    precision: 0,
    thousand: ',',
    decimal: '.',
    format: '%v'
};
FormattedMarketData.UNSUPPORTED_CURRENCY = 'Unsupported currency';

module.exports = exports = FormattedMarketData;
