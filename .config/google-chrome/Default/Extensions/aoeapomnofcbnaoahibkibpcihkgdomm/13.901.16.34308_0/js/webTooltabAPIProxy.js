var ask;
(function (ask) {
    var apps;
    (function (apps) {
        var WebTooltabAPIProxy;
        (function (WebTooltabAPIProxy) {
            var portNamePrefix = "webTooltabAPIProxy";
            var channel;
            var contents = new Map();
            var offerServiceState;
            var extensionState;
            var originRegExp;
            var commands = {
                "background-ready": function (data) {
                    sendMessage(channel, { name: "getState" }, function (state) {
                        return Promise.resolve(void 1);
                    });
                    return Promise.resolve(void 1);
                },
                loadContent: function (data) {
                    return loadContent(data.url, data.timeout);
                },
                removeContent: function (data) {
                    var content = contents.get(data.id);
                    if (content) {
                        content.close();
                        return Promise.resolve({ success: true });
                    }
                    return Promise.reject(new Error("\"" + data.id + "\" not found"));
                },
                webtooltab: function (response) {
                    if (response) {
                        response.url = window.location.href;
                        window.postMessage(JSON.stringify(response), response.url);
                    }
                    return Promise.resolve(void 1);
                }
            };
            window.addEventListener("message", handleWebTooltabMessageEvent);
            function loadContent(url, timeout) {
                return new Promise(function (resolve, reject) {
                    if (window.location.href.indexOf(url) >= 0) {
                        reject(new Error("Cannot load \"" + url + "\" inside \"" + window.location.href + "\""));
                    }
                    else {
                        var iframe_1 = document.createElement("iframe");
                        if (timeout) {
                            timeout = setTimeout(function () {
                                if (iframe_1) {
                                    iframe_1.parentNode.removeChild(iframe_1);
                                }
                                reject(new Error("Load content timeout: \"" + url + "\""));
                            }, timeout);
                        }
                        iframe_1.addEventListener("load", function (e) {
                            !timeout || clearTimeout(timeout);
                            resolve({
                                url: url,
                                id: url,
                                parentUrl: window.location.href,
                                timedout: false,
                                close: function () {
                                    iframe_1.parentNode.removeChild(iframe_1);
                                }
                            });
                        }, true);
                        iframe_1.setAttribute("src", url);
                        document.body.appendChild(iframe_1);
                    }
                });
            }
            function init() {
                chrome.storage.local.get(null, function (localStorageData) {
                    offerServiceState = localStorageData && localStorageData.offerService;
                    extensionState = localStorageData && localStorageData.state;
                    var newTabRegExpStr = extensionState && "(^https?://" + new URL(extensionState.toolbarData.newTabURL).host + ")";
                    var previousOfferServiceUrlStr = offerServiceState && offerServiceState.previousOfferURL && "(^https?://" + new URL(offerServiceState.previousOfferURL).host + ")";
                    if (newTabRegExpStr && previousOfferServiceUrlStr) {
                        originRegExp = new RegExp(newTabRegExpStr + "|" + previousOfferServiceUrlStr, "i");
                    }
                    else if (newTabRegExpStr) {
                        originRegExp = new RegExp("" + newTabRegExpStr, "i");
                    }
                });
                var prefix = portNamePrefix + "-" + chrome.runtime.id;
                var port = chrome.runtime.connect({ name: Util.generateGuid("" + prefix) });
                channel = {
                    id: port.name,
                    port: port,
                    callbacks: new Map()
                };
                port.onMessage.addListener(onConnectMessage);
            }
            WebTooltabAPIProxy.init = init;
            function onConnectMessage(message) {
                var command = commands[message.name] || channel.callbacks.get(message.name);
                if (command) {
                    command(message.data || message.error).then(function (response) {
                        if (message.reply) {
                            channel.port.postMessage({ name: message.reply, data: response });
                        }
                    }).catch(function (err) {
                        if (message.reply) {
                            channel.port.postMessage({ name: message.reply, error: err });
                        }
                    });
                }
            }
            function isWebTooltabMessage(e) {
                return originRegExp && originRegExp.test(e.origin)
                    && String(e.data).indexOf("\"destination\":\"" + chrome.runtime.id + "\"") > -1;
            }
            function isValidSource() {
                return new Promise(function (resolve, reject) {
                    chrome.storage.local.get(null, function (localStorageData) {
                        var currentUrlStr = encodeURI(location.href.toLowerCase());
                        var offerServiceState = localStorageData && localStorageData.offerService;
                        var extensionState = localStorageData && localStorageData.state;
                        if (offerServiceState && offerServiceState.previousOfferURL) {
                            var previousOfferURL = encodeURI(offerServiceState.previousOfferURL.toLowerCase());
                            if (currentUrlStr === previousOfferURL) {
                                return resolve();
                            }
                        }
                        if (extensionState && extensionState.toolbarData.newTabURL) {
                            var currentUrl = new URL(currentUrlStr);
                            var newTabUrl = new URL(extensionState.toolbarData.newTabURL);
                            if (currentUrl.hostname === newTabUrl.hostname && currentUrl.pathname === newTabUrl.pathname) {
                                return resolve();
                            }
                        }
                        return reject(new Error("Invalid webtooltab call: : URL: " + window.location.href + " does not match offer-service URL or the new tab URL"));
                    });
                });
            }
            function handleWebTooltabMessageEvent(e) {
                if (isWebTooltabMessage(e)) {
                    isValidSource()
                        .then(function () {
                        sendMessage(channel, {
                            name: "webtooltab",
                            data: JSON.parse(e.data)
                        }, commands.webtooltab);
                    })
                        .catch(function (err) {
                        Logger.log(err.message);
                        var wttAPIError = {
                            destination: JSON.parse(e.data).sender,
                            error: err.message,
                            url: window.location.href
                        };
                        postMessage(JSON.stringify(wttAPIError), location.href);
                    })
                        .catch(Logger.log);
                }
            }
            function sendMessage(conn, message, callback, persistent) {
                var reply;
                if (callback) {
                    reply = Util.generateGuid(message.name + "-");
                    conn.callbacks.set(reply, function (data) {
                        if (!persistent) {
                            conn.callbacks.delete(reply);
                        }
                        return callback(data);
                    });
                }
                conn.port.postMessage({ name: message.name, reply: reply, data: message.data });
            }
        })(WebTooltabAPIProxy = apps.WebTooltabAPIProxy || (apps.WebTooltabAPIProxy = {}));
    })(apps = ask.apps || (ask.apps = {}));
})(ask || (ask = {}));
ask.apps.WebTooltabAPIProxy.init();
