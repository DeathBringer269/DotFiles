var BabContentScript = (function () {
    function BabContentScript() {
        var _this = this;
        this.init = function () {
            _this.console.log("BabContentScript init called");
            _this.setConnectionWithBackgroundScript();
            return _this.backgroundToken;
        };
        this.portPrefix = "babContentScript";
        this.DEBUG = false;
        this.console = {
            log: this.DEBUG
                ? console.log.bind(window.console)
                : function () {
                }
        };
        this.onMessageFromBackground = function (message) {
            _this.console.log("BabContentScript: received msg " + message.name);
            if (message.name === "background-ready") {
                chrome.storage.local.get(null, function (data) {
                    if (data && data.state && data.state.babType == "injection") {
                        console.log("BabContentScript: onMessageFromBackground: injection babType -> load iframe as modal window");
                        _this.babContentScriptAPI
                            .executeFeature({
                            name: "load-iframe",
                            args: {
                                backgroundToken: _this.backgroundToken, modalConfig: {
                                    widthInPCT: data.browserActionButton ? data.browserActionButton.widthInPCT : undefined,
                                    heightInPCT: data.browserActionButton ? data.browserActionButton.heightInPCT : undefined,
                                    opacity: data.browserActionButton ? data.browserActionButton.opacity : undefined
                                }
                            }
                        })
                            .then(function () { return _this.babContentScriptAPI.executeFeature({ name: "show-iframe" }); });
                    }
                });
                return;
            }
            _this.babContentScriptAPI.executeFeature(message)
                .catch(function (error) {
                console.warn("BabContentScript: onMessageFromBackground: " + message.name + " error:" + (error.message || error));
                return Promise.resolve({ error: error.message || error });
            })
                .then(function (babContentScriptResponse) {
                var responseMessage = {
                    name: message.name,
                    target: message.sender,
                    sender: message.sender,
                    csId: message.csId,
                    data: babContentScriptResponse.data,
                    error: babContentScriptResponse.error
                };
                _this.console.log("BabContentScript: onMessageFromBackground: " + message.name + " response:" + JSON.stringify(responseMessage));
                _this.portToBackground.postMessage(responseMessage);
            });
        };
        this.setConnectionWithBackgroundScript = function () {
            _this.portToBackground = chrome.runtime.connect({ name: _this.portPrefix + "-" + _this.backgroundToken });
            _this.portToBackground.onMessage.addListener(_this.onMessageFromBackground);
        };
        this.createGuid = function () {
            return Array.prototype.reduce.call((crypto).getRandomValues(new Uint32Array(4)), function (p, i) {
                return (p.push(i.toString(36)), p);
            }, []).join("-");
        };
        try {
            this.backgroundToken = contentScriptTokenValue;
        }
        catch (err) {
            this.backgroundToken = this.createGuid();
        }
        this.babContentScriptAPI = new BabContentScriptAPI();
    }
    return BabContentScript;
}());
new BabContentScript().init();
