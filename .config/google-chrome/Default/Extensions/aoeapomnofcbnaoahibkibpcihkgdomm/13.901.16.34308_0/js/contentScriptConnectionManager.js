var ContentScriptConnectionManager = (function () {
    function ContentScriptConnectionManager(extensionStateStorage) {
        var _this = this;
        this.connectionOperations = {
            addConnectionToContentScript: function (port) {
                Logger.log("connection set up with " + port.name);
                var conn = {
                    id: port.name,
                    port: port,
                    callbacks: new Map(),
                    sender: port.sender ? port.sender : undefined
                };
                _this.connections.set(conn.id, conn);
                port.onDisconnect.addListener(function () {
                    _this.connections.delete(conn.id);
                });
                port.onMessage.addListener(function (message) {
                    _this.onMessageFromContentScript(message, conn);
                });
                _this.notifyContentScript(conn);
            },
            initMessageHandler: function (babConfig) {
                Logger.log("ContentScriptConnectionManager: addConnectionToContentScript: initMessageHandler babConfig:" + JSON.stringify(babConfig));
                if (!babConfig.reCaptcha) {
                    ask.apps.ul.fireErrorEvent(_this.config.buildVars.unifiedLoggingUrl, {
                        message: "missing-reCaptcha-account-details",
                        topic: "browser-action"
                    }, _this.config);
                    return;
                }
                _this.babReCaptcha = babConfig.reCaptcha;
                _this.babIframeProxy.origin = new URL(babConfig.proxyUrl).origin;
                _this.babIframeProxy.token = null;
            },
            addOnMessageHandlerForBabIframeProxy: function () {
                return _this.onMessageFromBabIframeToProxy;
            },
            getContentScriptConnectionByTabAndWin: function (csPrefix, tabAndWindowIdentifier) {
                var connectionsIterator = _this.connections.values();
                var connection = connectionsIterator.next();
                while (!connection.done) {
                    if (~connection.value.port.name.indexOf(csPrefix) &&
                        connection.value.sender && connection.value.sender.tab &&
                        connection.value.sender.tab.id === tabAndWindowIdentifier.tabId &&
                        connection.value.sender.tab.windowId === tabAndWindowIdentifier.windowId) {
                        return connection.value;
                    }
                    connection = connectionsIterator.next();
                }
                return undefined;
            },
            getContentScriptContentionByToken: function (csPrefix, token) {
                return _this.connections.get(csPrefix + "-" + token);
            },
            removeConnectionToContentScript: function (conn) {
                if (!conn)
                    return;
                conn.port.disconnect();
            },
            removeBABConnectionsToContentScripts: function (token) {
                _this.connectionOperations.removeConnectionToContentScript(_this.connectionOperations.getContentScriptContentionByToken("babContentScript", token));
                _this.connectionOperations.removeConnectionToContentScript(_this.connectionOperations.getContentScriptContentionByToken("babPageContentScript", token));
            },
            getCallbackQueueSize: function () {
                return _this.babProxyResponseMsgTemplates.size;
            }
        };
        this.notifyExistingContentScripts = function (config) {
            _this.config = config;
            _this.babApi = new BabAPI(_this.config);
            _this.webtooltabAPI = webtooltab.getAPI(config);
            _this.getExtensionInfo()
                .then(function (info) {
                _this.extensionInfo = info;
                _this.connections.forEach(function (connection) {
                    _this.notifyContentScript(connection);
                });
            });
        };
        this.getExtensionInfo = function () {
            return new Promise(function (resolve) {
                if (chrome.management && chrome.management.getSelf) {
                    Logger.log("Background: getExtensionInfo: chrome.management.getSelf IS available. Retrieving extension info.");
                    chrome.management.getSelf(function (info) {
                        resolve(info);
                    });
                }
                else {
                    Logger.log("Background: getExtensionInfo: chrome.management.getSelf is NOT available. Resolving with empty info object {}.");
                    resolve(null);
                }
            });
        };
        this.notifyContentScript = function (connection) {
            var portNamePrefix = connection.id.substr(0, connection.id.indexOf("-"));
            var notifyingContentScript = new Promise(function (resolve) { return resolve(); });
            switch (portNamePrefix) {
                case "webTooltabAPIProxy":
                    if (_this.config) {
                        notifyingContentScript = _this.sendBackgroundReadyMessage(connection)
                            .then(function () { return _this.sendWebtooltabInitMessage(connection); });
                    }
                    break;
                case "babPageContentScript":
                    if (_this.config.buildVars.babType === "popUp") {
                        notifyingContentScript = new Promise(function (resolve) {
                            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                                var currentTab = tabs[0];
                                BabClickHandler.getInjectionDetails(currentTab, _this.config.state.toolbarData.newTabURL)
                                    .then(function (injectDetailsArr) {
                                    var portNameToken = connection.id.substr(connection.id.indexOf("-") + 1, connection.id.length);
                                    var tokenValueInjection = {
                                        runAt: "document_start",
                                        code: "var contentScriptTokenValue = \"" + portNameToken + "\";"
                                    };
                                    injectDetailsArr.unshift(tokenValueInjection);
                                    Logger.log("ContentScriptConnectionManager: notifyContentScript injecting babContentScript.js into " + currentTab.url + " injection details " + JSON.stringify(injectDetailsArr));
                                    Promise
                                        .all(injectDetailsArr.map(function (injectDetails) { return new Promise(function (resolveOnScriptInjection) {
                                        chrome.tabs.executeScript(currentTab.id, injectDetails, function () {
                                            if (chrome.runtime.lastError) {
                                                ask.apps.ul.fireErrorEvent(_this.config.buildVars.unifiedLoggingUrl, {
                                                    message: "failed-inject-babContentScript lastError " + chrome.runtime.lastError.message,
                                                    topic: "browser-action"
                                                }, _this.config);
                                                resolveOnScriptInjection(false);
                                                return;
                                            }
                                            resolveOnScriptInjection(true);
                                        });
                                    }); }))
                                        .then(function (scriptInjectionResults) { return resolve(!scriptInjectionResults.some(function (result) { return !result; })); });
                                })
                                    .catch(function (err) {
                                    ask.apps.ul.fireErrorEvent(_this.config.buildVars.unifiedLoggingUrl, {
                                        message: "failed-inject-babContentScript err " + err.message,
                                        topic: "browser-action"
                                    }, _this.config);
                                    resolve(false);
                                });
                            });
                        }).then(function (babContentScriptInjected) { return _this.sendAvailableFeatures(connection, babContentScriptInjected); });
                    }
                    else {
                        notifyingContentScript = _this.sendAvailableFeatures(connection);
                    }
                    break;
                case "extensionDetect":
                case "babContentScript":
                    if (_this.config) {
                        notifyingContentScript = _this.sendBackgroundReadyMessage(connection);
                    }
                    break;
            }
            notifyingContentScript
                .catch(function (err) {
                Logger.warn("ContentScriptConnectionManager: notifyExistingContentScripts error " + err);
                _this.connections.delete(connection.id);
            });
        };
        this.contentAPI = {
            getState: function () {
                return _this.extensionStateStorage.get();
            },
            webtooltab: function (message) {
                if (message.destination != chrome.runtime.id) {
                    return Promise.resolve({
                        destination: message.sender,
                        error: "Invalid webtooltab message: \"" + JSON.stringify(message) + "\""
                    });
                }
                return new Promise(function (resolve) {
                    var method = Util.resolveName(message.cmd, _this.webtooltabAPI);
                    if (method) {
                        return method.apply(_this.webtooltabAPI, message.args).then(function (response) {
                            response.destination = message.sender;
                            resolve(response);
                        }).catch(function (err) {
                            resolve({
                                destination: message.sender,
                                error: err.toString()
                            });
                        });
                    }
                    resolve({
                        destination: message.sender,
                        error: "Method not found \"" + message.cmd + "\""
                    });
                    return;
                });
            }
        };
        this.getCsTokenFromConnection = function (connection) {
            return connection.id.substr(connection.id.indexOf("-") + 1);
        };
        this.onMessageFromBabIframeToProxy = function (messageEvent) {
            if (messageEvent.origin == _this.babIframeProxy.origin && messageEvent.data && messageEvent.data.name && messageEvent.data.bsToken) {
                var messageFromIframe = messageEvent.data;
                Logger.log("ContentScriptConnectionManager: onMessageFromBabIframeToProxy received message " + JSON.stringify(messageFromIframe));
                switch (messageFromIframe.name) {
                    case "iframe-loaded":
                        _this.babIframeProxy.token = messageEvent.data.bsToken;
                        _this.babIframeProxy.availableFeatures = messageEvent.data.data;
                        _this.babIframeProxy.window = messageEvent.source;
                        _this.babIframeProxy.window.postMessage({
                            name: "set-recaptcha",
                            bsToken: _this.babIframeProxy.token,
                            args: _this.babReCaptcha
                        }, _this.babIframeProxy.origin);
                        break;
                    case "invoke-proxy-call":
                        var returnData = _this.babProxyResponseMsgTemplates.get(messageFromIframe.bsId);
                        if (!returnData) {
                            Logger.warn("ContentScriptConnectionManager: onMessageFromBabIframeToProxy: " + messageFromIframe.name + " no ContentScriptReplyMessage for " + messageFromIframe.bsId + " found");
                            return;
                        }
                        _this.sendBabMessage(Object.assign(returnData.responseTemplate, {
                            data: messageFromIframe.data,
                            error: messageFromIframe.error
                        }), returnData.csToken);
                        _this.babProxyResponseMsgTemplates.delete(messageFromIframe.bsId);
                        break;
                    default:
                        Logger.warn("ContentScriptConnectionManager: onMessageFromBabIframeToProxy received unsupported message " + messageFromIframe.name);
                }
            }
        };
        this.onMessageFromContentScript = function (message, connection) {
            var processingMessage = ~connection.id.indexOf("babPageContentScript") || ~connection.id.indexOf("babContentScript")
                ? _this.onBabMessageFromContentScript(message, connection)
                    .then(function (msg) { return _this.sendBabMessage(msg, _this.getCsTokenFromConnection(connection)); })
                : _this.onContentAPIMessageFromContentScript(message, connection);
            processingMessage
                .catch(function (err) {
                Logger.warn("ContentScriptConnectionManager: onMessageFromContentScript error: " + err);
                _this.connections.delete(connection.id);
            });
        };
        this.onBabMessageFromContentScript = function (babMessage, connection) {
            var returnMessage = {
                name: babMessage.name,
                target: babMessage.sender,
                sender: babMessage.sender,
                csId: babMessage.csId
            };
            Logger.log("ContentScriptConnectionManager: onBabMessageFromContentScript name:" + babMessage.name + " target:" + babMessage.target);
            return new Promise(function (resolve) {
                switch (babMessage.target) {
                    case "backgroundScript":
                        return _this.babApi.executeFeature(babMessage, connection)
                            .then(function () {
                            returnMessage.data = "success";
                            resolve(returnMessage);
                            return;
                        })
                            .catch(function (err) {
                            returnMessage.error = err;
                            resolve(returnMessage);
                            return;
                        });
                    case "babIframeToProxy":
                        if (!_this.babIframeProxy.window && !_this.babIframeProxy.origin) {
                            returnMessage.error = "iframe to proxy is not set in a background";
                            resolve(returnMessage);
                            return;
                        }
                        if (!_this.babIframeProxy.token) {
                            returnMessage.error = "iframe to proxy is not loaded properly (404 or 5xx error)";
                            if (_this.config) {
                                ask.apps.ul.fireErrorEvent(_this.config.buildVars.unifiedLoggingUrl, {
                                    message: "proxy-iframe-not-loaded",
                                    topic: "browser-action",
                                }, _this.config).catch(Logger.warn);
                            }
                            resolve(returnMessage);
                            return;
                        }
                        var babIframeToProxyRequestMessage = {
                            name: babMessage.name,
                            bsToken: _this.babIframeProxy.token,
                            args: babMessage.args,
                            sender: babMessage.sender,
                            target: babMessage.target,
                            bsId: Util.generateGuid()
                        };
                        var csToken = _this.getCsTokenFromConnection(connection);
                        _this.babProxyResponseMsgTemplates.set(babIframeToProxyRequestMessage.bsId, {
                            responseTemplate: returnMessage,
                            csToken: csToken
                        });
                        Logger.log("ContentScriptConnectionManager: onBabMessageFromContentScript: ContentScriptReplyMessage for " + babIframeToProxyRequestMessage.bsId + " set csToken=" + csToken);
                        resolve(babIframeToProxyRequestMessage);
                        return;
                    case "babContentScript":
                    case "babPageContentScript":
                        resolve(babMessage);
                        return;
                    default:
                        returnMessage.error = "message target is invalid";
                        resolve(returnMessage);
                        return;
                }
            });
        };
        this.sendBabMessage = function (babMessage, csToken) {
            if (!babMessage) {
                Logger.warn("ContentScriptConnectionManager: sendBabMessage babMessage is not set");
                return Promise.resolve();
            }
            if (babMessage.target === "backgroundScript") {
                Logger.log("ContentScriptConnectionManager: sendBabMessage target is \"backgroundScript\" no need to send the message");
                return Promise.resolve();
            }
            if (babMessage.bsId) {
                Logger.log("ContentScriptConnectionManager: sendBabMessage to " + _this.babIframeProxy.origin + " message " + JSON.stringify(babMessage));
                _this.babIframeProxy.window.postMessage(babMessage, _this.babIframeProxy.origin);
                return Promise.resolve();
            }
            var targetConnection = _this.connectionOperations.getContentScriptContentionByToken(babMessage.target, csToken);
            if (!targetConnection) {
                Logger.warn("ContentScriptConnectionManager: sendBabMessage could not find port \"" + babMessage.target + "-" + csToken + "\"");
                return Promise.resolve();
            }
            Logger.log("ContentScriptConnectionManager: sendBabMessage to " + targetConnection.id + " message " + JSON.stringify(babMessage));
            targetConnection.port.postMessage(babMessage);
            return Promise.resolve();
        };
        this.onContentAPIMessageFromContentScript = function (message, conn) {
            var command;
            return new Promise(function (resolve) {
                command = conn.callbacks.get(message.name) || _this.contentAPI[message.name];
                if (command) {
                    command(message.data)
                        .then(function (response) {
                        if (message.reply) {
                            conn.port.postMessage({ name: message.reply, data: response });
                            resolve();
                        }
                    })
                        .catch(function (err) {
                        if (message.reply) {
                            conn.port.postMessage({ name: message.reply, error: err.toString() });
                            resolve();
                        }
                    });
                }
                else {
                    resolve();
                }
            });
        };
        this.sendBackgroundReadyMessage = function (conn) {
            return new Promise(function (resolve) {
                _this.sendCSMessage(conn, {
                    name: "background-ready",
                    data: {
                        info: _this.extensionInfo,
                        state: _this.config
                    }
                });
                resolve();
            });
        };
        this.sendWebtooltabInitMessage = function (conn) {
            return new Promise(function (resolve) {
                _this.sendCSMessage(conn, {
                    name: "webtooltab",
                    data: {
                        info: _this.extensionInfo,
                        url: conn.port.sender ? conn.port.sender.url : "",
                        features: Util.getObjectAPI(_this.webtooltabAPI),
                        messagingApiV2: true
                    }
                });
                resolve();
            });
        };
        this.sendAvailableFeatures = function (conn, includeCsAvailableFeatures) {
            if (includeCsAvailableFeatures === void 0) { includeCsAvailableFeatures = true; }
            var message = {
                name: "set-available-features",
                data: (_this.babApi.getBackgroundFeatures() || []).concat(_this.babIframeProxy.availableFeatures || [], includeCsAvailableFeatures ? (_this.csAvailableFeatures || []) : [])
            };
            conn.port.postMessage(message);
            return Promise.resolve();
        };
        this.sendCSMessage = function (conn, message, callback, persistent, thisArg) {
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
        };
        this._connections = new Map();
        this.babProxyResponseMsgTemplates = new Map();
        this.webtooltabAPI = {};
        this.config = null;
        this.extensionStateStorage = extensionStateStorage;
        this.babIframeProxy = {
            window: null,
            token: null,
            availableFeatures: null,
            origin: null
        };
        this.csAvailableFeatures = new BabContentScriptAPI().getBabContentScriptAPI();
    }
    Object.defineProperty(ContentScriptConnectionManager.prototype, "connections", {
        get: function () {
            return this._connections;
        },
        enumerable: true,
        configurable: true
    });
    return ContentScriptConnectionManager;
}());
