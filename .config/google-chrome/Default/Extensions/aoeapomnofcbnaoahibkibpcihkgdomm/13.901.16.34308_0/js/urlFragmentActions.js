"use strict";
var UrlFragmentActions;
(function (UrlFragmentActions) {
    var config;
    var tabsCalledFrom = [];
    var cobrand;
    function fragmentMatches(url) {
        var fragmentId = UrlUtils.parseUrl(url).getFragmentId();
        Logger.log("uFA: fragmentId::::", fragmentId);
        var parsedFragment = UrlUtils.parseQueryString(fragmentId);
        Logger.log("uFA: parsedFragment::::", parsedFragment);
        return parsedFragment.getParam("command") === "showNewTab"
            && parsedFragment.getParam("cobrand") === cobrand;
    }
    function navListener(details) {
        Logger.log("uFA: navListener, details: %o", details);
        if (tabsCalledFrom.indexOf(details.tabId) === -1 && fragmentMatches(details.url)) {
            Logger.log("uFA: opening the new tab");
            tabsCalledFrom.push(details.tabId);
            PageUtils.openDefaultNewTab();
        }
        else {
            Logger.log("uFA: command didn't match or tab already opened");
        }
    }
    function removedListener(tabId) {
        Logger.log("uFA: removing listener");
        var index = tabsCalledFrom.indexOf(tabId);
        if (index !== -1) {
            Logger.log("uFA: removing tabId: %s from tabsCalledFrom", tabId);
            tabsCalledFrom.splice(index, 1);
        }
        else {
            Logger.log("uFA: unable to find tabId: %s to remove from tabsCalledFrom", tabId);
        }
    }
    function init(cfg) {
        config = cfg;
        var partnerId = GlobalPartnerIdFactory.parse(config.state.toolbarData.partnerId, config.state.toolbarData.partnerSubId);
        cobrand = partnerId.getCobrand() || config.state.toolbarData.cobrand;
        var filter = { url: [{ hostContains: config.buildVars.downloadDomain }] };
        if (config.state.toolbarData.chromeSearchExtensionURL) {
            var secondaryOfferParsedUrl = UrlUtils.parseUrl(config.state.toolbarData.chromeSearchExtensionURL);
            if (secondaryOfferParsedUrl) {
                filter.url.push({ hostContains: secondaryOfferParsedUrl.getDomain() });
            }
        }
        chrome.webNavigation.onReferenceFragmentUpdated.addListener(navListener, filter);
        chrome.webNavigation.onBeforeNavigate.addListener(navListener, filter);
        chrome.tabs.onRemoved.addListener(removedListener);
        Logger.log("uFA: done");
    }
    UrlFragmentActions.init = init;
})(UrlFragmentActions || (UrlFragmentActions = {}));
