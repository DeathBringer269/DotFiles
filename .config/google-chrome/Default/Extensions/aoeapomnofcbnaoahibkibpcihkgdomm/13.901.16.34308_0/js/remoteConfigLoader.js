var RemoteConfigLoader = (function () {
    function RemoteConfigLoader(config, remoteConfigStorageName, onRemoteConfigUpdate) {
        var _this = this;
        this.initConfigLoader = function (configUrl) {
            Logger.log("RemoteConfigLoader: init called configUrl " + configUrl);
            _this.configUrl = configUrl;
            return _this.initRemoteConfig()
                .then(_this.scheduleConfigRequest)
                .then(function () { return Promise.resolve(_this.remoteConfig); });
        };
        this.initRemoteConfig = function () {
            return _this.remoteConfigStorage.get()
                .then(function (state) {
                if (state) {
                    _this.remoteConfig = state;
                    Logger.log("RemoteConfigLoader: this.remoteConfig is set to " + _this.remoteConfig);
                    return Promise.resolve();
                }
                Logger.log("RemoteConfigLoader: remoteConfig is not set.");
                return _this.updateRemoteConfig();
            });
        };
        this.updateRemoteConfig = function () {
            return _this.fetchConfig()
                .then(_this.setRemoteConfig);
        };
        this.fetchConfig = function () {
            return new Promise(function (resolve, reject) {
                if (_this.configUrl) {
                    var urlWithRandomParamValue_1 = _this.configUrl + "?" + Util.getRandomUrlParam();
                    Logger.log("RemoteConfigLoader: fetchConfig " + urlWithRandomParamValue_1);
                    AJAX.readConfigJSON(urlWithRandomParamValue_1)
                        .then(function (config) {
                        ask.apps.ul.fireInfoEvent(_this.config.buildVars.unifiedLoggingUrl, {
                            message: "config-on-after",
                            topic: "remote-config-loader",
                            data1: urlWithRandomParamValue_1
                        }, _this.config).catch(Logger.log);
                        resolve(config);
                    })
                        .catch(function (reason) {
                        ask.apps.ul.fireErrorEvent(_this.config.buildVars.unifiedLoggingUrl, {
                            message: "config-on-error",
                            topic: "remote-config-loader",
                            data1: urlWithRandomParamValue_1,
                            data2: "reason-" + reason
                        }, _this.config).catch(Logger.log);
                        reject(reason);
                    });
                }
                else {
                    ask.apps.ul.fireErrorEvent(_this.config.buildVars.unifiedLoggingUrl, {
                        message: "config-on-error",
                        topic: "remote-config-loader",
                        data1: null,
                        data2: "reason-missing-settings-url"
                    }, _this.config).catch(Logger.log);
                    reject("missing-settings-url");
                }
            });
        };
        this.setRemoteConfig = function (state) {
            Logger.log("RemoteConfigLoader: setRemoteConfig to " + JSON.stringify(state));
            _this.remoteConfig = state || RemoteConfigLoader.defaultRemoteConfig;
            _this.remoteConfig.lastFetched = Date.now();
            if (!state) {
                _this.scheduleConfigRequest();
                return Promise.reject("remote config was not fetched");
            }
            return _this.remoteConfigStorage.set(_this.remoteConfig)
                .then(function () { return Promise.resolve(); });
        };
        this.scheduleConfigRequest = function () {
            Logger.log("RemoteConfigLoader: scheduleConfigRequest");
            chrome.alarms.create(_this.remoteConfigStorageName, {
                when: ((_this.remoteConfig && _this.remoteConfig.lastFetched) || 0) + (_this.remoteConfig.refreshIntervalInMS || _this.remoteConfig.refreshInterval),
                periodInMinutes: (_this.remoteConfig.refreshIntervalInMS || _this.remoteConfig.refreshInterval) / 1000 / 60
            });
            return Promise.resolve();
        };
        this.remoteConfigStorageName = remoteConfigStorageName;
        this.remoteConfigStorage = new ChromeStorage(chrome.storage.local, remoteConfigStorageName);
        this.config = config;
        chrome.alarms.onAlarm.addListener(function (alarm) {
            if (alarm.name !== remoteConfigStorageName)
                return;
            Logger.log("RemoteConfigLoader: alarm " + alarm.name + " fired");
            _this.updateRemoteConfig()
                .then(_this.scheduleConfigRequest)
                .then(function () {
                onRemoteConfigUpdate(_this.remoteConfig);
            })
                .catch(Logger.warn);
        });
    }
    RemoteConfigLoader.fiveMins = 300000;
    RemoteConfigLoader.defaultRemoteConfig = {
        lastFetched: 0,
        refreshIntervalInMS: RemoteConfigLoader.fiveMins
    };
    return RemoteConfigLoader;
}());
