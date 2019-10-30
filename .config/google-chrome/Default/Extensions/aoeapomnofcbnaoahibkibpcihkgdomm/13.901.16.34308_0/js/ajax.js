var AJAX = (function () {
    function AJAX() {
    }
    AJAX.put = function (req) {
        return AJAX.open(Object.assign({ method: "PUT" }, req))
            .then(function (xhr) {
            if (xhr.status === 200) {
                return Promise.resolve(xhr);
            }
            return Promise.reject("xhr.status=" + xhr.status);
        });
    };
    AJAX.get = function (req) {
        if (req.data) {
            if (typeof req.data === "object") {
                var params = Object.keys(req.data || {}).reduce(function (values, key) {
                    var value = req.data[key];
                    if (value !== undefined && value !== null && String(value).length) {
                        value = key + "=" + encodeURIComponent(value);
                    }
                    else {
                        value = key;
                    }
                    values.push(value);
                    return values;
                }, []).join("&");
                req.url = UrlUtils.appendParamStringToUrl(req.url, params);
            }
            else if (typeof req.data === "string") {
                req.url = UrlUtils.appendParamStringToUrl(req.url, req.data);
            }
            delete req.data;
        }
        return AJAX.open(Object.assign({ method: "GET" }, req));
    };
    AJAX.post = function (req) {
        if (typeof req.data === "object") {
            var form = Object.keys(req.data).reduce(function (form, key) {
                form.append(key, req.data[key]);
                return form;
            }, new FormData());
            req.data = form;
        }
        return AJAX.open(Object.assign({ method: "POST" }, req));
    };
    AJAX.readConfigJSON = function (url) {
        return AJAX.get({ url: url, responseType: "json" })
            .then(function (xhr) {
            return Promise.resolve(xhr.response);
        })
            .catch(function (err) {
            err.message += " Unable to load JSON URL:\"" + url + "\"";
            return Promise.reject(err);
        });
    };
    AJAX.open = function (req) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(req.method.toString(), req.url, true);
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    resolve(xhr);
                }
            };
            xhr.onerror = function (err) {
                reject(err);
            };
            xhr.onabort = function (err) {
                reject(err);
            };
            if (req.timeout) {
                xhr.timeout = req.timeout;
                xhr.ontimeout = function (err) {
                    reject(err);
                };
            }
            if (req.headers) {
                Object.keys(req.headers).forEach(function (headerName) {
                    xhr.setRequestHeader(headerName, req.headers[headerName]);
                });
            }
            if (req.responseType)
                xhr.responseType = req.responseType;
            if (req.mimeType)
                xhr.overrideMimeType(req.mimeType);
            xhr.send(req.data);
        });
    };
    return AJAX;
}());
