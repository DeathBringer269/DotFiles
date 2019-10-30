"use strict";
var ask;
(function (ask) {
    var apps;
    (function (apps) {
        var background;
        (function (background) {
            var dataSourceExtension = "extension";
            var config;
            var extensionState = new ChromeStorage(chrome.storage.local, "state");
            var nativeMessagingHostName;
            var contentScriptConnectionManager = new ContentScriptConnectionManager(extensionState);
            chrome.runtime.onConnect.addListener(contentScriptConnectionManager.connectionOperations.addConnectionToContentScript);
            function onPermissionChangeHandler(handlerType) {
                return function (permissions) {
                    Logger.log("permission changed - " + handlerType);
                    Logger.log(permissions);
                    if (config) {
                        ask.apps.ul.fireInfoEvent(config.buildVars.unifiedLoggingUrl, {
                            message: "permission changed",
                            topic: handlerType,
                            data1: permissions.origins.toString()
                        }, config);
                    }
                };
            }
            chrome.permissions.onAdded.addListener(onPermissionChangeHandler("added"));
            chrome.permissions.onRemoved.addListener(onPermissionChangeHandler("removed"));
            function init(configURL) {
                var _this = this;
                loadConfig(configURL)
                    .then(install)
                    .then(handleInvalidNewTabUrl)
                    .then(run)
                    .catch(function (err) {
                    Logger.warn("Background: Unable to install", err);
                    if (config) {
                        ask.apps.ul.fireErrorEvent(_this.config.buildVars.unifiedLoggingUrl, {
                            message: "on-error",
                            topic: "extension-run",
                            data1: err.message
                        }, _this.config).catch(Logger.log);
                    }
                });
            }
            background.init = init;
            function install(config) {
                return extensionState.get().then(function (state) {
                    if (state) {
                        config.state = state;
                        setInstallDateIfMissing(config);
                        return Promise.resolve(config);
                    }
                    return doInstall(config);
                }).catch(function (err) {
                    Logger.log("Background: install - Unable to get EXTENSION STATE::::", err);
                    return doInstall(config);
                });
            }
            function doInstall(config) {
                config.state = {
                    toolbarData: null,
                    isUpgradeFromLegacyChrome: false,
                    babType: config.buildVars.babType
                };
                var defaultToolbarData = {
                    newTabURL: config.buildVars.newTabURL,
                    pixelUrl: null,
                    toolbarId: Util.generateToolbarId(),
                    partnerId: config.buildVars.defaultPartnerId,
                    dataSource: dataSourceExtension
                };
                var toolbarDataFromLocalStorage = JSON.parse(localStorage.getItem("dlpToolbarData"));
                function indicateUpgradeFromLegacyAndCleanToolbarData() {
                    Logger.log("Background: indicateUpgradeFromLegacyAndCleanToolbarData: The extension is upgrading from a legacy Chrome extension.");
                    config.state.isUpgradeFromLegacyChrome = true;
                    return clean(toolbarDataFromLocalStorage, config);
                }
                return (toolbarDataFromLocalStorage
                    ? Promise.resolve(indicateUpgradeFromLegacyAndCleanToolbarData())
                    : getToolbarData(config.buildVars.localStorageUrl, config.buildVars.downloadDomain, 20000)).then(function (toolbarData) {
                    return doPostInstall(config, toolbarData || defaultToolbarData);
                }).catch(function (err) {
                    Logger.log("Background: doInstall - Unable to fetch toolbarData: ", err);
                    return doPostInstall(config, defaultToolbarData);
                });
            }
            function clean(toolbarDataFromLocalStorage, config) {
                var toolbarData = new Dlp.SkeletonToolbarData();
                for (var key in toolbarData) {
                    if (toolbarData.hasOwnProperty(key) && toolbarDataFromLocalStorage.hasOwnProperty(key)) {
                        toolbarData[key] = toolbarDataFromLocalStorage[key];
                    }
                }
                toolbarData.pixelUrl = null;
                if (legacyWasConfiguredForChromeTooltab(toolbarDataFromLocalStorage)) {
                    Logger.log("Background: clean: The legacy extension WAS INDEED configured for CTT. Upgrading this extension to WTT.");
                    toolbarData.newTabURL = config.buildVars.newTabURL;
                }
                return toolbarData;
            }
            function doPostInstall(config, toolbarData) {
                config.state.toolbarData = toolbarData;
                setInstallDateIfMissing(config);
                return updateReplaceableParams(config)
                    .then(persistConfig)
                    .then(function (config) {
                    var installPixelUrl = config.state.toolbarData.pixelUrl;
                    if (installPixelUrl) {
                        apps.ul.firePixel({ url: installPixelUrl }).catch(function (err) {
                            Logger.log("Background: doPostInstall - firePixel:::", err);
                        });
                    }
                    if (config.state.isUpgradeFromLegacyChrome) {
                        return Promise.resolve(config);
                    }
                    getCwsWindow().then(closeCwsWindow);
                    if (shouldOfferSearchExtension(config)) {
                        UrlFragmentActions.init(config);
                        chrome.tabs.query({ url: matchPatternForDownloadDomain(config.buildVars.downloadDomain) }, function (tabs) {
                            if (tabs.length === 0) {
                                PageUtils.openSearchExtensionOfferPage(config);
                            }
                            else {
                                var leftMostTab = getLeftMostTab(tabs);
                                PageUtils.redirectToSearchExtensionOfferPage(config, leftMostTab.id, true);
                            }
                        });
                    }
                    else {
                        PageUtils.openDefaultNewTab();
                    }
                    return Promise.resolve(config);
                });
            }
            function closeCwsWindow(popUpWindowToClose) {
                if (!popUpWindowToClose || !popUpWindowToClose.tabs.length) {
                    return;
                }
                chrome.tabs.remove(popUpWindowToClose.tabs[0].id);
            }
            function getCwsWindow() {
                return new Promise(function (resolve) {
                    chrome.windows.getAll({
                        populate: true
                    }, function (windows) {
                        var popUpWindow = windows.find(function (window) {
                            return window.type === "popup" && !!window.tabs.find(function (tab) {
                                return new RegExp("chrome\\.google\\.com\\/webstore.*" + chrome.runtime.id).test(tab.url);
                            });
                        });
                        resolve(popUpWindow);
                    });
                });
            }
            function persistConfig(config) {
                return extensionState
                    .set(config.state)
                    .catch(function (err) {
                    Logger.log("Background: persistConfig - Unable to set EXTENSION STATE::::", err);
                    Promise.reject(err);
                })
                    .then(function (_) { return config; });
            }
            function updateReplaceableParams(config) {
                config.state.replaceableParams = createReplaceableParams(config);
                return Promise.resolve(config);
            }
            function handleInvalidNewTabUrl(config) {
                if (config.state.toolbarData && !config.state.toolbarData.newTabURL) {
                    Logger.log("Background: handleInvalidNewTabUrl: newTabURL is missing");
                    if (config.state.isUpgradeFromLegacyChrome) {
                        config.state.toolbarData.newTabURL = localStorage.getItem("newtab/url");
                    }
                    if (!config.state.toolbarData.newTabURL) {
                        config.state.toolbarData.newTabURL = config.buildVars.newTabURL;
                    }
                    extensionState.set(config.state).catch(function (err) {
                        Logger.log("Unable to set EXTENSION STATE - newTabUrl::::", err);
                    });
                }
                return Promise.resolve(config);
            }
            function run(cfg) {
                config = cfg;
                nativeMessagingHostName = config.csw.nativemessagingHostName;
                updateReplaceableParams(config)
                    .then(persistConfig)
                    .then(function (config) {
                    setUninstallURL(config);
                    contentScriptConnectionManager.notifyExistingContentScripts(config);
                    startULPing(config);
                    new OfferService().exec(config);
                    Logger.log("Background:run setting splash page redirect handler");
                    new background.SplashPageRedirectHandler(config).start();
                    Logger.log("Background:run setting bab click handler");
                    new BabClickHandler(config, contentScriptConnectionManager.connectionOperations);
                }).catch(function (err) {
                    Logger.log("Background: run - error: ", err);
                });
            }
            function setUninstallURL(config) {
                try {
                    var url = config.state.toolbarData.uninstallSurveyUrl || config.buildVars.uninstallSurveyUrl;
                    if (chrome.runtime.setUninstallURL && url) {
                        chrome.runtime.setUninstallURL(TextTemplate.parse(url, config.state.replaceableParams));
                    }
                }
                catch (e) {
                    Logger.log(e);
                }
            }
            function setInstallDateIfMissing(config) {
                if (!config.state.toolbarData.installDate) {
                    config.state.toolbarData.installDate = createInstallDate();
                }
            }
            function createInstallDate() {
                var today = new Date(), year = today.getFullYear(), month = today.getMonth() + 1, day = today.getDate(), hour = today.getHours(), pad = function (n) { return (n < 10 ? "0" : "") + n.toString(); };
                return "" + year + pad(month) + pad(day) + pad(hour);
            }
            function getToolbarData(localStorageUrl, cookieDomain, timeout) {
                return Dlp.getDataFromCookies(cookieDomain)
                    .then(function (dlpData) {
                    Logger.log("Background: getToolbarData: Successfully got DLP data from COOKIES");
                    return Promise.resolve(dlpData.toolbarData);
                })
                    .catch(function (getCookiesErr) {
                    Logger.log("Background: getToolbarData: Failed to get DLP data from COOKIES: " + getCookiesErr);
                    Logger.log("Background: getToolbarData: Fail over to LOCAL STORAGE, since fetching DLP data from cookies failed.");
                    return Dlp.getDataFromLocalStorage({
                        url: localStorageUrl,
                        timeout: timeout,
                        keys: ["toolbarData"]
                    })
                        .then(function (dlpData) {
                        Logger.log("Background: getToolbarData: Successfully got DLP data from LOCAL STORAGE");
                        return Promise.resolve(dlpData.toolbarData);
                    })
                        .catch(function (getLocalStorageErr) {
                        Logger.log("Background: getToolbarData: Failed to get DLP data from LOCAL STORAGE: " + getLocalStorageErr);
                        Logger.log("Background: getToolbarData: Overall FAILED to fetch DLP data");
                        return Promise.reject(new Error("\nCOOKIE ERROR: " + getCookiesErr + "\nLOCAL STORAGE ERROR: " + getLocalStorageErr));
                    });
                });
            }
            function createReplaceableParams(config) {
                var partnerId = GlobalPartnerIdFactory.parse(config.state.toolbarData.partnerId, config.state.toolbarData.partnerSubId);
                var replaceableParams = {
                    affiliateID: partnerId.getCampaign() || config.state.toolbarData.campaign,
                    cobrandID: partnerId.getCobrand() || config.state.toolbarData.cobrand,
                    countryCode: partnerId.getCountry() || config.state.toolbarData.countryCode,
                    coID: config.state.toolbarData.coId,
                    definitionID: config.buildVars.configDefId,
                    installDate: config.state.toolbarData.installDate,
                    installDateHex: new Number(config.state.toolbarData.installDate).toString(16),
                    languageISO: window.navigator.language,
                    partnerID: partnerId.toString() || config.state.toolbarData.partnerId,
                    partnerParams: partnerId.appendQueryParameters("ptnrS"),
                    partnerParamsConfig: partnerId.appendQueryParameters("p"),
                    partnerParamsSearch: partnerId.appendQueryParameters("id", "ptnrS"),
                    partnerSubID: config.state.toolbarData.partnerSubId,
                    productName: config.buildVars.toolbarDisplayName,
                    si: config.state.toolbarData.partnerSubId,
                    toolbarID: config.state.toolbarData.toolbarId,
                    toolbarVersion: config.buildVars.version,
                    toolbarVersionNew: config.buildVars.version,
                    trackID: partnerId.getTrack() || config.buildVars.track,
                    cwsid: chrome.runtime.id
                };
                Logger.log("Background: createReplaceableParams - created the following replaceableParams: ", JSON.stringify(replaceableParams, null, 2));
                return replaceableParams;
            }
            function startULPing(config) {
                var alarmName = "livePing";
                var minTimeToNextPing = 60000;
                var interval = config.buildVars.livePing.interval;
                var lastPing = config.state.lastLivePing;
                var ping = function () {
                    var eventData = {
                        cwsid: chrome.runtime.id
                    };
                    apps.ul.fireToolbarActiveEvent(config.buildVars.livePing.url, eventData, config).then(function (response) {
                        config.state.lastLivePing = Date.now();
                        extensionState.update(config.state);
                    }).catch(function (err) {
                        Logger.log("Background: startULPing - " + alarmName + ": Unable to send Live ping. " + err);
                    });
                };
                var delta = Math.max(0, interval - (Date.now() - (lastPing || 0)));
                if (delta <= minTimeToNextPing) {
                    setTimeout(function () { return ping(); }, delta);
                    delta += interval;
                }
                chrome.alarms.create(alarmName, {
                    when: Date.now() + delta,
                    periodInMinutes: interval / 1000 / 60
                });
                chrome.alarms.onAlarm.addListener(function (alarm) {
                    if (alarm.name === alarmName) {
                        ping();
                    }
                });
            }
            function loadConfig(url) {
                return AJAX.readConfigJSON(url);
            }
            function matchPatternForDownloadDomain(downloadDomain) {
                return "*://*" + downloadDomain + "/*";
            }
            function legacyWasConfiguredForChromeTooltab(toolbarDataFromLocalStorage) {
                Logger.log("Background: legacyWasConfiguredForChromeTooltab: Checking whether or not the legacy extension from which this extension is upgrading was configured for CTT.");
                Logger.log("Background: legacyWasConfiguredForChromeTooltab: The value of newTabCache is: " + toolbarDataFromLocalStorage.newTabCache + ".");
                return (toolbarDataFromLocalStorage.newTabCache || "").toString() === "true";
            }
            function shouldOfferSearchExtension(config) {
                var isSearchExtensionEnabled = (config.state.toolbarData.chromeSearchExtensionEnabled === "true");
                return (isSearchExtensionEnabled && Boolean(config.state.toolbarData.chromeSearchExtensionURL));
            }
            function getLeftMostTab(tabs) {
                return sortTabsFromLeftToRight(tabs)[0];
            }
            function sortTabsFromLeftToRight(tabs) {
                return tabs.sort(function (tabA, tabB) { return tabA.index - tabB.index; });
            }
        })(background = apps.background || (apps.background = {}));
    })(apps = ask.apps || (ask.apps = {}));
})(ask || (ask = {}));
