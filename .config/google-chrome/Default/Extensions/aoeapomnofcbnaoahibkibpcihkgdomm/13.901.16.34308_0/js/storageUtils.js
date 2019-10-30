"use strict";
var ChromeStorage = (function () {
    function ChromeStorage(storage, key) {
        this.store = storage;
        this.key = key;
    }
    ChromeStorage.prototype.set = function (state) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var item = {};
            item[_this.key] = state;
            _this.store.set(item, function () {
                var err = chrome.runtime.lastError;
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    };
    ChromeStorage.prototype.get = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.store.get(_this.key, function (result) {
                var err = chrome.runtime.lastError;
                if (err) {
                    reject(err);
                }
                else {
                    var state = void 0;
                    if (result && Object.keys(result).length) {
                        state = result[_this.key];
                    }
                    resolve(state);
                }
            });
        });
    };
    ChromeStorage.prototype.update = function (newState) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.get().then(function (state) {
                var mergedState = Util.mergeObjects(state, newState);
                _this.set(mergedState).then(function () {
                    resolve(mergedState);
                }).catch(reject);
            }).catch(reject);
        });
    };
    return ChromeStorage;
}());
