//Get Extension ID assigned by Chrome
var extensionRawID = chrome.extension.getURL('/');
eid = extensionRawID.replace("chrome-extension://", "");
eid = eid.replace("/", "");

//Background
lovely.setBackground();

lovely.analyticsSendEvent('openNewTab');

$(document).ready(async function () {

    $('.tap-target').tapTarget();

    $('input#search').css('display', 'inline-block');

    $(".sidenav").sidenav();
    $('.collapsible').collapsible();
    $('.modal').modal();
    $(".dropdown-trigger").dropdown();

    lovely.searchEngineOptions();

    //Tutorial
    var settings = await lovely.loadStorage('settings');
    if (settings.pushLast == settings.lastActive) {
        setTimeout(function () {
            lovely.tutorial();
        }, 2000)
    }

    //Set last active
    var save = await lovely.saveStorageSetting('lastActive', Date.now());
});

//Listeners
$('.favourites-trigger').click(function () {
    $('.settings-panel').collapsible('open', 1);
    setTimeout(function () {
        $('#slide-out-settings').sidenav('open');
    }, 200);
});

$(".switch-check").click(async function (event) {
    var key = $(this).attr("name");
    var value = $(this).prop("checked");

    //Handle quotes graphic
    if (key === 'quotes') {
        $('#didyouknow').toggleClass('fixQuotes');
        $('.quickLinks').toggleClass('fixQL');
    }

    if (key === 'notifications') {
        var save = await lovely.saveStorageSetting('push', value);
    } else {
        if (value) {
            $('[data-block = "' + key + '"]').removeClass('block');
            $('[data-block = "' + key + '"]').addClass('show');
            if (key === 'time') {
                var save = await lovely.saveStorageSetting(key, 'standard');
            } else if (key === 'weather') {
                var save = await lovely.saveStorageSetting(key, 'metric');
            } else {
                var save = await lovely.saveStorageSetting(key, true);
            }
        } else {
            $('[data-block = "' + key + '"]').removeClass('show');
            $('[data-block = "' + key + '"]').addClass('block');
            var save = await lovely.saveStorageSetting(key, false);
        }
    }
    M.toast({
        html: '<i class="material-icons">done</i> Widget settings updated!',
        displayLength: 1000,
        classes: 'green'
    })
});

$('.news-trigger').click(function () {
    $('.switch-check-news').click();
});

$(".widget-time").click(function () {
    lovely.switchTime();
});

$(".weather-switch-format").click(function () {
    lovely.switchWeather();
});

$('#dropqt').dropdown({
    inDuration: 0,
    outDuration: 225,
    constrain_width: true,
    hover: true,
    gutter: 0,
    closeOnClick: false,
    belowOrigin: false
});

$('#dropqt').mouseover(function () {
    $('#dropqt').css('opacity', '0');
})

$('#quotedid').mouseleave(function () {
    $('#dropqt').css('opacity', '1');
});

$('.quickLink-left').click(function () {
    lovely.showQuickLinks(2);
});

$('.quickLink-right').click(function () {
    lovely.showQuickLinks(1);
});

$('.rate > label').mouseover(function () {
    var id = $(this).attr("id");
    if (id == 'overrate5') {
        $("#ratekomentar").html("<b style='color:red;'>Loving it!</b>");
    } else if (id == 'overrate4') {
        $("#ratekomentar").html("Good but not 5 ");
    } else if (id == 'overrate3') {
        $("#ratekomentar").html("Only 3?");
    } else if (id == 'overrate2') {
        $("#ratekomentar").html("Isn't so good :(");
    } else if (id == 'overrate1') {
        $("#ratekomentar").html("I Hate it! :(");
    }
    //this is when mouse is out from radio
});

$('.rateInput').click(function () {
    var rating = $(this).attr("data-rate");
    lovely.setRate(rating);
    if (rating == "5") {
        var urlll = chrome.extension.getURL('/');
        var res = urlll.replace("chrome-extension://", "");
        var nw = "https://chrome.google.com/webstore/detail/x/" + res + "reviews";
        window.location = nw;
    }
});

function hideWidgetQuotesListener() {
    $(".hideWidgetQuotes").click(function () {
        $(".switch-check-quotes").click();
    });
}

