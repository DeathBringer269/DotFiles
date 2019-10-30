var BabClickHandler = (function () {
    function BabClickHandler(extensionConfig, connectionOperations) {
        var _this = this;
        this.setBabClickHandler = function () {
            Logger.log("BabClickHandler: setBabClickHandler " + _this.extensionConfig.buildVars.babType);
            var setBabThroughRemoteConfig = function () {
                Logger.log("BabClickHandler: setBabClickHandler added litener window onMessage");
                window.addEventListener("message", _this.connectionOperations.addOnMessageHandlerForBabIframeProxy());
                _this.babConfigStorage = new ChromeStorage(chrome.storage.local, "browserActionButton");
                if (_this.extensionConfig.buildVars.babConfigUrl) {
                    new RemoteConfigLoader(_this.extensionConfig, "browserActionButton", _this.onRemoteConfigUpdate)
                        .initConfigLoader(_this.extensionConfig.buildVars.babConfigUrl)
                        .then(_this.loadBackgroundBabIframe)
                        .catch(Logger.warn);
                }
            };
            switch (_this.extensionConfig.buildVars.babType) {
                case "newTab":
                    chrome.browserAction.onClicked.addListener(function () {
                        PageUtils.openNewTabPage().catch(Logger.log);
                    });
                    break;
                case "injection":
                    setBabThroughRemoteConfig();
                    chrome.browserAction.onClicked.addListener(_this.handleInjectionBabClick);
                    break;
                case "popUp":
                    setBabThroughRemoteConfig();
                    break;
            }
        };
        this.loadBackgroundBabIframe = function (babConfig) {
            var iframeId = "babIframeToProxy";
            var oneMinute = 60000;
            var addIframeToProxy = function () {
                _this.connectionOperations.initMessageHandler(babConfig);
                var iframe = document.createElement("iframe");
                iframe.setAttribute("id", iframeId);
                var iframeUrl = babConfig.proxyUrl + "?" + Util.getRandomUrlParam();
                Logger.log("BabClickHandler: loadBackgroundBabIframe iframeUrl = " + iframeUrl);
                iframe.setAttribute("src", iframeUrl);
                iframe.onerror = function () {
                    Logger.log("BabClickHandler: loadBackgroundBabIframe onerror - error loading bab iframe");
                    ask.apps.ul.fireErrorEvent(_this.extensionConfig.buildVars.unifiedLoggingUrl, {
                        message: "proxy-iframe-load-error",
                        topic: "browser-action",
                    }, _this.extensionConfig).catch(Logger.warn);
                };
                document.body.appendChild(iframe);
            };
            var removeIframeToProxy = function (existingIframe) {
                existingIframe.parentNode.removeChild(existingIframe);
            };
            var updateIframeToProxy = function (existingIframe) {
                var proxyPendingCallsCount = _this.connectionOperations.getCallbackQueueSize();
                if (proxyPendingCallsCount !== 0) {
                    Logger.log("BabClickHandler: loadBackgroundBabIframe: need to postpone iframe update because of pending " + proxyPendingCallsCount + " callbacks");
                    setTimeout(function () {
                        updateIframeToProxy(existingIframe);
                    }, oneMinute);
                    return;
                }
                removeIframeToProxy(existingIframe);
                addIframeToProxy();
            };
            if (!babConfig || !babConfig.reCaptcha || !babConfig.reCaptcha.reCaptchaUrl || !babConfig.reCaptcha.reCaptchaId || !babConfig.proxyUrl) {
                Logger.log("BabClickHandler: loadBackgroundBabIframe no reCaptcha or proxyUrl set in remoteConfig. IframeToProxy is not loaded.");
                return;
            }
            var urlProtocolRegex = /^https?:/i;
            var urlParamsRegex = /\?(.)*$/i;
            var existingIframe = document.getElementById(iframeId);
            if (existingIframe) {
                var iframeToProxyUrlChanged = existingIframe.src.replace(urlProtocolRegex, "").replace(urlParamsRegex, "") !==
                    babConfig.proxyUrl.replace(urlProtocolRegex, "").replace(urlParamsRegex, "");
                if (iframeToProxyUrlChanged) {
                    updateIframeToProxy(existingIframe);
                }
                else {
                    Logger.log("BabClickHandler: loadBackgroundBabIframe: existingIframe url matches the new remoteConfig url");
                }
                return;
            }
            addIframeToProxy();
        };
        this.onRemoteConfigUpdate = function (remoteConfig) {
            Logger.log("BabClickHandler: onRemoteConfigUpdate remote config loaded");
            _this.loadBackgroundBabIframe(remoteConfig);
        };
        this.handleInjectionBabClick = function (tab) {
            ask.apps.ul.fireInfoEvent(_this.extensionConfig.buildVars.unifiedLoggingUrl, {
                message: "browser-action-clicked",
                topic: "browser-action"
            }, _this.extensionConfig).catch(Logger.log);
            var showInjectedPage = function (babCSConnection, babPageCSConnection, token) {
                var babContentScriptResponse = {
                    name: "reopen-bab-page",
                    csId: null,
                    target: "babPageContentScript",
                    sender: "backgroundScript"
                };
                var babContentScriptRequest = {
                    name: "show-iframe",
                    csId: null,
                    target: "babContentScript",
                    sender: "backgroundScript"
                };
                babPageCSConnection.port.postMessage(babContentScriptResponse);
                babCSConnection.port.postMessage(babContentScriptRequest);
            };
            _this.babConfigStorage.get()
                .then(function (babConfig) {
                if (!babConfig && _this.extensionConfig.buildVars.babConfigUrl) {
                    Logger.warn("BabClickHandler:handleInjectionBabClick babConfig is not set remote url " + _this.extensionConfig.buildVars.babConfigUrl);
                    ask.apps.ul.fireErrorEvent(_this.extensionConfig.buildVars.unifiedLoggingUrl, {
                        message: "browser-action-clicked",
                        topic: "browser-action",
                        data1: "remote config is not set"
                    }, _this.extensionConfig).catch(Logger.warn);
                    return;
                }
                var existingConnectionToBabContentScript = _this.connectionOperations.getContentScriptConnectionByTabAndWin("babContentScript", {
                    tabId: tab.id,
                    windowId: tab.windowId
                });
                var existingConnectionToBabPageContentScript = _this.connectionOperations.getContentScriptConnectionByTabAndWin("babPageContentScript", {
                    tabId: tab.id,
                    windowId: tab.windowId
                });
                if (existingConnectionToBabContentScript && existingConnectionToBabPageContentScript) {
                    var babCSToken = existingConnectionToBabContentScript.port.name.substr(existingConnectionToBabContentScript.port.name.indexOf("-") + 1);
                    var babCSPageToken = existingConnectionToBabPageContentScript.port.name.substr(existingConnectionToBabPageContentScript.port.name.indexOf("-") + 1);
                    if (babCSToken === babCSPageToken) {
                        Logger.log("BabClickHandler: handleInjectionBabClick babPage rendered and connections exists. Send show iframe command");
                        showInjectedPage(existingConnectionToBabContentScript, existingConnectionToBabPageContentScript, babCSToken);
                        return;
                    }
                }
                BabClickHandler.getInjectionDetails(tab, _this.extensionConfig.buildVars.newTabURL)
                    .then(function (injectDetailsArr) {
                    Logger.log("BabClickHandler: handleInjectionBabClick injecting babContentScript.js into " + tab.url + " injection details " + JSON.stringify(injectDetailsArr));
                    injectDetailsArr.forEach(function (injectDetails) {
                        chrome.tabs.executeScript(tab.id, injectDetails, function () {
                            if (chrome.runtime.lastError) {
                                ask.apps.ul.fireErrorEvent(_this.extensionConfig.buildVars.unifiedLoggingUrl, {
                                    message: "failed-inject-babContentScript lastError " + chrome.runtime.lastError.message,
                                    topic: "browser-action"
                                }, _this.extensionConfig);
                            }
                        });
                    });
                })
                    .catch(function (err) {
                    ask.apps.ul.fireErrorEvent(_this.extensionConfig.buildVars.unifiedLoggingUrl, {
                        message: "failed-inject-babContentScript err " + err.message,
                        topic: "browser-action"
                    }, _this.extensionConfig);
                });
            });
        };
        this.extensionConfig = extensionConfig;
        this.connectionOperations = connectionOperations;
        this.setBabClickHandler();
    }
    BabClickHandler.getInjectionDetails = function (tab, newTabURLStr) {
        var injectDetailsArr = ["/js/babContentScriptAPI.js", "/js/babContentScript.js"].map(function (file) {
            return { runAt: "document_start", file: file };
        });
        if (tab.url !== "chrome://newtab/" && !~tab.url.indexOf("chrome-extension://" + chrome.runtime.id)) {
            return Promise.resolve(injectDetailsArr);
        }
        return new Promise(function (resolve, reject) {
            chrome.webNavigation.getAllFrames({ tabId: tab.id }, function (iFrameDetailsArr) {
                if (!iFrameDetailsArr || !iFrameDetailsArr.length) {
                    return reject("\"chrome://newtab/\" does not contain any iframe");
                }
                if (!newTabURLStr) {
                    return reject("getInjectionDetails newTabURL argument is not set");
                }
                var newtabUrl = new URL(newTabURLStr);
                var newtabHostPathname = newtabUrl ? "" + newtabUrl.hostname + newtabUrl.pathname : null;
                var newTabIframe = iFrameDetailsArr.find(function (iFrameDetails) {
                    return iFrameDetails.url.replace(/(^\w+:|^)\/\//, "").indexOf(newtabHostPathname) === 0;
                });
                if (newTabIframe) {
                    injectDetailsArr = injectDetailsArr.map(function (injectDetails) {
                        injectDetails.frameId = newTabIframe.frameId;
                        return injectDetails;
                    });
                    return resolve(injectDetailsArr);
                }
                return reject("new tab \"chrome://newtab/\" does not contain iframe with new tab url \"" + newtabHostPathname + "\"");
            });
        });
    };
    return BabClickHandler;
}());
