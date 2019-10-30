window.isMacgap = typeof macgap != 'undefined';
window.nodewebkit = (typeof window.parent.require != 'undefined') ? true : false;
window.microsoft = (navigator.appName.indexOf('MSAppHost') != -1) ? true : false;
window.isChromePackaged = typeof chrome != 'undefined' && typeof chrome.storage != 'undefined';
window.isChrome =  typeof chrome != 'undefined' && typeof chrome.storage == 'undefined' && typeof chrome.extension != "undefined";
window.isPhoneGap = window.location.href.indexOf('android_asset/www') != -1 ? true : false;

var connection, database, amountNew, messages = -1, runMailCheck = true, checkMailInterval;
var DESKTOP = (typeof chrome == 'undefined') ? true : false;

setTimeout(boot, 1000);

function boot() {

	//just to maek sure we don't have 1 x 10^6 things going on
	clearInterval(checkMailInterval);

	//remove the event listener
	chrome.tabs.onUpdated.removeListener(redirectPage);

	database = new storageWrapper();

	// connect to reddit
	connection = new reddit(database, function(connection) {	

		// login to active user
		connection.loginActiveUser(function() {

			// delete old caches
			connection.purgeLocalStorageCache();

			//checks for tabs and redirects if reddit post
			chrome.tabs.onUpdated.addListener(redirectPage);
			
			// check reddit for updates
			setTimeout(function() {
					connection.setting('live_notification_updates', function(setting) {
						if(setting) checkMail(); checkMailInterval = setInterval(checkMail, 60000);
					});
			}, 3000);
		});		
	});
}

function redirectPage(tabId, changeInfo, tab) {
	
	connection.setting('redirectReddit', function(redirectReddit) {

		if (redirectReddit) {	
			var url = tab.url;
			var context = '';

			if (url.search(/reddit\.com\/r\/(.*?)\/comments/) != -1 && url.indexOf("#oo") == -1) {

				var urlArray = url.replace('http://www.reddit.com/', '').split('/')

				//now assuming there is context
				if (urlArray.length >= 6)
					context = urlArray[5].split('?')[0] + '.json';
			
				
				//build url and update the tab
				var update = { url: "chrome-extension://" + chrome.i18n.getMessage('@@extension_id') + "/index.html#/Home/post/" + urlArray[3] + "/permalink/~r~" + urlArray[1] + "~comments~" + urlArray[3] 
								+ "~" + urlArray[4] + "~" + context + "/column/-r-" + urlArray[1] + "-/url/~r~" + urlArray[1] + "~/sort/hot/title/" + urlArray[1] + "/reditr_external_followed" };
				chrome.tabs.update(tabId, update);

			}
		}

	});

}


function checkMail() {

	//if there are no apps running, start checking for messages
	var tabs = chrome.extension.getViews({type: "tab"});
	if (tabs.length <= 0)
	  runMailCheck = true;

	if (runMailCheck) {
		// get posts
		connection.getPosts('/message/unread.json', 25, null, function(data) {
			
			// abort if nothing happened
			if(data.length == amountNew) return;
			
			// store amount of new nessages
			var amount = amountNew = data.length; 
			
			// store new messages on object
			var newItems = data;

			// set new amount of messages
			messages = amount;

			// if current amount of messages isnt -1 then we need to notify the user of new messages
			if(messages != -1) {
				
				// amount of new messages
				var newMessages = amount;

				// if theres more then 5 new messages just alert once
				var pms_updated = false;
				var posts_updated = false;
				if(newMessages > 4) {
					self.desktopNotification('New Messages!', 'You just received ' + newMessages + ' new messages.');
					pms_updated = true;
					posts_updated = true;
				
				// otherwise..
				}else{
					
					// for the amount of messages which are new
					for(var i = 0; i < newMessages; i++) {
						
						// if its a PM
						if(data[i].kind == 't4') {
							pms_updated = true;
							desktopNotification('New message from ' + data[i].data.author, data[i].data.body);
						
						// its a quote
						}else{
							posts_updated = true;
							desktopNotification('You were quoted by ' + data[i].data.author, data[i].data.body);
						}
						
					}
					
				}
				
			}
			
		});

	}
	
}