async function initNewsListeners() {
    /* Triggers Analytics Event for news */
    $('.triggerNewsAnalyticsEvent').click(async function () {
        //Gets article Info
        var newsTitle = $(this).attr('data-newsTitle');
        var newsURL = $(this).attr('data-newsURL');

        //Salje analitiku bilderu
        var ourAnalyticsURLNews = "https://api.lovelytab.com/api/?api=lovelytab_api_v1&module=news&newsURL=" + newsURL + "&newsTitle=" + newsTitle + "&eid=" + eid + "&uuid=" + await lovely.loadStorageSetting('uuid');
        $.getJSON(ourAnalyticsURLNews, function (data) { });

        lovely.analyticsSendEvent('news', newsTitle)
    });

    $(".hideWidgetNews").click(function () {
        $(".switch-check-news").click();
    });
}

function initQuotesListener() {
    $('.triggerQuoteAnalyticsEvent').click(function () {
        var title = $(this).attr('data-quoteTitle');

        lovely.analyticsSendEvent('quotes', title);
    });
}

function initQuicklinksListeners() {
    $('.quickLink').click(function (event) {
        var quickLinkURL = $(this).attr('href');
        var quickLinkBrand = $(this).attr('data-brand');
        var quickLinkCategory = $(this).attr('data-category');
        var quickLinkRank = $(this).attr('data-rank');
        var quickLinkSource = $(this).attr('data-source');
        var quickLinkType = $(this).attr('data-type');

        if (quickLinkType == 'iframe') {
            event.preventDefault();
            //Sets iframe in modal
            $(".iframeEmbed").attr("src", quickLinkURL);
            //Opens game modal
            var qlIframeModal = M.Modal.getInstance($("#iframeModal"));
            qlIframeModal.open();
        } else if (quickLinkType == 'popup') {
            event.preventDefault();

            var quickLinkPopupImage = $(this).attr('data-popup-image');
            var quickLinkPopupSize = $(this).attr('data-popup-size');
            var quickLinkPopupSelector = ".popupModal." + quickLinkPopupSize;
            //Sets iframe in modal
            $(".modal-content-popup-ad").attr("src", quickLinkPopupImage);
            $(".modal-content-popup-ad").addClass(quickLinkPopupSize);
            $(".modal-content-popup-ad").attr("data-url", quickLinkURL);
            //Opens game modal
            var qlPopupModal = M.Modal.getInstance($(quickLinkPopupSelector));
            qlPopupModal.open();
        }

        //Analitika
        var AnalyticsVariables = "&quickLinkURL=" + quickLinkURL + "&quickLinkBrand=" + quickLinkBrand + "&quickLinkCategory=" + quickLinkCategory + "&quickLinkRank=" + quickLinkRank + "&quickLinkType=" + quickLinkType + "&quickLinkSource=" + quickLinkSource;
        //Dodaje tip
        AnalyticsVariables += "&type=quickLink";

        lovely.analyticsSendEvent('quickLink', AnalyticsVariables);

        //Salje analitiku bilderu
        var ourAnalyticsURL = "https://api.lovelytab.com/api/?api=lovelytab_api_v1&module=quicklinks&quickLinkURL=" + quickLinkURL + "&quickLinkBrand=" + quickLinkBrand + "&quickLinkCategory=" + quickLinkCategory + "&quickLinkRank=" + quickLinkRank + "&quickLinkType=" + quickLinkType + "&quickLinkSource=" + quickLinkSource + "&eid=" + extensionChromeAssignedID + "&uuid=" + uuid;
        $.getJSON(ourAnalyticsURL, function (data) {
            //console.log(data);
        });

    });
    $('.modal-content-popup-ad').click(function () {
        var goToURL = $(this).attr('data-url');
        console.log(goToURL);
        window.open(goToURL);
    });
}

function initFavoriteBackgroundsisteners(favoriteBackgrounds, allBackgrounds) {
    $(".manageSelection").click(async function () {
        var index = $(this).attr("data-index");
        var state = $(this).attr("data-inSelection");
        delete allBackgrounds[index].show;
        $('.manageSelectionTrigger[data-index=' + index + ']').removeClass('backgroundNotShow');
        $('.manageSelectionRemove[data-index=' + index + ']').removeClass('buttonNotShow');
        if (state == "false") {
            $(this).attr("data-inSelection", "true");
            $(this).html("favorite");
            favoriteBackgrounds.push(allBackgrounds[index]);
            M.toast({
                html: '<i class="material-icons">favorite</i> Background added to favourites!',
                displayLength: 1000,
                classes: "green"
              });
        } else if (state == "true") {
            $(this).attr("data-inSelection", "false");
            $(this).html("favorite_border");
            var imageToFind = allBackgrounds[index].imageUrl;
            favoriteBackgrounds = favoriteBackgrounds.filter(
                e => e.imageUrl !== imageToFind
            );
            M.toast({
                html: '<i class="material-icons">favorite_border</i> Background removed from favourites!',
                displayLength: 1000,
                classes: "green"
              });
        }
        await lovely.saveStorage('favoriteBackgrounds', favoriteBackgrounds);
        await lovely.saveStorage('backgrounds', allBackgrounds);
        lovely.prepareNextBackground();
        
    });

    $(".manageSelectionTrigger").click(function () {
        var index = $(this).attr('data-index');
        var trigger = '.manageSelection' + index;
        $(trigger).click();
    });
}

