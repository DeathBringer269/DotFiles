var BabContentScriptAPI = (function () {
    function BabContentScriptAPI() {
        var _this = this;
        this.getBabContentScriptAPI = function () {
            if (!_this.babCSAvailableFeatures) {
                _this.babCSAvailableFeatures = [];
                Object.keys(_this.csAPI).forEach(function (featureName) {
                    _this.babCSAvailableFeatures.push({
                        name: featureName,
                        requiredArgs: _this.csAPI[featureName].getRequiredArgs(),
                        target: "babContentScript"
                    });
                });
            }
            return _this.babCSAvailableFeatures;
        };
        this.executeFeature = function (message) {
            var feature = _this.csAPI[message.name];
            if (!feature) {
                return Promise.reject("invalid feature");
            }
            var argsArr = Object.keys(message.args || {});
            if (feature.getRequiredArgs().some(function (requiredArgName) { return !~argsArr.indexOf(requiredArgName); })) {
                return Promise.reject("required args are missing");
            }
            return feature.execute(message);
        };
        this.opacityLevel = 0.8;
        this.contentDivCSS = "width: 100% !important; max-width: 100% !important; height: 100% !important;\n                        overflow: hidden !important; position: fixed !important; top: 0 !important; left: 0 !important;\n                        vertical-align: middle !important; background-color: transparent !important;  \n                        z-index: 9999999999 !important; display: hidden !important;";
        this.opacityDivCSS = "z-index: 2147483627 !important; position: fixed !important;\n                        top: 0 !important; left: 0 !important; background-color: rgb(0, 0, 0) !important;\n                        opacity: {opacityLevel} !important; \n                        height: 100% !important; width: 100% !important; display: hidden !important;";
        this.contentDivHiddenCSS = "width: 0% !important; max-width: 100% !important; height: 0% !important;\n                        overflow: hidden !important; position: fixed !important; top: 0 !important; left: 0 !important;\n                        vertical-align: middle !important; background-color: transparent !important;  \n                        z-index: 9999999999 !important; display: hidden !important;";
        this.opacityDivHiddenCSS = "z-index: 2147483627 !important; position: fixed !important;\n                        top: 0 !important; left: 0 !important; background-color: rgb(0, 0, 0) !important;\n                        height: 0% !important; width: 0% !important; display: hidden !important;";
        this.csAPI = {
            "get-page-data": {
                getRequiredArgs: function () {
                    return [];
                },
                execute: function (babMessage) {
                    return Promise.resolve({
                        data: {
                            pageTitle: document.title,
                            pageUrl: location.href
                        }
                    });
                }
            },
            "hide-iframe": {
                getRequiredArgs: function () {
                    return [];
                },
                execute: function (babMessage) {
                    var setFocusOnWTTPage = function () {
                        var extensionStateName = "state";
                        chrome.storage.local.get(extensionStateName, function (data) {
                            if (!data)
                                return;
                            var state = data.state;
                            if (!state.toolbarData.newTabURL)
                                return;
                            if (~location.href.indexOf(new URL(state.toolbarData.newTabURL).hostname)) {
                                var searchInputs = document.getElementsByTagName("input");
                                if (searchInputs && searchInputs.length) {
                                    searchInputs[searchInputs.length - 1].focus();
                                }
                            }
                        });
                    };
                    if (!!_this.contentIframe && !!_this.opacityDiv) {
                        _this.opacityDiv.style.cssText = _this.opacityDivHiddenCSS;
                        _this.contentDiv.style.cssText = _this.contentDivHiddenCSS;
                        setFocusOnWTTPage();
                        return Promise.resolve({ data: "success" });
                    }
                    return Promise.reject("cannot hide bab elements");
                }
            },
            "show-iframe": {
                getRequiredArgs: function () {
                    return [];
                },
                execute: function (babMessage) {
                    if (!!_this.contentIframe && !!_this.opacityDiv) {
                        _this.contentIframe.focus();
                        _this.opacityDiv.style.cssText = _this.opacityDivCSS.replace("{opacityLevel}", _this.opacityLevel.toString());
                        _this.contentDiv.style.cssText = _this.contentDivCSS;
                        return Promise.resolve({ data: "success" });
                    }
                    return Promise.reject("cannot show bab elements");
                }
            },
            "load-iframe": {
                getRequiredArgs: function () {
                    return ["backgroundToken"];
                },
                execute: function (babMessage) {
                    var createOpacity = function (modalConfig) {
                        var opacityDivId = "bab-opacity";
                        if (document.getElementById(opacityDivId)) {
                            return Promise.resolve();
                        }
                        _this.opacityDiv = document.createElement("div");
                        _this.opacityDiv.id = opacityDivId;
                        if (modalConfig && modalConfig.opacity && !isNaN(Number(modalConfig.opacity))) {
                            _this.opacityLevel = modalConfig.opacity;
                        }
                        _this.opacityDiv.style.cssText = _this.opacityDivCSS.replace("{opacityLevel}", _this.opacityLevel.toString());
                        document.body.appendChild(_this.opacityDiv);
                        return Promise.resolve();
                    };
                    var createContentIframe = function (modalConfig) {
                        var contentIframeId = "bab-content-iframe";
                        var contentDivId = "bab-content-div";
                        if (!document || !document.body) {
                            return Promise.reject(new Error("missing document and/or body blocked content injection"));
                        }
                        if (document.getElementById(contentIframeId)) {
                            return Promise.resolve();
                        }
                        _this.contentDiv = document.createElement("div");
                        _this.contentDiv.id = contentDivId;
                        _this.contentDiv.style.cssText = _this.contentDivCSS;
                        _this.contentIframe = document.createElement("iframe");
                        _this.contentIframe.id = contentIframeId;
                        _this.contentIframe.name = "bab-content";
                        _this.contentIframe.frameBorder = "0";
                        _this.contentIframe.scrolling = "no";
                        var widthInPCT = 100;
                        var heightInPCT = 100;
                        var topMarginInPCT = 0;
                        var rightMarginInPCT = 0;
                        if (modalConfig && modalConfig.widthInPCT && !isNaN(Number(modalConfig.widthInPCT))) {
                            widthInPCT = modalConfig.widthInPCT;
                            rightMarginInPCT = (100 - widthInPCT) / 2;
                        }
                        if (modalConfig && modalConfig.heightInPCT && !isNaN(Number(modalConfig.heightInPCT))) {
                            heightInPCT = modalConfig.heightInPCT;
                            topMarginInPCT = (100 - heightInPCT) / 4;
                        }
                        _this.contentIframe.style.cssText += ";width: " + (widthInPCT + "%") + " !important; \n                        max-width: 100% !important; height: " + (heightInPCT + "%") + " !important;\n                        overflow: hidden !important; background-color: transparent !important; z-index: 9999999999 !important; display: hidden !important; \n                        margin: " + (topMarginInPCT + "%") + " " + (rightMarginInPCT + "%") + " !important";
                        _this.contentIframe.src = chrome.runtime.getURL("babPage.html") + "?guid=" + encodeURIComponent(babMessage.args.backgroundToken);
                        _this.contentIframe.onerror = function () {
                            console.warn("BrowserActionContentScript::onerror - error loading iframe");
                        };
                        _this.contentDiv.appendChild(_this.contentIframe);
                        document.body.appendChild(_this.contentDiv);
                        return Promise.resolve();
                    };
                    var modalConfig = babMessage.args.modalConfig;
                    return Promise.all([createOpacity(modalConfig), createContentIframe(modalConfig)])
                        .then(function () {
                        return Promise.resolve({ data: "success" });
                    });
                }
            }
        };
    }
    return BabContentScriptAPI;
}());
