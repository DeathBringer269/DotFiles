var lovely = (function () {

    const BACKEND_INSERT_IP_URL = "https://api.lovelytab.com/api/ip.php?api=api_v1&page=insert";
    const UNINSTALL_URL = "https://blog.lovelytab.com/uninstall";
    const LOCATION_API_URL = "https://json.geoiplookup.io/";
    const WEATHER_KEYS_URL = "https://monadbackend.online/extensions-data/weatherAPI/weatherAPPIDs.json";
    const WEATHER_API_URL = 'http://api.openweathermap.org/data/2.5/forecast?q=';

    /* Global*/
    var lastAutocompleteQuery = '';
    //Push settings
    var pushImageEndpoint = 'https://lovelytab.com/extension-format/imageBase64.php?url=';
    var pushFormatEndpoint = 'https://lovelytab.com/extension-format/formatResponse.php?raw=';
    var pushInactive = 72;
    var waiting;

    async function onExtensionInstalled(details) {
        var installedTime = Date.now();
        //Povuci podatke iz settingsUrl iz offline.json-a - zanemariti lokalne podatke
        //Sacuvati sve te podatke u Storage i periodicno ih update-ovati (2h)
        //Napraviti funkciju koja ce sluziti za update i samo je pozvati ovdje asinhrono
        const REMOTE_CONFIG = await getAsyncJSON((await getAsyncJSON('/js/offline.json')).settingsUrl);
        await saveStorage('config', REMOTE_CONFIG);

        //Necessary storage
        await saveStorage('searchEngine', REMOTE_CONFIG.searchURL[0])

        //Trigger backend IP insertion 
        await getAsyncJSON(BACKEND_INSERT_IP_URL);

        //Setovati backgrounds odvojeno u storage i pripremiti sledecu sliku
        //Backgrounds (base64 i setovati jednu kao sledecu sliku) (update recuresively 24h)
        await initBackgrounds();
        //Nakon toga dodati ostale slike u backgrounds storage
        updateBackgrounds();

        //Set Storage
        //Format install date
        var date = new Date(),
            locale = "en-us";
        //var installDate = date.toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
        var installDate = date.toLocaleString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit"
        });

        var settings = {
            time: 'standard',
            weather: "metric",
            news: false,
            quotes: true,
            push: true,
            pushLast: installedTime,
            lastActive: installedTime,
            uuid: uuid(),
            installed: installDate
        };

        await saveStorage('settings', settings);

        var rating = {
            rating: false,
            timestamp: false,
            dismissed: false
        }

        await saveStorage('rate', rating);

        var favoriteBackgrounds = [];

        await saveStorage('favoriteBackgrounds', favoriteBackgrounds);

        //Setovati odmah, a u back.js-u napraviti interval na minut da se update-uje
        //bookmarks (0.01h), 
        await updateBookmarks();
        //apps (0.01h)
        await updateApps();

        //Setovati odvojeno storage
        //Lokacija (1h), 
        await updateLocation();

        lovely.saveStorage('pushNotifications', [])

        //Otvori oninstall url
        window.open(REMOTE_CONFIG.installRedirectURL, '_blank');
        //Setovati uninstall URL - iz remote settings-a
        var uninstallURL = UNINSTALL_URL + "?ID=" + REMOTE_CONFIG.extensionAnalyticsID + "&Name=" + REMOTE_CONFIG.extensionName;
        chrome.runtime.setUninstallURL(uninstallURL);

        //igrice (1h), 
        updateGames();
        //quotes (1h),
        updateQuotes();
        //news (1h), 
        updateNews();
        //Vremenska prognoza (24h), 
        updateWeather();
        //quicklinks
        updateQuicklinks();

        chrome.management.getAll(async function (result) {
            var extensions = 0,
                i = 0;
            result.forEach(function (element) {
                if (element.type === 'extension') {
                    extensions++;
                }
            })
            await saveStorage('extensions', extensions)
        })



        //Poslati install i activeuser event Google Analytics
        analyticsSendEvent('installed', REMOTE_CONFIG.extensionName)
        analyticsSendEvent('activeUser')


    }

    async function updateFull() {
        return new Promise(async (resolve, reject) => {
            const REMOTE_CONFIG = await getAsyncJSON((await getAsyncJSON('/js/offline.json')).settingsUrl);
            await saveStorage('config', REMOTE_CONFIG);

            //Necessary storage
            await saveStorage('searchEngine', REMOTE_CONFIG.searchURL[0])

            //Nakon toga dodati ostale slike u backgrounds storage
            updateBackgrounds();

            await updateLocation();

            //igrice (1h), 
            updateGames();
            //quotes (1h),
            updateQuotes();
            //news (1h), 
            updateNews();
            //Vremenska prognoza (24h), 
            updateWeather();
            //quicklinks
            updateQuicklinks();

            resolve(true)
        });
    }

    /* Storage API */
    function saveStorage(key, data) {
        return new Promise((resolve, reject) => {
            if (key !== 'backgrounds' && key !== 'favoriteBackgrounds') {
                resolve(localStorage.setItem(key, JSON.stringify(data)));
            } else {
                chrome.storage.local.set({
                    [key]: data
                }, async function () {
                    if (chrome.runtime.lastError) {
                        var curStorage = await loadStorage(key);
                        if (data !== curStorage) {
                            reject(false);
                        }
                    }
                    resolve(true);
                });
            }

        });
    }

    function loadStorage(key) {
        return new Promise((resolve, reject) => {
            if (key !== 'backgrounds' && key !== 'favoriteBackgrounds') {
                resolve(JSON.parse(localStorage.getItem(key)));
            } else {
                chrome.storage.local.get(key, function (data) {
                    resolve(data[key])
                })
            }
        });
    }

    function saveStorageSetting(key, data) {
        return new Promise(async (resolve, reject) => {
            var curStorage = await loadStorage('settings');
            var newStorage = {
                ...curStorage
            };
            newStorage[key] = data;
            var result = await saveStorage('settings', newStorage);
            resolve(result);
        })
    }

    function loadStorageSetting(key) {
        return new Promise(async (resolve, reject) => {
            var settings = (await loadStorage('settings'));
            resolve(settings[key]);
        })
    }

    function proceed() {
        //Background
        prepareNextBackground();

        //Weather
        currentWeather();
        forecast();
        //Delay flickering
        setTimeout(() => {
            //News
            showNews();
            //Quotes
            showQuotes();
            //Quicklinks
            showQuickLinks(1);
        }, 1000);
        //Apps
        showApps();
        //Bookmarks
        showBookmarks();
        //Games
        showGames();
        //Favorite Backgrounds 
        favoriteBackgrounds();
        //Remove black overlay and show search
        $('.site-wrapper').css('background', 'none');
        //Search Engine
        searchEngine();
        searchEngineOptions();

        setRateWidget();
        //Show all widgets
        setTimeout(function () {
            showWidgets();
            addRemoteLinks();
        }, 2000);
        //Set time ticker
        setInterval(function () {
            showTime();
        }, 1000);
    }

    /* Backgrounds */
    //Uzeti jednu sliku sa remote url-a i postaviti je za sljedecu sliku
    // - storage treba nazvati currentBackground ili tako nesto da bi iz
    //   njega front samo uzimao sliku koju treba da prikaze
    async function initBackgrounds() {
        return new Promise(async (resolve, reject) => {
            var photosURL = (await loadStorage('config')).photosFetchURL;
            var photos = (await getAsyncJSON(photosURL)).data;
            var photo = photos[0];

            var photoEncoded = await imageURLtoBase64(photo.imageUrl);
            photo.imageBase64 = photoEncoded;
            var save = await saveStorage('currentBackground', photo);
            //Initiate backgrounds storage
            var allBackgrounds = [];
            var saveAll = await saveStorage('backgrounds', allBackgrounds);

            resolve(save, saveAll);
        })
    }

    async function updateBackgrounds() {
        return new Promise(async (resolve, reject) => {
            var photosURL = (await loadStorage('config')).photosFetchURL;
            var photos = (await getAsyncJSON(photosURL)).data;
            var photosStorage = await loadStorage('backgrounds');

            //Prelazi jednu po jednu
            for (var i = 0; i < photos.length; i++) {
                var photo = photos[i];
                //Check if exists in storage
                var download = photosStorage.filter(photoStored => photoStored.imageUrl == photo.imageUrl);
                //Download image if image it is not downloaded
                if (!download.length) {
                    //Download and save image to storage
                    var photoEncoded = await imageURLtoBase64(photo.imageUrl);
                    photo.imageBase64 = photoEncoded;
                    photosStorage.push(photo)
                    save = await saveStorage('backgrounds', photosStorage);
                    //Update storage for next iteration
                    photosStorage = await loadStorage('backgrounds');
                }
            }
            resolve(true)
        })
    }

    async function prepareNextBackground() {
        return new Promise(async (resolve, reject) => {
            var backgrounds = await loadStorage('favoriteBackgrounds');
            if (backgrounds && backgrounds.length == 1) {
                var save = await saveStorage('currentBackground', backgrounds[0]);
                resolve(save);
            } else {
                if (!backgrounds || backgrounds.length == 0) {
                    backgrounds = await loadStorage('backgrounds');
                }
                var currentBackground = await loadStorage('currentBackground');
                var randomBackground = Math.floor((Math.random() * backgrounds.length));
                while (backgrounds[randomBackground].imageUrl === currentBackground.imageUrl || (backgrounds[randomBackground].show && backgrounds[randomBackground].show == 'notShow')) {
                    randomBackground = Math.floor((Math.random() * backgrounds.length));
                }
                var save = await saveStorage('currentBackground', backgrounds[randomBackground]);
                resolve(save);
            }
        })
    }

    async function imageURLtoBase64(imageURL) {
        return new Promise(async (resolve, reject) => {
            fetch(imageURL)
                .then(response => response.blob())
                .then(blob => {
                    var reader = new FileReader();
                    reader.onload = function () {
                        resolve(this.result)
                    };
                    reader.readAsDataURL(blob);
                });
        })
    }

    function setBackground() {
        return new Promise(async (resolve, reject) => {
            var currentBackground = await loadStorage('currentBackground');

            $("body").css({
                "background": "url(" + currentBackground.imageBase64 + ") no-repeat center center fixed",
                "background-size": "cover"
            });
            proceed();
        })
    }

    /* Favorite Backgrounds */

    async function favoriteBackgrounds() {
        var allBackgrounds = await lovely.loadStorage('backgrounds');
        var favoriteBackgrounds = await lovely.loadStorage('favoriteBackgrounds');
        var ifShow;

        allBackgrounds.forEach(function (item, index) {
            var backgroundIcon = "favorite_border";
            var inSelection = "false";
            var classRemove = '',
                classRemoveButton = '';
            ifShow = true;

            favoriteBackgrounds.forEach(function (selectionItem) {
                if (item.imageUrl == selectionItem.imageUrl) {
                    backgroundIcon = "favorite";
                    inSelection = "true";
                }
            });

            if (item.show && item.show === 'notShow') {
                classRemove = 'backgroundNotShow';
                classRemoveButton = 'buttonNotShow';
                ifShow = false;
            }

            var imageForSelection = '<div class="col s12">';
            imageForSelection += '<div class="card">';
            imageForSelection += '<div class="card-image">';
            imageForSelection += '<img src="' + item.imageUrl + '" class="manageSelectionTrigger ' + classRemove + '" data-index="' +
                index +
                '">';

            imageForSelection +=
                '<a class="btn-floating halfway-fab background-selection-heart waves-effect waves-light red"><i class="material-icons manageSelection manageSelection' +
                index +
                '" data-inSelection="' +
                inSelection +
                '" data-index="' +
                index +
                '">' +
                backgroundIcon +
                "</i></a>";
            //remove
            imageForSelection +=
                '<a class="btn-floating halfway-fab background-selection-heart waves-effect waves-light red remove"><i class="material-icons manageSelectionRemove manageSelectionRemove' +
                index +
                ' ' + classRemoveButton + '" data-inSelection="' +
                inSelection +
                '" data-index="' +
                index +
                '">' +
                'clear' +
                "</i></a>";
            //remove
            imageForSelection += "</div>";
            imageForSelection += "</div>";
            imageForSelection += "</div>";

            $(".backgroundSelection").append(imageForSelection);

        });
        initFavoriteBackgroundsisteners(favoriteBackgrounds, allBackgrounds);
        initRemoveBackgroundsisteners(allBackgrounds);
    }

    /* Search */
    async function searchEngine() {
        var searchEngine = await loadStorage('searchEngine');
        setTimeout(() => {
            $('.searchEngineSelect').css("background", "url(" + searchEngine.icon + ")");
        }, 500);
    }

    async function searchEngineOptions() {
        var searchEngines = (await loadStorage('config')).searchURL;
        //var searchEngines = [{ icon: "https://image.lovelytab.com/img/search/google-1543234216.png", name: "Google", url: "https://search.lovelytab.com/#gsc.tab=0&gsc.q=" }, { icon: "data:image/png;base64,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", name: "Google", url: "https://search.lovelytab.com/#gsc.tab=0&gsc.q=" }]
        if (searchEngines.length > 1) {
            var searchEngineOptionsInject = "";
            searchEngines.forEach(function (search, index) {
                searchEngineOptionsInject += '<li class="searchEngineOption" data-index="' + index + '"><a href="#!"><img class="searchEngineIcon" src="' + search.icon + '">' + search.name + '</a></li>';
            });
            $('#searchEngineOptions').html(searchEngineOptionsInject);
            $('.searchEngineOption').click(function () {
                var searchEngineIndex = $(this).attr('data-index');
                changeSearchEngine(searchEngineIndex);
            });
        }
    }

    async function changeSearchEngine(id) {
        var searchEngines = (await loadStorage('config')).searchURL;
        //var searchEngines = [{ icon: "https://image.lovelytab.com/img/search/google-1543234216.png", name: "Google", url: "https://search.lovelytab.com/#gsc.tab=0&gsc.q=" }, { icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAABRFBMVEX////qQzU0qFNChfT7vAXm7v07gvSAqffqQTP7ugDpNCLqPi81f/T7uAAtpk7/vQDpOSggo0a70PovfPP50c4opUvpOyv5/fr8wQDpMB398O/r9u4do0X++Pj86OfpOzb74N7R4Pzh8eX+8tb4x8R9w45Ss2vucmnrUkb//PKxyvoyqUjU69lCgvzG2Pv7xj/tX1W/4cfw9f6e0aq13L/wg3v/+ORHifDxjIVFrmFxvoRht3WMsvjzop2dvPj3wr/2t7Pylo/0rajOuzb846rcvCr82IR3pPbsvh9NoLRar1en1bKOtUy6ukBJlNP8zFlhmPWLyZpnt2pMpJ6juEZCp3w+lMRxsVNFpYxIj99lmvVMm8BEqnHxeSz1mCT80Wn5rhrtWzTvajH93pjwe0jyhif+7ML2nCHtaV7rWk792oz7zFGsz3cVAAALfklEQVR4nO2c7Xva1hnGhUIcIdlCipGwALuE8OaYJBBMYyAk2EubrLRNvK7r2mXNtqypvfz/3ychwJI4RzovOkci5f7Qq+l1xdLPz8v9nBdVELbaaqutttoqbTp0lfRrxKzSUWE6OR+0um1JtlzJWqbdbZ1NLurV0mbjVuuTQTcj20SmqUi2MgvZ/6oopqbJltlunV0USkm/KYEOC5OrjGmjKSssoGxUU5al9mBaTfqVMWTTXdtxU6RwOB+nKVvaYHqU9KujqDQdZCwNmc2LaVN2J4V0F2Zp2pJkkwRvIUWT2+fVpDGgqrc0OaLs0ELZnqSx9RxNFIsebwGpWa160kABFVoaUe1BpVjXFykK5LRLVXxgSXLmPCWMU0lW4sZzGTUrDYzTthx7+DyMWtKML64Z8rmMmYsE+apXjPLTxyi3k+qrpTOLPd+c0WolMs5NMxoXPkemOeHOd3TFuAD9kuRulS/gBYcC9EuReYaRcwBd2WHkVo1ThXcAXSnKCz6AgwQC6EqSzzjwHXFsoevS2sxHnBdaMhm6lCIV2AJOEsvQpSSN6RTXShzQmXDYFWOpm2QJ3khuMdqtOmqbSbMtpF0x6TdVKdke45EkVxkAFlJQggtJJot+Wo93o4lGkva5A1osAAtWegBlFiv+NAEyqcFqXHvZ9JJkFoBHabIJFoCHmfQAMumih920TDKMalAYpGMWzbBKUXu5lDTYUowA61aMrygpS0noR/yrv80mRY/iGWWc+xaWnGl3r1pzXV23TSv6nobvRzBpMnaXoW+jkiJbUut8WjjyXA46LJWq9clZV7Y0NEpGKSqcUXYZSdFkJeymzGHh4spCOF1lBfiCrgglTetO4HQryvpZOwKSUQ0KJaoVoWKhXxs5rA/CrgGwiqDQIrd6ybSu6libKaWJAvuFMgO8IHZCyZQHVYIHZoCMjLqobRTEtytMbUB4hHKRWc9VVjVInqOS1aoSP7R0HjxWZpaipH1U0iS6JXi160tVdoCHZDmqyOfUj77wnIywS1HhnMjrtXYcL1S9Xj6cWZOxH0ISQsk6i2e3/fDM3Rdil6JkbUaRp7E9f+ogMoygUCBoM2a7Gucb2CssdjUoCARLirgPS6ptJhu/CxEse+VB3C9xxPKs979fYAPyuEEQn14e/IaJGIMLctXj3MHvGRzGTQP8uJfNHuz9Gx1xw1JUED7lsrYO/omKGH+TYaz7e9m5Dn5FAzRbSb8xrt7nsgvEf6FkqtJO91c86zpehHCu/0QiStpGfIzl1QcvYbRtWGn7tCVaj3NZL2KEbWyaTwg3fWaFGGobynXS74uv97lsQCG2IWnVpN8XW8fZNULHNiDLYa43r2PSx701QLhtSO2kX5dA60kaYhssF3DMBAEE2oa5adOaI2CSLjI1aBuSsnFeL8CT1EHcC2SqtnlWaAvQSWGZKkkp+PYRW0G7DyL+7rGNzQzhh3BCr21I1iaGUHgTlqSulgOOuWnr+rlAA81aGH91Ea1q0m9LoogyXGaqYxvKxi3s54oqwwWiYxsyp4/IYlaIG/oZf/ti47Yu5iq+RiS0bWMj+4xwjAqYzeY+kj/myW3mgj0aPpSu65ic8O7+Lbba2X8CeTRao5mH8A05oHB3lzHhrf17kEd/jZyley9TTbj7APLox+iEFEnKgXDnOeTRqHzZ3AEFIA/CV+AnH6OX4dfpJrz1FPxkpJnNTVKaMuRBuA9+MrpZ7N1POyHYLl6i2yFNo+FCCLaL/6G20tzjYsoJdx8Bn4w6d2dz72kAuRDeBT75EzIhVSvlQgg2RGTD3/uQdsKdZ5SEFAsLToR3gE9G2KRZEFKZBRfCX+gIc+knfAt68DEi30YQAsc2dMLsl2knBA+mW8It4ZYwecIiMmD6eylkCfwZOf4flvAzmkupCenWFg8SI0Q4AHaV/vUhhJDXGp9DDMGTN/qxBeU+DQ9C8OqJ114bD0Lwpjev/VIehOBdDF573hwIITtRAvq5BVWr4UEIOV5DBaQ8e+JBCN4Rxjk/pFldcCCEHQJzOgPmQQg5yEe3i9ynlBNCHo3eTLM5CkfkQAg5IcW5T0OzvHiwv0MoVEDISCOgt5p8/q99csJHr+6Q6RdURIjhC8izd/71T+qQajQl03PU9IbeNkFsNfmvhqKod3iyuUKOIfTGEFqryX8n2lIbPNlcIdch9NYXyh3hfP5bcS6jzBPO0T3k+3CwViogLPPzr78RF4QUvYZMyC4DuzDkKKoQ838SV9L5sbl6i5qlsJWFo/uhMbRNQvQQzvjBOXqCXoaQuXuusELMZ38SfeJrGBijEPQGrRA6fOe/8vPxrkR0vwdvQy0E38lwTcIvnu30NvrMBr6msBS0BL9dBzQuOdE5eoacpJDrQkuB0/TGJHyq1Djh2X0Glc8mDCtDSJp6TcIrtcmJD2MmDfV7R0VAN/WZhE/8HAO5CkMWFgutpemaSfiiyClPMUIY6oaOgqa/ZhJ+wjEXQHS3t8sw8qf5l8Egk/DlKRdTvIORpCFD6ULe2TSfBZiEXxUOC8V7GDs7EV4x100MISYRSFT2vv8UI0l3oGvDG616DcwkAoRN1vMputkjJakgfLm3GGOgJuGXMWIL+AjnSzCUJF1sSIWahF860+ntNgafLYQkdbdrwk0ioArLhoq88J0naZTdL/QmF2USwSiyQ3yFtUMO32Xz6360SfBCxOkysJuzIP1FxSRklagY05ojtD7jqFfBJRQrLNrNc9wPatF/dBM7iKI+it0Xn2EChm2yBdXBD6JoDGOebu5gfxIdvvb1a4QfRFE1ejHyPXmLe864i2gVrmoGPqFTjLFl6r1bOD441w5OCAXhkghRb8a0JMZsonNArBAKQpEgTUUnU+OwjU7zbw+xCeEnThAROIYbRpF2xVhuVNSTH9APtV3hVeFcY7Io2tU4oknV4kx0CuTkR9xOgxtCu9mQEtqp2iA2jtOh7v4QY/g9TqbCT7ZDNNNJEUVDb5DE0Y6fvvq9qid/foi+lY88kfpEnKfO+1XGPUzrqF3q/t/pyd+R9y8i9xDBKpMHcc447KMHsjYbV9YM6uTdz2iZirR5ARJpP13KMJp9lM7a6TdVHZQwqvoPJMRd/DazUIPI972vaOhq4zQklMXObGToBrQeTn5AGG72SdrM4vkEi4x1Sr0iji5PO+VycVWZxWK51jntN4Z6BU7nIr57GmUb8FteCCKbTwGUhl7RxWFzPB6NRuNxszlUKxU7dAi/wGjbwBxIA6ItxQDoSjh/KcI2KHJ0rj5VQ41HJz+GFOMuaR9daRRTolIhvvsZVow7T4n76FKxdBtaqSLMNnYRNxBDEcUUIIqQ1QZtEbqqYTUGVgKuNgjWTEB10kAIsg0qJ/QpXs8g1ZptxNBlUoYYWG3sYG0fRiKmwDNsnTQ9q42dGNqoFzEFzi/6Vhtx+IRPJPvgLLRcbcA+36JBTIVpOAOOYxsMAG1fHKYD0RC/f0i4bRGlcjMd/ca2DTaAtkap6DeqyPA+3WUKEI0m01tKvYhdB/ZicBbrV01MthiZnKcH1EgwU+M9hoXqNDFnjO2AMkq1cTIDToyHzJGaAfeo2cpQuWToUrUx52pU9QbvD1dPuTZVY8g1gK6c42hOfCrPCvTKTlUejKo+5vd5TlC9JvM4qnozgQT16HTI1jkqw9NE+eaMIrNcVXUxeT5HvSYTxsTz06vOyIjbOwxjlMD/1yBE5b4YY9NRK2Kf+yf/0bIDGUu2qnrawnej4umItu0YujjCvYrDV+VeQ4y6fgANnlEZXvZSmJ1BFTv9cQWTcn6XYTSrpTp6fnVmo6GKct1CteEMsXnZS24yI1etM2uMh2pFNwwjcAHD/qP9H/WKMRw3+r1NCt26iuVab9a/HI2bQycXdRtXda7WNC77s16tvNFsABVX/9hqq6222mqr1Oj/aPe7oCQftYAAAAAASUVORK5CYII=", name: "Google", url: "https://search.lovelytab.com/#gsc.tab=0&gsc.q=" }]
        var chosenEngine = searchEngines[id];
        //Sets search engine to use
        var save = await saveStorage('searchEngine', chosenEngine);
        searchEngine();
    }

    /* Location */
    async function updateLocation() {
        return new Promise(async (resolve, reject) => {
            var data = await getAsyncJSON(LOCATION_API_URL);
            var save = await saveStorage('location', data);
            resolve(save);
            reject(false);
        });
    }

    /* Weather */
    //Update
    async function updateWeather() {
        return new Promise(async (resolve, reject) => {
            //Init values
            var data = false;
            //Ako je response error ponovo pozvati sa drugim key-em
            //Nakon sto se dobije dobar response save-ovati u storage
            var i = 0;
            while (data.cod == 429 || !data) {
                var weatherURL = await weatherAPIURL(i);
                data = await getAsyncJSON(weatherURL);
                await wait(2000);
                i++;
            }
            var save = await saveStorage('weather', data);
            resolve(save);
        });
    }

    async function weatherAPIURL(element) {
        return new Promise(async (resolve, reject) => {
            var keys = (await getAsyncJSON(WEATHER_KEYS_URL)).appid;
            if (element < keys.length) {
                var location = await loadStorage('location');
                var returnURL = WEATHER_API_URL + location.city + ',' + location.country_name + '&units=metric&APPID=' + keys[element];
                resolve(returnURL);
            }
        });
    }

    //Formatting
    async function getCurrentWeather() {
        var weather = await lovely.loadStorage('weather');
        var location = await lovely.loadStorage('location');
        var weatherData = weather.list;
        var weatherCurrent = false;
        var currentTimestamp = Date.now();
        for (var i = 0; i < weatherData.length; i++) {
            if (weatherData[i].dt, currentTimestamp > weatherData[i].dt) {
                weatherCurrent = weatherData[i];
                break;
            }
        }
        //Prepare for insertion of data
        var weatherTemp = Math.round(weatherCurrent.main.temp);
        //var locationFormatted = location.city + ', ' + location.country_name;
        var units = "C";
        var weatherUnits = await loadStorageSetting('weather');
        if (weatherUnits == "imperial") {
            units = "F";
            weatherTemp = weatherTemp * 9 / 5 + 32;
            weatherTemp = Math.round(weatherTemp);
        }
        var weatherIcon = weatherCurrent.weather[0].id;
        var weatherDescription = weatherCurrent.weather[0].description;
        var weatherPressure = Math.round(weatherCurrent.main.pressure);
        var weatherHumidity = Math.round(weatherCurrent.main.humidity);
        var weatherWind = Math.round(weatherCurrent.wind.speed);
        return {
            city: location.city,
            country: location.country_name,
            icon: weatherIcon,
            temp: weatherTemp,
            description: weatherDescription,
            pressure: weatherPressure,
            humidity: weatherHumidity,
            wind: weatherWind,
            units: units
        }
    }

    async function currentWeather() {
        var data = await getCurrentWeather();
        showWeather(data);
    }

    async function showWeather(data) {
        $('.widget-weather').html('');
        $(".widget-weather").css("visibility", "visible");
        $(".widget-weather").css("visibility", "visible");
        $(".widget-weather-data").append(
            '<p class="white-text weather-temp"></p><p class="white-text weather-location"></p>'
        );
        $(".widget-weather-icon").append(
            '<i class="wi wi-owm-' + data.icon + ' weather-icon"></i>'
        );
        //Insert data
        $(".weather-temp").html(data.temp + "&deg;" + data.units);
        $(".weather-location").html(data.city + ', ' + data.country);
        //insertForecastData(data);
        $('.current-weather-icon').addClass('wi-owm-' + data.icon);
        $('.current-weather-city').html(data.city + ',');
        $('.current-weather-country').html(data.country);
        $('.current-weather-description-text').html(data.description);
        $('.current-weather-temperature').html(data.temp);
        $('.current-weather-pressure').html(data.pressure);
        $('.current-weather-humidity').html(data.humidity);
        $('.current-weather-wind').html(data.wind);

        var weatherUnits = await loadStorageSetting('weather')
        $(".weather-switch-format").removeClass('bold');
        if (weatherUnits == 'metric') {
            $(".format-c").addClass('bold');
        } else {
            $(".format-f").addClass('bold');
        }
    }

    //Forecast
    async function forecast() {
        var data = await lovely.formatForecast();
        var insertHTML = '';
        for (var i = 0; i < data.length; i++) {
            insertHTML += '<li><div class="collapsible-header inline-block">';
            insertHTML += '<i class="wi forecast-header-weather-icon wi-owm-' + data[i].noon.icon + '"></i>';
            insertHTML += '<div class="collapsible-title inline-block">' + data[i].title + '</div>';
            insertHTML += '<i class="material-icons inline-block right">keyboard_arrow_down</i>';
            insertHTML += '</div>';
            insertHTML += '<div class="collapsible-body collapsible-forecast">';
            insertHTML += '<div class="forecast-hour-card"><p class="forecast-hour-header">Morning</p><i class="wi wi-owm-' + data[i].morning.icon + ' forecast-hourCard-icon"></i><p class="forecast-hour-temp">' + data[i].morning.temp + '&deg;' + data[i].morning.units + '</p></div>';
            insertHTML += '<div class="forecast-hour-card"><p class="forecast-hour-header">Noon</p><i class="wi wi-owm-' + data[i].noon.icon + ' forecast-hourCard-icon"></i><p class="forecast-hour-temp">' + data[i].noon.temp + '&deg;' + data[i].noon.units + '</p></div>';
            insertHTML += '<div class="forecast-hour-card"><p class="forecast-hour-header">Evening</p><i class="wi wi-owm-' + data[i].evening.icon + ' forecast-hourCard-icon"></i><p class="forecast-hour-temp">' + data[i].evening.temp + '&deg;' + data[i].evening.units + '</p></div>';
            insertHTML += '</div>';
            insertHTML += '</li>';
        }
        $('.weather-panel').html(insertHTML);
    }

    async function getForecastInfo() {
        var weather = (await loadStorage('weather')).list;
        var arrayOfWeather = [];
        for (var i = 0; i < weather.length - 1; i++) {
            if (compareDates(weather[i].dt_txt, weather[i + 1].dt_txt) && i + 8 < weather.length) {
                var object = {};
                object.morning = weather[i + 4];
                object.noon = weather[i + 5];
                object.evening = weather[i + 8];
                arrayOfWeather.push(object)
            }
        }
        return arrayOfWeather;
    }

    async function formatForecast() {
        var array = await getForecastInfo();
        var weatherUnits = await loadStorageSetting('weather')
        var date = new Date(),
            locale = 'en-us';
        var today = date.toLocaleString(locale, {
            weekday: "long"
        });
        var weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        var position = weekDays.indexOf(today);
        var arrayFinal = [];
        for (var i = 0; i < array.length; i++) {
            var object = {};
            if (i == 0) {
                object.title = 'Tomorrow';
            } else {
                object.title = weekDays[(position + i + 1) % 7];
            }
            object.morning = await formatInfo(array[i], 'morning', weatherUnits);
            object.noon = await formatInfo(array[i], 'noon'), weatherUnits;
            object.evening = await formatInfo(array[i], 'evening', weatherUnits);
            arrayFinal.push(object)
        }

        return arrayFinal;
    }

    async function formatInfo(current, key, format) {
        var object = {}
        object.icon = current[key].weather[0].id;
        object.header = key;
        var weatherTemp = Math.round(current[key].main.temp);
        var units = "C";
        var weatherUnits = format;
        if (weatherUnits == "imperial") {
            units = "F";
            weatherTemp = weatherTemp * 9 / 5 + 32;
            weatherTemp = Math.round(weatherTemp);
        }
        object.temp = weatherTemp;
        object.units = units;
        return object;
    }

    async function switchWeather() {
        var currentFormat = await loadStorageSetting('weather');
        if (currentFormat == 'metric') {
            await saveStorageSetting('weather', 'imperial')
        } else {
            await saveStorageSetting('weather', 'metric')
        }
        currentWeather();
        forecast();
    }

    //Display

    /* News */
    async function updateNews() {
        return new Promise(async (resolve, reject) => {
            var newsURL = (await loadStorage('config')).newsFetchURL + (await loadStorage('config')).category;
            var news = (await getAsyncJSON(newsURL)).news;
            var save = await saveStorage('news', news);
            resolve(save);
        });
    }

    async function showNews() {
        var news = await loadStorage('news');

        $(".widget-news").append(
            '<div class="hideWidget hideWidgetNews tooltipped" data-position="right" data-tooltip="Hide news" name="news"><i class="material-icons">close</i></div>'
        );
        $('.tooltipped').tooltip();

        news.forEach(function (item, index) {
            $(".widget-news").append(createArticle(item));
        });

        initNewsListeners();
    }

    function createArticle(article) {
        //Sets parameters
        var params = '?eid=' + eid + '&uuid=' + loadStorageSetting('uuid');

        var articleHTML = '<div class="col s12 m4 card-article-wrap">';
        articleHTML += '<a target="_blank" href="' + article.url + params + '" class="triggerNewsAnalyticsEvent" data-newsURL="' + article.url + params + '" data-newsTitle="' + article.title + '">';
        articleHTML += '<div class="card card-article" style="background:url(' + article.image + ') !important; background-size: cover !important;">';
        articleHTML += '<div class="card-content card-content-article">';
        articleHTML += '  <h5 class="card-title card-title-article">' + article.title + '</h5>';
        articleHTML += '</div></div></a></div>';
        return articleHTML;
    }

    /* Games */
    async function updateGames() {
        return new Promise(async (resolve, reject) => {
            var gamesURL = (await loadStorage('config')).gamesFetchURL;
            var games = (await getAsyncJSON(gamesURL)).data;
            var save = await saveStorage('games', games);
            resolve(save);
        });
    }

    async function showGames() {
        var games = await loadStorage('games');
        //Makes HTML for game sidenav and adds it
        var gamesPrint = "";
        for (var game of games) {
            gamesPrint +=
                '<div class="card-game" href="#gameModal" data-id="' + game.id + '" data-url="' +
                game.game +
                '" data-gameName="' +
                game.name +
                '"><img class="card-img-top card-img-game" data-toggle="modal" data-target="#gameModal" src="' +
                game.image +
                '"><div class="card-body"><h5 class="card-title card-title-game">' +
                game.name +
                "</h5></div></div>";
        }
        $(".games-list").html(gamesPrint);
        //When user clicks on a game to play, it loads iframe and activates game and ad modal
        //this click event has to be declared here (after adding games to the sidenav),
        //because otherwise it won't register any click
        $(".card-game").click(function () {
            //Sets iframe in modal
            var gameURL = $(this).attr("data-url");
            var gameName = $(this).attr("data-gameName");
            var gameid = $(this).attr("data-id");


            $(".gameEmbed").attr("src", gameURL);
            //Opens game modal
            var gameModal = M.Modal.getInstance($("#gameModal"));
            gameModal.open({
                complete: onCloseGameModal
            });
            //Opens ad modal and runs countdown
            var adModal = M.Modal.getInstance($("#adModal"));
            adModal.open();
            $.ajax({
                method: "GET",
                url: "https://api.lovelytab.com/api/index.php?api=lovelytab_api_v1&module=game&id=" + gameid,
                async: false,
                success: function (e) {
                    var ads = e.data[0].ads;
                    countdownAd(ads, e.data[0].ads_time);
                }

            });

            analyticsSendEvent('playGame', gameName)
        });
    }

    function onCloseGameModal() {
        //Resets the iframe
        $(".modal-content-game").html(
            '<iframe class="gameEmbed" src="https://html5.gamedistribution.com/" width="100%" height="630" scrolling="none" frameborder="0"></iframe>'
        );
    }

    function onCloseAdModal() {
        console.log("Ad Modal Closed");
    }

    function countdownAd(ad, seconds, remainingSeconds) {
        //If countdown finished
        if (remainingSeconds == 0) {
            $(".btn-close-ad-modal").addClass("modal-close");
            $(".btn-close-ad-modal").html("Close");
            $(".ad-modal-help-text").css("visibility", "hidden");
        }
        //If countdown just started
        else if (!remainingSeconds) {
            //Sets the ad and starts countdown
            $(".modal-content-ad").html(ad);
            $(".btn-close-ad-modal").removeClass("modal-close");
            $(".btn-close-ad-modal").html(seconds);
            $(".ad-modal-help-text").css("visibility", "visible");
            setTimeout(function () {
                countdownAd(ad, seconds, seconds - 1);
            }, 1000);
        }
        //If counting
        else if (remainingSeconds > 0) {
            $(".btn-close-ad-modal").html(remainingSeconds);
            setTimeout(function () {
                countdownAd(ad, seconds, remainingSeconds - 1);
            }, 1000);
        }
    }

    /* Quotes */
    async function updateQuotes() {
        return new Promise(async (resolve, reject) => {
            var quotesURL = (await loadStorage('config')).quotesFetchURL + (await loadStorage('config')).category;
            var quotes = (await getAsyncJSON(quotesURL)).quotes;
            var save = await saveStorage('quotes', quotes);
            resolve(save);
        });
    }

    async function showQuotes() {
        var params = '&eid=' + eid + '&uuid=' + loadStorageSetting('uuid');
        var quotes = await loadStorage('quotes');
        var quote = quotes[Math.floor((Math.random() * quotes.length))];
        var button = quote.button;
        if (!button) {
            button = 'Learn More';
        }
        var quoteHTML = "<div id='quoteheader'>" + quote.headline + "</div><div class='hideWidget hideWidgetQuotes'><i class='material-icons'>close</i></div>";
        quoteHTML += "<div id='quotetext'>" + quote.text + "</div>";
        quoteHTML += "<div id='quotebottom'><a class='triggerQuoteAnalyticsEvent' data-quoteURL='" + quote.url + params + "' data-quoteTitle='" + quote.headline + "' href='" + quote.url + params + "' target='_blank'>" + button + "</a></div>";
        $("#quotedid").append(quoteHTML);
        var didy = quote.headline;
        $("#textqt").append(didy);
        $("#textqt").css('background', '#0000004c');
        $("#didyouknow").css("visibility", "visible");
        $("#didyouknow").css("width", "500px");
        hideWidgetQuotesListener();
        initQuotesListener();
    }

    /* Bookmarks */
    async function updateBookmarks() {
        return new Promise(async (resolve, reject) => {
            chrome.bookmarks.getTree(async function (itemTree) {
                var result = itemTree[0].children[0].children;
                var save = await saveStorage('bookmarks', result);
                resolve(save);
            });
        });
    }

    async function showBookmarks() {
        //var result = itemTree[0].children[0].children;
        var bookmarks = await loadStorage('bookmarks');
        var bookmarks_inject = "<ul>";

        if (bookmarks.length > 0) {
            bookmarks.forEach(function (item, index) {
                bookmarks_inject +=
                    '<li class="bookmark"><img class="bookmark-favicon" src="http://www.google.com/s2/favicons?domain=' +
                    item.url +
                    '" /><a class="bookmark-name" href="' +
                    item.url +
                    '">' +
                    item.title +
                    "</a></li>";
            });
        }

        bookmarks_inject += '</ul>';
        $("#bookmarks-list").html(bookmarks_inject);
    }

    /* Apps */
    async function updateApps() {
        return new Promise(async (resolve, reject) => {
            chrome.management.getAll(async function (response) {
                var save = await saveStorage('apps', response);
                resolve(save);
            });
        });
    }

    async function showApps() {
        var apps = await loadStorage('apps');
        var apps_inject = "<ul>";
        if (apps.length > 0) {
            apps.forEach(function (item) {
                if (item.icons !== undefined) {
                    item.icons[0].url = item.icons[0].url.replace("/16/", "/128/");
                    if (item.isApp && item.appLaunchUrl) {
                        apps_inject += createApp(item)
                    }
                }
            });
        }
        apps_inject += createApp({
            appLaunchUrl: 'https://chrome.google.com/webstore/category/extensions',
            icons: [{
                url: "/include/add.png"
            }],
            name: "Get more"
        })
        apps_inject += '</ul>';
        $("#apps-list").html(apps_inject);
        $('.app').click(function (event) {
            event.preventDefault();
            var appURL = $(this).attr('data-url');
            chrome.tabs.create({
                url: appURL
            });
        })
    }

    function createApp(item) {
        var app = '<li class="app" data-url="' +
            item.appLaunchUrl +
            '"><a target="_blank" class="app-favicon-wrapper" href="' +
            item.appLaunchUrl +
            '"><img class="app-favicon" src="' +
            item.icons[0].url +
            '" /></a><a target="_blank" class="app-name" href="' +
            item.appLaunchUrl +
            '">' +
            (item.name.length > 15 ?
                item.name.substr(0, 15) + "..." :
                item.name) +
            "</a></li>";
        return app;
    }

    /* quicklinks */
    function updateQuicklinks() {
        return new Promise(async (resolve, reject) => {
            var uuid = await loadStorageSetting('uuid');
            var location = await loadStorage('location');
            var config = await loadStorage('config');
            var extensionCode = config.extensionAnalyticsID;

            //Sklopiti LovelyTab Quicklinks
            var quicklinksURL = config.quickLinksFetchURL;
            var fullUrl = quicklinksURL + '&eid=' + eid + '&uuid=' + uuid + '&location_city=' + location.city + '&location_country=' + location.country_code;

            //Sklopiti Siteplug Quicklinks
            var siteplugIDBaseURL = 'https://api.lovelytab.com/api/index.php?api=lovelytab_api_v1&module=siteplug&id=';
            var siteplugCustomerKey = 'xkk75';
            //REMOVE
            var spIDUrl = siteplugIDBaseURL + extensionCode;
            var siteplugSiteID = await getAsyncJSON(spIDUrl);
            if (siteplugSiteID.enable) {
                siteplugSiteID = siteplugSiteID.id;
            } else {
                return;
            }
            var fullSiteplugURL = 'https://' + siteplugCustomerKey + '.siteplug.com/qlapi?o=' + siteplugCustomerKey + '&s=' + siteplugSiteID + '&u=searchengine.com&is=96x96&callback=showQuickLinks';

            //Pozvati oba quicklink endpoint-a
            var quicklinks = (await getAsyncJSON(fullUrl)).quicklinks;
            var quicklinksSiteplug = await getSiteplugQuicklinks(fullSiteplugURL);

            console.log(quicklinks);
            console.log(quicklinksSiteplug);

            //Sklopiti u jedan objekat od 20 quicklinkova
            var allQuicklinks = [];
            if (quicklinks && quicklinks !== undefined) {
                quicklinks.forEach(function (item, index) {
                    item.source = "lovelytab";
                    item.rank = index;
                    allQuicklinks.push(item);
                });
            }
            if (quicklinksSiteplug !== undefined) {
                quicklinksSiteplug.forEach(function (item) {
                    var formattedQL = {};

                    formattedQL.source = "siteplug";
                    formattedQL.type = "redirect";
                    formattedQL.url = item.rurl;
                    formattedQL.title = item.brand;
                    formattedQL.icon = item.iurl;
                    formattedQL.rank = item.rank;
                    formattedQL.category = item.category;

                    allQuicklinks.push(formattedQL);
                });
            }
            //Skrati na 20
            var formattedQuickLinks = [];
            allQuicklinks.forEach(function (item, index) {
                if (index < 20) {
                    formattedQuickLinks.push(item);
                }
            });

            //Sacuvati
            var save = await saveStorage('quicklinks', allQuicklinks);

            resolve(save)
        })
    }

    async function getSiteplugQuicklinks(url) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                dataType: 'jsonp',
                async: true,
                success: function (data) {
                    resolve(data.data);
                }
            });
        });
    }

    async function showQuickLinks(page) {
        var quickLinks = await loadStorage('quicklinks');
        if (quickLinks.length > 0) {
            $('.quickLinksRow.first').html('');
            $('.quickLinksRow.second').html('');
            $('.quickLinks-navigation').css('visibility', 'visible');
            $('.quickLinks-navigation').css('display', 'block');
            if (page == 1) {
                quickLinks.forEach(function (item, index) {
                    $('.quickLink-right i').addClass('activeLinks');
                    $('.quickLink-left i').removeClass('activeLinks');
                    var quickLink = createQuickLink(item);
                    if (index < 5) {
                        $('.quickLinksRow.first').append(quickLink);
                    } else if (index < 10) {
                        $('.quickLinksRow.second').append(quickLink);
                    }
                });
            } else if (page == 2) {
                $('.quickLink-left i').addClass('activeLinks');
                $('.quickLink-right i').removeClass('activeLinks');
                quickLinks.forEach(function (item, index) {
                    var quickLink = createQuickLink(item);
                    if (index > 9 && index < 15) {
                        $('.quickLinksRow.first').append(quickLink);
                    } else if (index > 14 && index < 20) {
                        $('.quickLinksRow.second').append(quickLink);
                    }
                });
            }

            initQuicklinksListeners();
        }
    }

    function createQuickLink(quickLink) {
        var typeOption = '';
        if (quickLink.type == 'popup') {
            typeOption += 'data-popup-image="' + quickLink.popup.image + '" data-popup-size="' + quickLink.popup.size + '" data-url="' + quickLink.url + '"';
        }
        var formattedQuickLink = '<a href="' + quickLink.url + '" data-brand="' + quickLink.title + '" data-source="' + quickLink.source + '" data-type="' + quickLink.type + '"  data-category="' + quickLink.category + '" data-rank="' + quickLink.rank + '" ' + typeOption + ' class="quickLink animated fadeIn" target="_blank"><img class="quickLinkImage" src="' + quickLink.icon + '"/><p class="quickLinkTitle">' + quickLink.title + '</p></a>';
        return formattedQuickLink;
    }

    //Autocomplete - Get and show autocomplete links
    async function autocomplete(query) {

        //Checks if enough time has passed to make a query
        var currentTimestamp = new Date();
        if (currentTimestamp - lastInputTimestamp > 490 && query !== '') {
            if (query == lastAutocompleteQuery) {
                return;
            } else {
                lastAutocompleteQuery = query;
            }

            var autocompleteYahoo = [];

            var autocompleteList = '';

            var placeholder = '<li class="searchAutocompleteRecommendation animated fadeIn">Searching...</li>';
            $('.searchAutocomplete').html(placeholder);

            //Get yahoo autocomplete
            var yahooURL = 'https://sugg.search.yahoo.net/sg/?output=json&nresults=10&command=' + query;
            var data = await getAsyncJSON(yahooURL);
            autocompleteYahoo = data.gossip.results;

            //Add regular autocomplete
            if (autocompleteYahoo !== undefined) {
                autocompleteYahoo.forEach(function (item, index) {
                    if (index < 6) {
                        autocompleteList += '<li class="searchAutocompleteRecommendation searchAutocompleteRegular animated fadeIn">' + item.key + '</li>';
                    }
                });
            }

            //Set autocomplete
            if (autocompleteList == '') {
                var placeholder = '<li class="searchAutocompleteRecommendation animated fadeIn">There are no recommendations</li>';
                $('.searchAutocomplete').html(placeholder);
            } else {
                $('.searchAutocomplete').html(autocompleteList);

                //Set Event Listener for clicks on regular autocomplete
                var autoReco = document.getElementsByClassName('searchAutocompleteRegular');
                for (let i = 0; i < autoReco.length; i++) {
                    autoReco[i].addEventListener('mousedown', function () {
                        var autocompleteQuery = $(this).html();
                        fireSearch(autocompleteQuery, 'autocomplete');
                    });
                }
            }

        }
    }


    async function fireSearch(query, type = 'search') {
        //Sets parameters
        var params = '&eid=' + eid + '&uuid=' + loadStorageSetting('uuid');
        //Gets Search Engine
        var searchEngineURL = (await loadStorage('searchEngine')).url;

        //Salje analitiku bilderu
        var ourAnalyticsURLSearch = "https://api.lovelytab.com/api/?api=lovelytab_api_v1&module=search&query=" + query + "&eid=" + eid + "&uuid=" + uuid;
        $.getJSON(ourAnalyticsURLSearch, function (data) {
            //console.log(data);
        });

        //Adds search query to analytics
        /*
        AnalyticsVariables += "&utm_term=" + query;
        //Sets type
        AnalyticsVariables += "&type=search";
        //Sends pageview and event      
        var pagePath = AnalyticsVariables;
     
        ga('send', 'pageview', pagePath);
        ga('send', 'event', 'search', AnalyticsVariables);
     
        //Resets Analytics to default
        resetAnalyticsVariables();
        */
        analyticsSendEvent(type, query)

        //Creates URL for redirect
        var url = searchEngineURL + query + params;
        //Redirects
        window.location.href = url;
    }

    /* Helper functions */
    function uuid() {
        var d = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    function getAsyncJSON(url) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(function (response) {
                    var returnResponse = response.json();
                    resolve(returnResponse);
                })
                .catch(function (error) {
                    reject(false);
                });
        });
    }

    function wait(time) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, time);
        });
    }

    function compareDates(first, second) {
        if ((second.substring(0, 4) > first.substring(0, 4)) || (second.substring(5, 7) > first.substring(5, 7)) || (second.substring(8, 10) > first.substring(8, 10))) {
            return true
        } else {
            return false
        }
    }

    function checkCacheExpired(timestamp, hours) {
        var oldTimestamp = timestamp;
        var newTimestamp = Date.now();
        var cacheLimit = hours * 60 * 60 * 1000;
        return newTimestamp - oldTimestamp > cacheLimit;
    }

    function checkNewDay(timestamp) {
        var oldDay = new Date(timestamp);
        var newDay = new Date();

        oldDay = oldDay.getDay();
        newDay = newDay.getDay();

        var isNewDay = false;
        if (newDay - oldDay !== 0) {
            isNewDay = true;
        }

        return isNewDay;
    }

    function addRemoteLinks() {
        $('.remote-link').each(async function () {
            var links = (await loadStorage('config')).links;
            var key = $(this).attr('data-link');
            var link = links[key];
            $(this).attr('href', link)
        });
    }

    //Time and date
    async function timeAndDate() {
        var date = new Date(),
            locale = 'en-us';
        var hours = date.getHours();
        var minutes = date.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        var localizedDate = date.toLocaleString(locale, {
            weekday: "long",
            day: "2-digit",
            month: "long"
        });
        //init ampm var
        var ampm = '';
        var timeFormat = await loadStorageSetting('time');
        if (timeFormat === "ampm") {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
        }

        return {
            ampm: ampm,
            hours: hours,
            minutes: minutes,
            date: localizedDate
        }
    }

    async function showTime() {
        var time_date = await lovely.timeAndDate();
        $(".widget-time").html('');
        $('.current-weather-description-dateTime').html('');
        $(".widget-time").css("visibility", "visible");
        $(".widget-time").append(
            '<p class="white-text time">' +
            time_date.hours +
            ':' +
            time_date.minutes +
            ' ' +
            time_date.ampm +
            '</p>'
        );
        $(".widget-time").append(
            '<p class="white-text date">' + time_date.date + "</p>"
        );
        //Handle forecast datetime format
        var forecastDateTime = time_date.date + ' ' + time_date.hours + ":" + time_date.minutes + ' ' + time_date.ampm;
        $('.current-weather-description-dateTime').html(forecastDateTime);
    }

    async function switchTime() {
        var currentFormat = await loadStorageSetting('time');
        if (currentFormat == 'standard') {
            await saveStorageSetting('time', 'ampm')
        } else {
            await saveStorageSetting('time', 'standard')
        }
        showTime();
    }

    async function showWidgets() {
        var settings = await loadStorage('settings');
        if (settings.push) {
            $('.switch-check-notifications').attr("checked", "true");
        }
        if (!settings.quotes) {
            //$('#didyouknow').css('height', '10')
            $('#didyouknow').addClass('fixQuotes');
            $('.quickLinks').addClass('fixQL');
        }
        var datablockElements = $('[data-block]');
        for (var i = 0; i < datablockElements.length; i++) {
            var datablock = $(datablockElements[i]).attr('data-block');
            if (datablock === 'true') {
                $(datablockElements[i]).addClass('show');
            } else {
                if (settings[datablock]) {
                    $(datablockElements[i]).addClass('show');
                    $('.switch-check-' + datablock).attr("checked", "true");
                }
            }
        }
    }

    //Tutorial
    function tutorial() {
        $('.tap-target').tapTarget('open');
        $('.settings-icon').css('color', 'rgb(38, 148, 237)');
        revertSettingsIcon();
    }

    function ifTutorial() {
        return $('.tap-target-wrapper').hasClass('open');
    }

    function revertSettingsIcon() {
        setTimeout(function () {
            if (ifTutorial()) {
                revertSettingsIcon();
            } else {
                $('.settings-icon').css('color', 'white');
            }
        }, 100);
    }

    //Push
    async function notificationsPush() {
        waiting = false;
        var settings = await lovely.loadStorage('settings');
        var config = await lovely.loadStorage('config');

        //Pali regularni push ili inactive
        if (!checkCacheExpired(settings.lastActive, pushInactive)) {
            if (settings.push) {
                if (checkCacheExpired(settings.pushLast, config.pushInterval)) {
                    getShowNotificationsPush(config.pushFetchURL, config.pushFormat);
                }
            }
        } else {
            if (checkCacheExpired(settings.pushLast, config.pushInterval)) {
                var arrayoftimestamps = await returnRemoteData('timestamp');
                if (checktimestamps(arrayoftimestamps)) {
                    waiting = true;
                    getShowNotificationsPush(config.pushFetchURL, config.pushFormat);
                }
            }
        }

    }

    async function getShowNotificationsPush(fetchURL, format) {
        //Add user and extension parameters to request
        var data = await lovely.getAsyncJSON(fetchURL);
        var formattedNotification = await formatPushData(data, format);

        /*notifyPush(notificationTitle, notificationMessage, notificationURL, notificationImage, notificationIcon);*/
        notifyPush(formattedNotification.title, formattedNotification.message, formattedNotification.url, formattedNotification.image, formattedNotification.icon)
    }

    async function notifyPush(notifyTitle, notifyMessage, notifyURL, notifyImage, notifyIcon) {
        if (!notifyMessage && !notifyURL) {
            return false;
        }

        //Check message
        if (!notifyMessage) {
            notifyMessage = '';
        }

        //Check images
        var type = 'image';
        if (!notifyIcon) {
            notifyIcon = "icon16.png";
        }
        if (!notifyImage) {
            type = 'basic';
        }

        //Pripremiti notifyIcon i notifyImage
        var proxyNotifyIcon = pushImageEndpoint + encodeURIComponent(notifyIcon);
        var proxyNotifyImage = pushImageEndpoint + encodeURIComponent(notifyImage);

        var options = {};

        if (type == 'image') {

            //Enkodiraj sliku na serveru
            var notImage = await getProxyImage(proxyNotifyImage);
            //Ako je data ikona enkodiraj na serveru
            if (!notifyIcon) {
                var notIcon = await getProxyImage(proxyNotifyIcon);
            } else {
                var notIcon = "icon16.png";
            }

            if (notIcon == 'false') {
                notIcon = 'icon16.png';
            }

            if (notImage == 'false') {
                console.log('imageNotProvided');
                return;
            }

            options = {
                type: "image",
                title: notifyTitle,
                message: notifyMessage,
                iconUrl: notIcon, //window.URL.createObjectURL(this.response)
                imageUrl: notImage //window.URL.createObjectURL(this.response)
            };

            //Get all notification
            var allNotifications = await lovely.loadStorage('pushNotifications');
            //Save to localstorage  
            var notificationID = String(Date.now());
            var pushToAllNotifications = {
                id: notificationID,
                url: notifyURL
            };
            allNotifications.push(pushToAllNotifications);
            await lovely.saveStorage('pushNotifications', allNotifications)
            //localStorage.setItem("pushNotifications", JSON.stringify(allNotifications));

            chrome.notifications.create(notificationID, options, async function (notificationId) {
                waiting = false;
                if (chrome.runtime.lastError && chrome.runtime.lastError.message === 'Unable to download all specified images.') {
                    console.log(chrome.runtime.lastError)
                } else {
                    var pushShowTime = Date.now();
                    var save = await lovely.saveStorageSetting('pushLast', pushShowTime);
                    fireProxyImagePixel(notifyImage);
                    fireProxyImagePixel(notifyIcon);
                }
            });

        } else {

            var notIcon = await getProxyImage(proxyNotifyIcon);

            if (notIcon == "false") {
                notIcon = 'icon16.png';
            }

            options = {
                type: "basic",
                title: notifyTitle,
                message: notifyMessage,
                iconUrl: notIcon //window.URL.createObjectURL(this.response)
            };

            //Get all notification
            var allNotifications = await lovely.loadStorage('pushNotifications');
            //Save to localstorage
            var notificationID = String(Date.now());
            var pushToAllNotifications = {
                id: notificationID,
                url: notifyURL
            };
            allNotifications.push(pushToAllNotifications);
            await lovely.saveStorage('pushNotifications', allNotifications)

            chrome.notifications.create(notificationID, options, async function (notificationId) {
                waiting = false;
                console.log('opalio notifikaciju')
                var pushShowTime = Date.now();
                var save = await lovely.saveStorageSetting('pushLast', pushShowTime);
            });
        }

    }

    function getProxyImage(url) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            //xhr.responseType = 'blob';
            xhr.onload = function (e) {
                console.log('rizolvuje');
                resolve(xhr.responseText);
            };

            xhr.send();
        });
    }

    function formatPushData(data, format) {
        return new Promise((resolve, reject) => {
            var pushNotificationObject;
            if (format === 'lovelytabs') {
                pushNotificationObject = {
                    title: data.notifications[0].title,
                    message: data.notifications[0].message,
                    url: data.notifications[0].URL,
                    image: data.notifications[0].image,
                    icon: false
                }
                resolve(pushNotificationObject)
            } else {
                //Stringify json - objekat koji smo dobili
                data.formatType = format;
                var preparedJSON = JSON.stringify(data);
                //POST saljemo na rutu (sa tipom) - predefinisanu
                $.ajax({
                    method: "POST",
                    url: pushFormatEndpoint,
                    data: {
                        raw: preparedJSON
                    },
                    success: function (e) {
                        var parsedResponse = JSON.parse(e);
                        pushNotificationObject = {
                            title: parsedResponse.notifications[0].title,
                            message: parsedResponse.notifications[0].message,
                            url: parsedResponse.notifications[0].URL,
                            image: parsedResponse.notifications[0].image,
                            icon: false
                        }
                        resolve(pushNotificationObject)
                    }
                });
            }
        });
    }

    function fireProxyImagePixel(url) {
        console.log('fire pixel');
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            //xhr.responseType = 'blob';
            xhr.onload = function (e) {
                console.log('pixel fired');
                resolve(url);
            };

            xhr.send();
        });
    }

    chrome.runtime.onConnectExternal.addListener(function (port) {
        port.onMessage.addListener(async function (msg) {
            console.log(msg);
            if (msg.type === 'timestamp') {
                if (!waiting) {
                    var settings = await lovely.loadStorage('settings');
                    port.postMessage({
                        newtab: settings.lastActive,
                        pushshowtime: settings.pushLast
                    })
                }
            } else if (msg.type === 'backgrounds') {
                var allbackgrounds = await lovely.loadStorage('backgrounds');
                port.postMessage({
                    backgrounds: allbackgrounds
                })
            }
        })

    });

    function returnRemoteData(type) {
        return new Promise((resolve, reject) => {
            var array = [];
            chrome.management.getAll(async function (result) {
                var extensions = result.filter(app => {
                    return app.type === 'extension';
                })
                for (var i = 0; i < extensions.length; i++) {
                    var response = await receiveresponse(extensions[i].id, type);
                    if (response) {
                        if (type === 'timestamp') {
                            array.push([response.newtab, response.pushshowtime])
                        } else if (type === 'backgrounds') {
                            var arrayConcat = array.concat(response.backgrounds);
                            array = arrayConcat;
                        }
                    }
                }
                resolve(array)
            })
        })
    }

    function receiveresponse(id, type) {
        return new Promise((resolve, reject) => {
            var port = chrome.runtime.connect(id);
            port.onDisconnect.addListener(function (event) {
                if (chrome.runtime.lastError && chrome.runtime.lastError.message == 'Could not establish connection. Receiving end does not exist.') {
                    resolve(false)
                }
            });
            port.postMessage({
                type: type
            });
            port.onMessage.addListener(function (msg) {
                resolve(msg)
            })
        })
    }

    async function checktimestamps(array) {
        var ind = 0;
        var pushFeedInterval = (await lovely.loadStorage('config')).pushInterval;
        for (var i = 0; i < array.length; i++) {
            if (lovely.checkCacheExpired(array[i][0], pushInactive) && lovely.checkCacheExpired(array[i][1], pushFeedInterval)) {
                ind = 1;
            }
        }
        return ind;
    }

    async function checkNewBackgrounds(receivedBackgrounds) {
        var exists = false;
        var allBackgrounds = await loadStorage('backgrounds')
        receivedBackgrounds.forEach(function (item, index) {
            allBackgrounds.forEach(function (img) {
                if (item.imageUrl == img.imageUrl) {
                    exists = true;
                }
            });
            if (!exists) {
                allBackgrounds.push(item)
            }
        })
        var save = await saveStorage('backgrounds', allBackgrounds)
    }

    async function shareBackgrounds() {
        var newExtensions;
        var oldExtensions = await loadStorage('extensions');
        chrome.management.getAll(async function (result) {
            newExtensions = result.filter(app => {
                return app.type === 'extension';
            })
            if (newExtensions.length !== oldExtensions) {
                var newBackgrounds = await returnRemoteData('backgrounds');
                checkNewBackgrounds(newBackgrounds);
            }
        })
    }

    async function analyticsSendEvent(type, action, label) {
        //Get Storage settings
        var storage = await loadStorage('settings');
        var config = await loadStorage('config');

        //Get UUID from storage
        var storageUUID = storage.uuid;
        //Get InstallDate from storage
        var installDate = storage.installed;

        var trackingID = config.googleAnalyticsID;
        var uuid = storageUUID;
        var campaignName = config.extensionName;
        var campaignSource = config.extensionName;
        var campaignMedium = installDate;
        var eventType = type;
        var eventAction = action;
        var eventLabel = label;
        if (!eventAction) {
            eventAction = config.extensionName;
        }
        if (!eventLabel) {
            eventLabel = installDate;
        }

        var urlBase = "https://www.google-analytics.com/collect";
        var urlParams =
            "?v=1&t=event&tid=" +
            trackingID +
            "&cid=" +
            uuid +
            "&cn=" +
            campaignName +
            "&cs=" +
            campaignSource +
            "&cm=" +
            campaignMedium +
            "&ec=" +
            eventType +
            "&ea=" +
            eventAction +
            "&el=" +
            eventLabel;
        var analyticsURL = urlBase + urlParams;

        $.ajax({
            method: "POST",
            url: urlBase,
            data: {
                v: "1",
                t: "event",
                tid: trackingID,
                cid: uuid,
                cn: campaignName,
                cs: campaignSource,
                cm: campaignMedium,
                ec: eventType,
                ea: eventAction,
                el: eventLabel
            },
            success: function (e) {
                //console.log("FIRED");
                //console.log(e);
            }
        });
    }

    //Sends Analytics Event to report user as active - if 24 hours since last event has passed  
    async function reportActiveUser() {
        var lastActive = await loadStorageSetting('lastActive');
        if (checkNewDay(lastActive)) {
            analyticsSendEvent('activeUser')
        }
    }

    //rate widget
    async function setRateWidget() {
        var rate = await loadStorage('rate')

        var rating = rate.rating;
        var ratingTimestamp = rate.timestamp;
        var dismissed = rate.dismissed;

        if (!rating) {
            $('.slide-out-rate-trigger').css('display', 'inline-block');
        } else {
            if (rating < 5 && !dismissed) {
                //One week - value in hours
                var expiredInterval = 24 * 7;

                if (checkCacheExpired(ratingTimestamp, expiredInterval)) {
                    M.toast({
                        html: "<i class='material-icons'>star</i> &nbsp; Changed your mind?<button data-target='slide-out-rate' class='btn-flat toast-action close-toast toast-rate-button sidenav-trigger'>Rate us!</button><button class='btn-flat toast-action close-toast'>X</button>",
                        displayLength: 20000000,
                        classes: "green"
                    });

                    $('.close-toast').click(function () {
                        M.Toast.getInstance($(this).parent()).dismiss();
                    });

                    //Set to never show again
                    var rate = {
                        rating: rating,
                        timestamp: ratingTimestamp,
                        dismissed: true
                    };
                    await saveStorage('rate', rate)
                }
            }

        }
    }

    async function setRate(rating) {
        //Gets Rate Info
        analyticsSendEvent('rate', rating)

        //Salje analitiku bilderu
        var ourAnalyticsURLRate = "https://api.lovelytab.com/api/?api=lovelytab_api_v1&module=rate&rating=" + rateForAnalytics + "&eid=" + extensionChromeAssignedID + "&uuid=" + uuid;
        $.getJSON(ourAnalyticsURLRate, function (data) {
            //console.log(data);
        });

        //Resets Analytics to default
        resetAnalyticsVariables();
        var rate = await loadStorage('rate');
        await saveStorage('rate', {
            rating: rating,
            timestamp: Date.now(),
            dismissed: rate.dismissed
        });

    }


    //Export
    return {

        onExtensionInstalled,

        getAsyncJSON,
        updateFull,
        updateBackgrounds,
        saveStorage,
        loadStorage,
        saveStorageSetting,
        loadStorageSetting,
        updateLocation,
        updateNews,
        updateGames,
        updateQuotes,
        updateBookmarks,
        updateApps,
        updateQuicklinks,
        prepareNextBackground,
        setBackground,
        favoriteBackgrounds,
        searchEngine,
        searchEngineOptions,
        autocomplete,
        fireSearch,

        updateWeather,
        currentWeather,
        formatForecast,
        forecast,
        switchWeather,

        timeAndDate,
        switchTime,
        showTime,
        showApps,
        showWidgets,
        showBookmarks,
        showGames,
        showNews,
        showQuotes,
        showQuickLinks,
        checkCacheExpired,
        tutorial,
        notificationsPush,
        returnRemoteData,
        analyticsSendEvent,
        reportActiveUser,
        setRateWidget,
        setRate,

        shareBackgrounds
    }

})();