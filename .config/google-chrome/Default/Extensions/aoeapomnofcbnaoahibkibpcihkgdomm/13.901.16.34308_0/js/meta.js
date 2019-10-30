(function () {
    var browserVersionsSetFocusWithMeta_05_secDelay = 62;
    var maxBrowserVersionsSetFocusWithTabOpenAndClose = 61;
    var browserVersion = 0;
    var refreshDelay = 0;
    try {
        browserVersion = parseInt(/Chrome\/([0-9.]+)/.exec(window.navigator.userAgent)[1]);
    }
    catch (err) {
    }
    if (maxBrowserVersionsSetFocusWithTabOpenAndClose >= browserVersion && browserVersion !== browserVersionsSetFocusWithMeta_05_secDelay) {
        if (~document.location.href.indexOf("?")) {
            return;
        }
    }
    if (isNaN(browserVersion) || (maxBrowserVersionsSetFocusWithTabOpenAndClose >= browserVersion && browserVersion !== browserVersionsSetFocusWithMeta_05_secDelay)) {
        if (!window.localStorage.getItem(PageUtils.assistShownNewTabKey)) {
            return;
        }
        var newTabFile_1 = chrome.runtime.getManifest().chrome_url_overrides.newtab
            ? chrome.runtime.getManifest().chrome_url_overrides.newtab
            : "ntp.html";
        chrome.tabs.getCurrent(function (originalTab) {
            chrome.tabs.create({ url: "chrome-extension://" + chrome.runtime.id + "/" + newTabFile_1 + "?" }, function (tab) {
                chrome.tabs.remove(originalTab.id);
            });
        });
        return;
    }
    if (browserVersion === browserVersionsSetFocusWithMeta_05_secDelay) {
        refreshDelay = 0.5;
    }
    var meta = document.createElement("meta");
    meta.httpEquiv = "refresh";
    meta.content = refreshDelay + ";url=extension://ntp.html";
    document.getElementsByTagName("head")[0].appendChild(meta);
})();
