"use strict";
var BrowserUtils;
(function (BrowserUtils) {
    function isAPIAvailable() {
        return {
            tabsExecuteScriptFrameIdSupport: (parseInt(BrowserUtils.getBrowserVersion()) >= chromeVersionTabsExecuteScriptFrameIdSupport)
        };
    }
    BrowserUtils.isAPIAvailable = isAPIAvailable;
    var chromeVersionTabsExecuteScriptFrameIdSupport = 50;
    function getBrowserName() {
        if (~window.navigator.userAgent.indexOf("Edge")) {
            return "Edge";
        }
        else if (~window.navigator.userAgent.indexOf("Chrome")) {
            return "Chrome";
        }
        else if (~window.navigator.userAgent.indexOf("Firefox")) {
            return "Firefox";
        }
    }
    BrowserUtils.getBrowserName = getBrowserName;
    BrowserUtils.getBrowserVersion = function () {
        return new RegExp(getBrowserName() + "\\/([0-9\\.]+)").exec(window.navigator.userAgent)[1];
    };
    BrowserUtils.getLanguage = function () {
        return window.navigator.language.split("-")[0];
    };
    BrowserUtils.getOS = function () {
        if (/^Win.*$/.test(window.navigator.platform)) {
            return "Windows";
        }
        if (/^Mac.*$/.test(window.navigator.platform)) {
            return "Mac OS";
        }
        if (/^Linux.*$/.test(window.navigator.platform)) {
            return "Linux";
        }
        if (/.*CrOS.*/.test(window.navigator.userAgent)) {
            return "Chrome OS";
        }
        return "Other";
    };
})(BrowserUtils || (BrowserUtils = {}));
