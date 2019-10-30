"use strict";
var PageUtils;
(function (PageUtils) {
    PageUtils.stParamName = "st";
    PageUtils.stParamValueTab = "tab";
    PageUtils.assistParamName = "assist";
    PageUtils.showAssistParamValue = "1";
    PageUtils.assistShownNewTabKey = "assistNT";
    function getNewTabResourceUrl() {
        var manifest = chrome.runtime.getManifest();
        var newTab = manifest.chrome_url_overrides.newtab ? manifest.chrome_url_overrides.newtab : "ntp.html";
        return "chrome-extension://" + chrome.runtime.id + "/" + newTab;
    }
    PageUtils.getNewTabResourceUrl = getNewTabResourceUrl;
    function isDoorHangerDisplayed() {
        var macOS = "Mac OS";
        return BrowserUtils.getOS() !== macOS;
    }
    PageUtils.isDoorHangerDisplayed = isDoorHangerDisplayed;
    function appendParamsToShowAssist(newTabUrl) {
        newTabUrl = UrlUtils.appendParamToUrl(newTabUrl, PageUtils.assistParamName, PageUtils.showAssistParamValue);
        return newTabUrl;
    }
    PageUtils.appendParamsToShowAssist = appendParamsToShowAssist;
    function appendParams(url, keyValueParamPairs) {
        if (!url || !keyValueParamPairs || !keyValueParamPairs.length) {
            return url;
        }
        var concatenatedParamsStr = keyValueParamPairs.reduce(function (acc, current) { return acc + "&" + current; });
        var paramStrDelimiter = ~url.indexOf("?") ? "&" : "?";
        return "" + url + paramStrDelimiter + concatenatedParamsStr;
    }
    PageUtils.appendParams = appendParams;
    function openNewTabPage() {
        return new Promise(function (resolve) {
            chrome.tabs.create({
                url: UrlUtils.appendParamToUrl(getNewTabResourceUrl(), PageUtils.stParamName, PageUtils.stParamValueTab)
            }, resolve);
        });
    }
    PageUtils.openNewTabPage = openNewTabPage;
    function openDefaultNewTab() {
        return new Promise(function (resolve) {
            chrome.tabs.create({}, resolve);
        });
    }
    PageUtils.openDefaultNewTab = openDefaultNewTab;
    function openSearchExtensionOfferPage(config) {
        return new Promise(function (resolve) {
            chrome.tabs.create({
                url: TextTemplate.parse(config.state.toolbarData.chromeSearchExtensionURL, config.state.replaceableParams)
            }, resolve);
        });
    }
    PageUtils.openSearchExtensionOfferPage = openSearchExtensionOfferPage;
    function redirectToSearchExtensionOfferPage(config, tabId, shouldActivate) {
        return new Promise(function (resolve) {
            chrome.tabs.update(tabId, {
                url: TextTemplate.parse(config.state.toolbarData.chromeSearchExtensionURL, config.state.replaceableParams),
                active: shouldActivate
            }, resolve);
        });
    }
    PageUtils.redirectToSearchExtensionOfferPage = redirectToSearchExtensionOfferPage;
})(PageUtils || (PageUtils = {}));