function initRemoveBackgroundsisteners(allBackgrounds) {
    $(".manageSelectionRemove").click(async function () {
        var index = $(this).attr("data-index");
        var bgsToShow = allBackgrounds.filter(background => {
            return (!background.show);
        })

        var currentState = bgsToShow.length;
        if ($('.manageSelectionTrigger[data-index=' + index + ']').hasClass('backgroundNotShow')) {
            currentState++;
        }
        else {
            currentState--;
        }
        if (currentState > 2) {
            if ($('.manageSelection' + index).attr('data-inselection') === 'true') {
                var favorites = await lovely.loadStorage('favoriteBackgrounds');
                var newFav = favorites.filter(m => {
                    return m.imageUrl !== allBackgrounds[index].imageUrl;
                });
                await lovely.saveStorage('favoriteBackgrounds', newFav)
            }
            if ($('.manageSelectionTrigger[data-index=' + index + ']').hasClass('backgroundNotShow')) {
                delete allBackgrounds[index].show;
                $('.manageSelectionTrigger[data-index=' + index + ']').removeClass('backgroundNotShow');
                $('.manageSelectionRemove[data-index=' + index + ']').removeClass('buttonNotShow');
            }
            else {
                allBackgrounds[index].show = 'notShow';
                $('.manageSelectionTrigger[data-index=' + index + ']').addClass('backgroundNotShow');
                $('.manageSelectionRemove[data-index=' + index + ']').addClass('buttonNotShow');
            }
            await lovely.saveStorage('backgrounds', allBackgrounds);
        }
        lovely.prepareNextBackground();
    });
}

//Reset background picks (favourites)
$('.reset-picks').click(async function () {
    $('.manageSelection').html('favorite_border');
    $('.manageSelection').attr('data-inSelection', 'false');
    await lovely.saveStorage('favoriteBackgrounds', []);
    lovely.prepareNextBackground();
    M.toast({
        html: '<i class="material-icons">favorite_border</i> Successfully removed favourites!',
        displayLength: 1000,
        classes: 'green'
    })
});

/* Fires search */
$("#search").keyup(function (event) {
    $('#search').click();
    var query = $(this).val();

    if (query == '') {
        var placeholder = '<li class="searchAutocompleteRecommendation animated fadeIn">Type and you will get recommendations here</li>';
        $('.searchAutocomplete').html(placeholder);
    }

    lastInputTimestamp = new Date();
    setTimeout(function () {
        lovely.autocomplete(query);
    }, 500);

    //On Enter pressed fires search
    if (event.which == 13) {
        lovely.fireSearch(query);
    }
});

/* Activates overlay on click on search */
$("#search").click(function () {
    $('#search').attr('placeholder', '');
    $('#search').css('z-index', '301');
    $('#search').css('zoom', '1');
    $('.slikica').css('display', 'block');
    $('.b_searchboxSubmit').css('z-index', '301');
    $('#focus_ovr').css('opacity', '0.55');
    $('#focus_ovr').css('height', '100%');

    $('#search').css('background-repeat', 'no-repeat');
    $('#search').css('background-position', '98%');

    var autocompleteWidth = $('#search').width() + 71.75;
    $('.searchAutocomplete').css('width', autocompleteWidth);
    $('#search').addClass('hasResults');
    $('.searchEngineSelect').addClass('hasResultsSearchSelect');
    $('.searchAutocomplete').css('visibility', 'visible');
});

/* Disables overlay after focusing out of search */
$("#search").focusout(function () {
    $('#search').removeClass('hasResults');
    $('.searchEngineSelect').removeClass('hasResultsSearchSelect');
    $('.searchAutocomplete').css('visibility', 'hidden');
    $('#search').attr('placeholder', 'Search here...');
    $('#search').css('z-index', '9');
    $('#focus_ovr').css('opacity', '0');
    $('#focus_ovr').css('height', '0%');
    $('.slikica').css('display', 'none');
    $('#search').css('background-image', 'none');
});

$('.searchEngineSelect').click(function () {
    $('.searchEngineDropdown').dropdown('open');
})

$('.close-toast').click(function () {
    M.Toast.getInstance($(this).parent()).dismiss();
});