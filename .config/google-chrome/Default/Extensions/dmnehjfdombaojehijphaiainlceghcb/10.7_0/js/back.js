//Get Extension ID assigned by Chrome
var extensionRawID = chrome.extension.getURL('/');
eid = extensionRawID.replace("chrome-extension://", "");
eid = eid.replace("/", "");



// OnInstall Listener
chrome.runtime.onInstalled.addListener(onRuntimeInstalled);

async function onRuntimeInstalled(details) {
    if (details.reason === "install") {
        lovely.onExtensionInstalled(details);
    }
    if (details.reason === "update") {
        //Check if new version
        var thisVersion = chrome.runtime.getManifest().version;
        if(details.previousVersion != thisVersion ) {
            lovely.onExtensionInstalled(details);
        }
    }

}

//Opens URL in new tab when clicked on notification
chrome.notifications.onClicked.addListener(async function (notificationId, byUser) {

    var allNotifications = await lovely.loadStorage("pushNotifications");
    console.log(allNotifications);

    allNotifications.forEach(function (notification) {
        if (notification.id == notificationId) {
            chrome.tabs.create({
                url: notification.url
            });
        }
    });

});

//Updaters
(async function fastUpdate() {
    await lovely.updateApps();
    await lovely.updateBookmarks();
    console.log('Updated Apps and Bookmarks');
    //share backgrounds
    //lovely.shareBackgrounds();
    //Recursive 1 min
    setTimeout(fastUpdate, 3 * 60 * 1000);
})();

//Start notifications update separately
function notificationsUpdate() {
    lovely.notificationsPush();
    setTimeout(notificationsUpdate, 30 * 60 * 1000);
};
//Start randomly to prevent collision with other extensions
setTimeout(() => {
    notificationsUpdate();
}, (Math.random() * 100) * 60 * 1000);

async function slowUpdate() {
    console.log('Full update start');
    await lovely.updateFull();
    console.log('Full update done');
    //Recursive 2 hours
    setTimeout(slowUpdate, 120 * 60 * 1000);
}
//Start slow update after some time to allow
//initialization of storage on install
setTimeout(() => {
    slowUpdate();
}, 5 * 60 * 1000);
