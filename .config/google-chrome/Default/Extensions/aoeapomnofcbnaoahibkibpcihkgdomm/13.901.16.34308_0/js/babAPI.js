var BabAPI = (function () {
    function BabAPI(extensionConfig) {
        var _this = this;
        this.getBackgroundFeatures = function () {
            if (!_this.babAvailableFeatures) {
                _this.babAvailableFeatures = [];
                Object.keys(_this.backgroundFeatures).forEach(function (featureName) {
                    _this.babAvailableFeatures.push({
                        name: featureName,
                        requiredArgs: _this.backgroundFeatures[featureName].getRequiredArgs(),
                        target: "backgroundScript"
                    });
                });
            }
            return _this.babAvailableFeatures;
        };
        this.executeFeature = function (babMessage, connection) {
            var feature = _this.backgroundFeatures[babMessage.name];
            if (!feature) {
                return Promise.reject("invalid feature");
            }
            var argsArr = Object.keys(babMessage.args || {});
            if (feature.getRequiredArgs().some(function (requiredArgName) { return !~argsArr.indexOf(requiredArgName); })) {
                return Promise.reject("required args are missing");
            }
            return feature.execute(babMessage, connection);
        };
        this.backgroundFeatures = {
            "fire-ul": {
                getRequiredArgs: function () {
                    return ["eventName", "message", "topic"];
                },
                execute: function (babMessage) {
                    var fireEvent = babMessage.args.eventName === "Info"
                        ? ask.apps.ul.fireInfoEvent
                        : ask.apps.ul.fireErrorEvent;
                    return fireEvent(_this.extensionConfig.buildVars.unifiedLoggingUrl, {
                        message: babMessage.args.message,
                        topic: babMessage.args.topic,
                        data1: babMessage.args.data1,
                        data2: babMessage.args.data2
                    }, _this.extensionConfig);
                }
            },
            "open-new-tab": {
                getRequiredArgs: function () {
                    return ["url"];
                },
                execute: function (babMessage, connection) {
                    var tabCreateProperties = {
                        windowId: connection && connection.sender && connection.sender.tab ? connection.sender.tab.windowId : undefined,
                        url: babMessage.args.url,
                        active: babMessage.args.active || true
                    };
                    return new Promise(function (resolve, reject) {
                        chrome.tabs.create(tabCreateProperties, function (tab) {
                            if (chrome.runtime.lastError) {
                                return reject(chrome.runtime.lastError.message);
                            }
                            resolve();
                        });
                    });
                }
            },
            "inject-script": {
                getRequiredArgs: function () {
                    return ["matchUrlRegExStr", "code"];
                },
                execute: function (babMessage) {
                    return new Promise(function (resolve, reject) {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            if (!tabs || !tabs.length) {
                                return reject("no active tab in the current window");
                            }
                            chrome.webNavigation.getAllFrames({ tabId: tabs[0].id }, function (iframes) {
                                if (iframes) {
                                    var targetIframe = iframes.find(function (iframe) {
                                        Logger.log("BabAPI: injectScript.execute test \"" + iframe.url + "\" against " + babMessage.args.matchUrlRegExStr);
                                        return new RegExp(babMessage.args.matchUrlRegExStr).test(iframe.url);
                                    });
                                    if (targetIframe) {
                                        var details = {
                                            runAt: babMessage.args.runAt || "document_start",
                                            frameId: targetIframe.frameId,
                                            code: babMessage.args.code
                                        };
                                        Logger.log("BabAPI: injectCodeIntoIframe: target tabid:" + tabs[0].id + " frameId:" + targetIframe.frameId + " url:" + targetIframe.url);
                                        chrome.tabs.executeScript(tabs[0].id, details, function () {
                                            if (chrome.runtime.lastError) {
                                                return reject(chrome.runtime.lastError.message);
                                            }
                                            return resolve();
                                        });
                                    }
                                    else {
                                        return reject("new tab iframe not found");
                                    }
                                }
                                else {
                                    return reject("iframe(s) not found");
                                }
                            });
                        });
                    });
                }
            }
        };
        this.extensionConfig = extensionConfig;
    }
    return BabAPI;
}());
