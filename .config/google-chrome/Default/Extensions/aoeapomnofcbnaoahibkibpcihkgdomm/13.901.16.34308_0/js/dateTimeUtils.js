"use strict";
var DateTimeUtils = (function () {
    function DateTimeUtils() {
    }
    DateTimeUtils.durationToMilliseconds = function (str) {
        var millis = 0;
        str.replace(/(\d+)([dhms])\s*/g, function (match, p1, p2) {
            millis += p1 * (DateTimeUtils.millisecondsMultiplier[p2] || 0);
            return null;
        });
        return millis;
    };
    DateTimeUtils.millisecondsToDuration = function (ms) {
        return Object.keys(DateTimeUtils.millisecondsMultiplier)
            .map(function (unit) {
            var unitMult = DateTimeUtils.millisecondsMultiplier[unit], totUnit = Math.floor(ms / unitMult);
            ms -= totUnit * unitMult;
            return totUnit > 0 ? "" + totUnit + unit : "";
        })
            .join("");
    };
    DateTimeUtils.millisecondsMultiplier = {
        d: 24 * 60 * 60 * 1000,
        h: 60 * 60 * 1000,
        m: 60 * 1000,
        s: 1000
    };
    DateTimeUtils.timer = function () {
        var start = Date.now();
        return function () { return Date.now() - start; };
    };
    DateTimeUtils.getRandomSecToTwoDelay = function () {
        return 1000 + Math.random() * 1000;
    };
    return DateTimeUtils;
}());
