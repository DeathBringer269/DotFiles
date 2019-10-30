var ask;
(function (ask) {
    var apps;
    (function (apps) {
        var ContentScript;
        (function (ContentScript) {
            var portNamePrefix = "localStorageContentScript";
            var channel;
            var commands = {
                getLocalStorage: function (data) {
                    var storage = window.localStorage;
                    var keys = data && data.keys && data.keys.length ? data.keys : Object.keys(storage);
                    return Promise.resolve(keys.reduce(function (p, key) {
                        p[key] = storage.getItem(key);
                        return p;
                    }, {}));
                }
            };
            function init() {
                var port = chrome.runtime.connect({ name: Util.generateGuid(portNamePrefix + "-" + chrome.runtime.id + "-") });
                channel = {
                    id: port.name,
                    port: port,
                    callbacks: new Map()
                };
                port.onMessage.addListener(onConnectMessage);
            }
            ContentScript.init = init;
            function onConnectMessage(message) {
                var command = commands[message.name] || channel.callbacks.get(message.name);
                if (command) {
                    command(message.data || message.error).then(function (response) {
                        if (message.reply) {
                            channel.port.postMessage({ name: message.reply, data: response });
                        }
                    }).catch(function (err) {
                        if (message.reply) {
                            try {
                                channel.port.postMessage({ name: message.reply, error: err });
                            }
                            catch (error) {
                                Logger.log("localStorageContentScript: Error In onConnectMessage postMessage: " + error);
                            }
                        }
                    });
                }
            }
        })(ContentScript = apps.ContentScript || (apps.ContentScript = {}));
    })(apps = ask.apps || (ask.apps = {}));
})(ask || (ask = {}));
ask.apps.ContentScript.init();
