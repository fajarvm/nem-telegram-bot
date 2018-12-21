/**
 * @description A helper method to check if parameter is a string
 * @function isString
 * @param {*} str
 * @returns {boolean}
 */
const isString = (str) => {
    return (typeof str === 'string' || str instanceof String);
};

/**
 * @description A helper method to check if string is empty
 * @function isEmptyString
 * @param {*} str
 * @returns {boolean}
 */
const isEmptyString = (str) => {
    if (!isString(str)) return false;
    return (str.length == 0);
};

/**
 * @description A helper method to check if parameter is a date
 * @function isDate
 * @param {*} date
 * @returns {boolean}
 */
const isDate = (date) => {
    if (isString(date) || isArray(date) || date == undefined || date == null) return false;
    return (date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date));
};

/**
 * @description A helper method to check if parameter is an object
 * @function isObject
 * @param {*} obj
 * @returns {boolean}
 */
const isObject = (obj) => {
    if (isArray(obj) || isDate(obj)) return false;
    return (obj !== null && typeof obj === 'object');
};

/**
 * @description A helper method to check if parameter null or undefined
 * @function isNullOrUndefined
 * @param {*} obj
 * @returns {boolean}
 */
const isNullOrUndefined = (obj) => {
    return obj === undefined || obj === null;
};

/**
 * @description A helper method to check if parameter is a number
 * @function isNumber
 * @param {*} num
 * @returns {boolean}
 */
const isNumber = (num) => {
    return (!isNaN(num) && !isNaN(parseInt(num)));
};

/**
 * @description A helper method to check if parameter is an array
 * @function isArray
 * @param {*} arr
 * @returns {boolean}
 */
const isArray = (arr) => {
    return Array.isArray(arr);
};

/**
 * @description A helper method to print a log to the console
 * @function consoleLog
 * @param {string} emitter
 * @param {string} message
 * @returns {boolean}
 */
const consoleLog = (emitter = '', message = '') => {
    console.log(new Date().toISOString() + ' | ' + emitter + ': ' + message);
};

module.exports = {
    isString,
    isEmptyString,
    isDate,
    isObject,
    isNullOrUndefined,
    isNumber,
    isArray,
    consoleLog
};