"use strict";
var OfferService = (function () {
    function OfferService() {
        var _this = this;
        this.exec = function (extensionConfig) {
            Logger.log("os:exec - initializing offerService");
            _this.extensionConfig = extensionConfig;
            _this.dataPoints = _this.getDataPoints();
            _this.logInfoUL({
                message: "on-before",
                topic: "extension-settings",
                data1: _this.extensionConfig.buildVars.offerServiceConfigUrl
            });
            var elapsed = DateTimeUtils.timer(), configUrl = _this.extensionConfig.buildVars.offerServiceConfigUrl + "?" + Util.getRandomUrlParam();
            AJAX.readConfigJSON(configUrl)
                .catch(function (err) {
                return Promise.reject(_this.addUlDataInError(err, {
                    message: "on-error",
                    topic: "extension-settings",
                    data1: configUrl,
                    data2: err.message
                }));
            })
                .then(function (config) {
                _this.logInfoUL({
                    message: "on-after",
                    topic: "extension-settings",
                    data1: configUrl,
                    data2: elapsed().toString()
                });
                _this.config = config;
                _this.stateStorage.get()
                    .then(_this.setOfferServiceState)
                    .then(function () {
                    if (!_this.state.enabled) {
                        Logger.log("os:exec - offer service disabled!");
                        return Promise.resolve();
                    }
                    else {
                        _this.addAlarmListener();
                        _this.showSecondaryOffer()
                            .then(function () { return _this.scheduleOfferServiceCheck(true); });
                    }
                });
            })
                .catch(function (err) {
                Logger.error("os:exec - offer service error: " + err.message);
                if (err.infoSpecificData) {
                    _this.logInfoUL(err.infoSpecificData);
                }
                else {
                    _this.logInfoUL({ message: "on-error", topic: "offer-service-setup", data1: err.message });
                }
            })
                .catch(function (err) {
                Logger.error("os:exec error firing UL event: " + (err && (err.message || err)));
            });
        };
        this.addAlarmListener = function () {
            var checkOfferService = function () {
                _this.checkOfferService()
                    .then(_this.scheduleOfferServiceCheck)
                    .catch(function (err) {
                    Logger.error("os:exec - offer service error: " + err.message);
                    if (err.infoSpecificData) {
                        _this.logInfoUL(err.infoSpecificData);
                    }
                    else {
                        _this.logInfoUL({ message: "on-error", topic: "offer-service", data1: err.message });
                    }
                })
                    .catch(function (err) {
                    Logger.error("os:exec error firing UL event: " + (err && (err.message || err)));
                });
            };
            chrome.alarms.onAlarm.addListener(function (alarm) {
                if (alarm.name === OfferService.alarmName) {
                    checkOfferService();
                }
            });
        };
        this.setOfferServiceState = function (state) {
            if (state) {
                _this.state = state;
            }
            else {
                var oldState = JSON.parse(localStorage.getItem(OfferService.ru1OfferServiceStorageKey));
                if (oldState) {
                    _this.offerServiceUpgrade.fromRUv1 = true;
                    _this.state = oldState;
                    localStorage.removeItem(OfferService.ru1OfferServiceStorageKey);
                }
            }
            _this.updateStateWithNewConfigValues();
            return _this.stateStorage.set(_this.state);
        };
        this.updateStateWithNewConfigValues = function () {
            _this.state.verbose = _this.config.offerServiceSettings.loggingLevel === "verbose";
            _this.state.enabled = _this.config.offerServiceSettings.enabled && !!_this.config.offerServiceSettings.serviceURL;
            if (_this.state.enabled && !!_this.config.offerServiceSettings.refreshFrequency) {
                Object.keys(_this.config.offerServiceSettings.refreshFrequency).forEach(function (key) {
                    _this.state.refreshFrequency[key] = DateTimeUtils.durationToMilliseconds(_this.config.offerServiceSettings.refreshFrequency[key] || "0");
                });
            }
            _this.state.retryInterval = DateTimeUtils.durationToMilliseconds(_this.config.offerServiceSettings.retryInterval || "1h");
            _this.state.retriesLeft = _this.config.offerServiceSettings.maxRetries;
            if (!_this.state.enabled) {
                delete _this.state.offerURL;
                delete _this.state.redirectToWTT;
            }
        };
        this.logInfoUL = function (infoSpecificData) {
            Logger[infoSpecificData.message === "on-error" ? "error" : "log"]("os:Info event, message: " + infoSpecificData.message + ", topic: " + infoSpecificData.topic + ", data1: " + infoSpecificData.data1 + ", data2: " + infoSpecificData.data2);
            if (_this.state.verbose || infoSpecificData.message === "on-error") {
                ask.apps.ul.fireInfoEvent(_this.extensionConfig.buildVars.unifiedLoggingUrl, infoSpecificData, _this.extensionConfig).catch(Logger.warn);
            }
        };
        this.showSecondaryOffer = function () {
            if (_this.state.offerURL) {
                var elapsed_1 = DateTimeUtils.timer(), offerURL_1 = _this.replaceParams(_this.state.offerURL), redirectToWTT = _this.state.redirectToWTT, topic_1 = redirectToWTT ? "show-secondary-offer-and-redirect" : "show-secondary-offer";
                delete _this.state.offerURL;
                delete _this.state.redirectToWTT;
                _this.state.previousOfferURL = offerURL_1;
                _this.stateStorage.set(_this.state);
                _this.logInfoUL({ message: "on-before", topic: topic_1, data1: offerURL_1 });
                return _this.openInNewTab(offerURL_1, redirectToWTT)
                    .then(function () {
                    _this.logInfoUL({ message: "on-after", topic: topic_1, data1: offerURL_1, data2: elapsed_1().toString() });
                    return Promise.resolve();
                })
                    .catch(function (err) {
                    return Promise.reject(_this.addUlDataInError(err, {
                        message: "on-error",
                        topic: topic_1,
                        data1: offerURL_1,
                        data2: err.message
                    }));
                });
            }
            else {
                Logger.log("os: not showing secondary offer since offerURL is not set");
                return Promise.resolve();
            }
        };
        this.scheduleOfferServiceCheck = function (offerServiceCheckWasSuccessful) {
            var createOfferServiceAlarm = function () {
                chrome.alarms.create(OfferService.alarmName, {
                    when: _this.state.nextCheck
                });
            };
            if (_this.isTimeToCheckOfferService()) {
                if (!offerServiceCheckWasSuccessful && _this.state.retriesLeft < 0) {
                    Logger.warn("os: scheduleOfferServiceCheck - do not schedule retry offer service check since out of the number of retries");
                    return Promise.resolve();
                }
                var msToNextCheck = _this.getMsToNextCheck(offerServiceCheckWasSuccessful);
                _this.state.nextCheck = Date.now() + msToNextCheck;
                Logger.log("os: scheduling next offer check in " + OfferService.getDurationTillNextCheck(_this.state.nextCheck));
                _this.stateStorage.set(_this.state);
                createOfferServiceAlarm();
            }
            else if (_this.offerServiceUpgrade.fromRUv1) {
                createOfferServiceAlarm();
            }
            else {
                chrome.alarms.get(OfferService.alarmName, function (alarm) {
                    if (alarm) {
                        Logger.log("os: scheduleOfferServiceCheck - offerCheck would fire in " + OfferService.getDurationTillNextCheck(alarm.scheduledTime));
                    }
                });
            }
            return Promise.resolve();
        };
        this.isTimeToCheckOfferService = function () {
            Logger.log("os: isTimeToCheckOfferService time match=" + (Date.now() >= _this.state.nextCheck) + " offerURL exists=" + _this.state.offerURL + " should check/schedule=" + (Date.now() >= _this.state.nextCheck && !_this.state.offerURL) + " ");
            return Date.now() >= _this.state.nextCheck && !_this.state.offerURL;
        };
        this.checkOfferService = function () {
            if (!_this.config.offerServiceSettings.serviceURL) {
                Logger.log("os:checkOfferService -- serviceURL is empty!");
            }
            else if (_this.isTimeToCheckOfferService()) {
                _this.logInfoUL({
                    message: "on-before",
                    topic: "offer-service",
                    data1: _this.config.offerServiceSettings.serviceURL
                });
                var method = _this.config.offerServiceSettings.serviceMethod || "PUT", elapsed_2 = DateTimeUtils.timer(), ajaxRequest_1 = {
                    url: _this.replaceParams(_this.config.offerServiceSettings.serviceURL),
                }, makeAjaxRequest = void 0;
                if (method === "PUT") {
                    ajaxRequest_1.data = _this.getRequestBody();
                    ajaxRequest_1.responseType = "json";
                    ajaxRequest_1.mimeType = "application/json";
                    ajaxRequest_1.headers = {
                        "content-type": "application/json"
                    };
                    makeAjaxRequest = AJAX.put.bind(null, ajaxRequest_1);
                }
                else {
                    makeAjaxRequest = AJAX.get.bind(null, ajaxRequest_1);
                }
                Logger.log("os:checkOfferService -- method: " + method + ", url: " + ajaxRequest_1.url + ", requestBody: " + ajaxRequest_1.data);
                return makeAjaxRequest()
                    .then(function (xhr) {
                    Logger.log("os:checkOfferService -- url: " + ajaxRequest_1.url + " response: " + JSON.stringify(xhr.response));
                    return xhr.response;
                })
                    .then(function (response) {
                    _this.logInfoUL({
                        message: "on-after",
                        topic: "offer-service",
                        data1: ajaxRequest_1.url,
                        data2: elapsed_2().toString()
                    });
                    _this.state.retriesLeft = _this.config.offerServiceSettings.maxRetries;
                    if (response && response.offerInfo && response.offerInfo.offerURL) {
                        _this.state.offerURL = response.offerInfo.offerURL;
                        _this.state.redirectToWTT = response.offerInfo.noRedirect !== "true";
                    }
                    else {
                        delete _this.state.offerURL;
                        delete _this.state.redirectToWTT;
                    }
                    return _this.stateStorage.set(_this.state)
                        .then(function () { return Promise.resolve(true); });
                })
                    .catch(function (err) {
                    Logger.error("os:checkOfferService err " + err);
                    _this.logInfoUL({
                        message: "on-error",
                        topic: "offer-service",
                        data1: ajaxRequest_1.url,
                        data2: err.message
                    });
                    _this.state.retriesLeft--;
                    return _this.stateStorage.set(_this.state)
                        .then(function () { return Promise.resolve(false); });
                });
            }
            return Promise.resolve(true);
        };
        this.getRequestBody = function () {
            return JSON.stringify(Object.keys(_this.config.offerServiceSettings.requestBody).reduce(function (out, key) {
                out[key] = _this.config.offerServiceSettings.requestBody[key].replace(/{{(\w+)}}/g, function (match, p1) {
                    var value = _this.dataPoints[p1] || "";
                    return typeof value === "function" ? value() : value;
                });
                return out;
            }, {}));
        };
        this.openInNewTab = function (url, supportWTTRedirect) {
            Logger.log("os:openInNewTab(" + url + ", " + supportWTTRedirect + ")");
            if (supportWTTRedirect) {
                Logger.log("os:openInNewTab - supportWTTRedirect - setting up to respond to command URL: " + url + "#command=showNewTab&cobrand=" + _this.dataPoints.cobrandID);
                UrlFragmentActions.init(_this.extensionConfig);
            }
            return new Promise(function (resolve) {
                chrome.tabs.create({ url: url }, resolve);
            });
        };
        this.addUlDataInError = function (err, infoSpecificData) {
            var ulError = err;
            ulError.infoSpecificData = infoSpecificData;
            return ulError;
        };
        this.replaceParams = function (str) {
            var out = str ? TextTemplate.parse(str, _this.extensionConfig.state.replaceableParams) : str;
            Logger.log("os:replaceParams old(" + str + ") returns " + out);
            return out;
        };
        this.getDataPoints = function () {
            var params = _this.extensionConfig.state.replaceableParams;
            return {
                browserID: "",
                browserName: BrowserUtils.getBrowserName(),
                browserVersion: BrowserUtils.getBrowserVersion(),
                campaign: params.affiliateID,
                cobrandID: params.cobrandID,
                coID: params.coID,
                countryCode: params.countryCode || "99",
                country: "",
                installDate: params.installDate,
                installDateHex: params.installDateHex,
                language: BrowserUtils.getLanguage(),
                locale: window.navigator.language,
                os: BrowserUtils.getOS(),
                partnerID: params.partnerID,
                partnerSubID: params.partnerSubID,
                platform: window.navigator.platform,
                redirectedUserID: "",
                toolbarBuildDate: _this.extensionConfig.buildVars.buildDate,
                toolbarID: params.toolbarID,
                toolbarVersion: params.toolbarVersion,
                trackID: params.trackID,
                userAgent: window.navigator.userAgent,
                userSegment: _this.extensionConfig.state.toolbarData.userSegment
            };
        };
        this.offerServiceUpgrade = { fromRUv1: false };
        this.state = Util.clone(OfferService.initialOfferServiceState);
        this.stateStorage = new ChromeStorage(chrome.storage.local, "offerService");
    }
    ;
    OfferService.prototype.getMsToNextCheck = function (offerServiceCheckWasSuccessful) {
        if (this.state.nextCheck !== OfferService.initialOfferServiceState.nextCheck) {
            if (offerServiceCheckWasSuccessful) {
                return this.state.refreshFrequency.fixed ||
                    (this.state.refreshFrequency.minimum + Math.floor(Math.random() * (this.state.refreshFrequency.maximum - this.state.refreshFrequency.minimum)));
            }
            else {
                Logger.log("os: scheduleOfferServiceCheck - schedule retry offer service check. retries left " + this.state.retriesLeft);
                return this.state.retryInterval;
            }
        }
        else {
            return DateTimeUtils.getRandomSecToTwoDelay();
        }
    };
    OfferService.ru1OfferServiceStorageKey = "offerService";
    OfferService.alarmName = "offerServiceCheck";
    OfferService.initialOfferServiceState = {
        nextCheck: 0,
        verbose: true,
        refreshFrequency: {}
    };
    OfferService.getDurationTillNextCheck = function (nextCheck) {
        if (nextCheck && nextCheck > Date.now()) {
            return DateTimeUtils.millisecondsToDuration(nextCheck - Date.now());
        }
        return "0s";
    };
    return OfferService;
}());
