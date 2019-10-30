function takeOverNT() {
    var dom = {
        setStyle: function setStyle(e, obj) {
            for (var p in obj) {
                if (obj.hasOwnProperty(p))
                    e.style[p] = obj[p];
            }
        },
        setAttributes: function setAttributes(e, obj) {
            for (var p in obj) {
                if (obj.hasOwnProperty(p))
                    e.setAttribute(p, obj[p]);
            }
        },
        addListeners: function addListeners(e, obj) {
            for (var p in obj) {
                if (obj.hasOwnProperty(p))
                    e.addEventListener(p, obj[p]);
            }
        },
        addChildren: function addChildren(e, array, doc) {
            if (array) {
                for (var i = 0, len = array.length; i < len; ++i) {
                    e.appendChild(dom.createElement(array[i], doc));
                }
            }
        },
        createElement: function createElement(obj, doc) {
            var e = (doc || document).createElement(obj.n);
            dom.setStyle(e, obj.s);
            dom.setAttributes(e, obj.a);
            if (obj.t) {
                e.appendChild((doc || document).createTextNode(obj.t));
            }
            if (obj.h) {
                e.innerHTML += obj.h;
            }
            if (obj.id) {
                e.setAttribute("id", obj.id);
            }
            dom.addListeners(e, obj.l);
            dom.addChildren(e, obj.c, doc);
            return e;
        }
    };
    function injectWTTAPIContentScript(iframe, urlStr) {
        if (BrowserUtils.isAPIAvailable().tabsExecuteScriptFrameIdSupport) {
            iframe.addEventListener("load", function () {
                chrome.tabs.getCurrent(function (tab) {
                    chrome.webNavigation.getAllFrames({ tabId: tab.id }, function (iFrameDetailsArr) {
                        var iframeDetails = iFrameDetailsArr.find(function (iFrameDetails) { return iFrameDetails.url.replace(/(^\w+:|^)\/\//, "") === urlStr.replace(/(^\w+:|^)\/\//, ""); });
                        if (iframeDetails
                            && iframeDetails.parentFrameId === 0
                            && ~location.href.indexOf(PageUtils.getNewTabResourceUrl())) {
                            var injectDetails_1 = {
                                runAt: "document_end",
                                allFrames: false,
                                frameId: iframeDetails.frameId
                            };
                            ["/js/logger.js", "/js/chrome.js", "/js/util.js", "/js/webTooltabAPIProxy.js"]
                                .forEach(function (jsFile) {
                                injectDetails_1.file = jsFile;
                                chrome.tabs.executeScript(tab.id, injectDetails_1, function () {
                                    if (chrome.runtime.lastError) {
                                        Logger.log("extension: product: chrome.runtime.lastError = " + chrome.runtime.lastError.message);
                                        return;
                                    }
                                    Logger.log("extension: product: " + jsFile + " loaded");
                                });
                            });
                        }
                    });
                });
            });
        }
        else {
            Logger.log("extension: product: WTTAPI content script injection is not supported");
        }
    }
    function appendParamsFromResourceUrl(newTabUrl) {
        var paramDelimiter = "?";
        var urlStringSearchIndex = window.location.href.indexOf(paramDelimiter);
        if (urlStringSearchIndex > -1) {
            var nameValues = UrlUtils.parseQueryString(location.href.substr(urlStringSearchIndex + paramDelimiter.length)).nameValues;
            if (nameValues) {
                nameValues.forEach(function (nameValue) {
                    newTabUrl = UrlUtils.appendParamToUrl(newTabUrl, nameValue.encodedName, nameValue.encodedValue || "");
                });
            }
        }
        return newTabUrl;
    }
    function loadWTT(urlStr) {
        if (navigator.onLine) {
            var ifr = document.getElementById("wtt-frame");
            ifr.setAttribute("src", urlStr);
            injectWTTAPIContentScript(ifr, urlStr);
        }
        else {
            document.body.removeChild(document.getElementById("wtt-frame"));
            var elem = dom.createElement({
                n: "div",
                s: {
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    "background-color": "#dddddd",
                    "text-align": "center",
                    display: "table"
                },
                c: [
                    {
                        n: "div", s: { display: "table-row" },
                        c: [
                            {
                                n: "span",
                                s: {
                                    color: "#535353",
                                    display: "table-cell",
                                    "vertical-align": "bottom",
                                    "font-size": "14pt"
                                },
                                t: "Please connect to the Internet to enable page functionality."
                            }
                        ]
                    },
                    {
                        n: "div", s: { display: "table-row" },
                        c: [
                            {
                                n: "span",
                                s: { display: "table-cell", "vertical-align": "bottom", "padding-bottom": "24px" },
                                c: [
                                    {
                                        n: "span",
                                        s: {
                                            "text-transform": "capitalize",
                                            "text-decoration": "none",
                                            color: "black",
                                            "font-size": "10pt"
                                        },
                                        h: "TM, &reg; + &copy; " + new Date().getFullYear() + " " + "CompanyName"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }, document);
            document.body.appendChild(elem);
        }
    }
    var extensionState = new ChromeStorage(chrome.storage.local, "state");
    extensionState.get()
        .then(function (state) {
        var newTabURLWithParamPlaceHolders = state.toolbarData.newTabURL;
        var newTabUrl = appendParamsFromResourceUrl(TextTemplate.parse(newTabURLWithParamPlaceHolders, state.replaceableParams));
        if (!window.localStorage.getItem(PageUtils.assistShownNewTabKey) && !~document.location.href.indexOf("?")) {
            window.localStorage.setItem(PageUtils.assistShownNewTabKey, "1");
            if (PageUtils.isDoorHangerDisplayed()) {
                newTabUrl = PageUtils.appendParamsToShowAssist(newTabUrl);
            }
        }
        newTabUrl = UrlUtils.appendParamToUrl(newTabUrl, PageUtils.stParamName, PageUtils.stParamValueTab);
        loadWTT(newTabUrl);
    })
        .catch(function (err) {
        Logger.log("Unable to get EXTENSION STATE::::", err);
    });
}
function loadIframe() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", takeOverNT);
    }
    else {
        takeOverNT();
    }
}
loadIframe();
