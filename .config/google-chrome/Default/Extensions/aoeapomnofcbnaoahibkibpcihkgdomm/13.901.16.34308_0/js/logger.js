var DEBUG = false;
var WARN = true;
var Logger;
(function (Logger) {
    var blankFunc = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
    };
    Logger.error = WARN
        ? console.error.bind(window.console)
        : blankFunc;
    Logger.log = DEBUG
        ? console.log.bind(window.console)
        : blankFunc;
    Logger.warn = WARN
        ? console.warn.bind(window.console)
        : blankFunc;
})(Logger || (Logger = {}));
