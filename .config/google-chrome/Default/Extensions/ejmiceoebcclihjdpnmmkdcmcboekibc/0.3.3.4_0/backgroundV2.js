var connection, database, amountNew, messages = -1, runMailCheck = true, checkMailInterval;
var DESKTOP = true;

setTimeout(boot, 1000);

chrome.app.runtime.onLaunched.addListener(function() {

  // try to pull the dimensions and position of the app last time the user closed it which we saved in local storage
  chrome.storage.local.get("last_window", function(data) {

    // if we dont know where the window last was, define that now
    if(!data || !data["last_window"])
        data = { last_window: { width: 1280, height: 720, top: 100, left: 100 } };

     // setting to use to open the window
     var windowSettings = {
          bounds: data["last_window"],
          frame: 'none',
          minWidth: 580,
          minHeight: 600      
    };

    runMailCheck = false;

    // make the window
    chrome.app.window.create('index.html', windowSettings);

 });



});

chrome.runtime.onSuspend.addListener(function() {

    runMailCheck = true;

});

function boot() {

    //just to maek sure we don't have 1 x 10^6 things going on
    clearInterval(checkMailInterval);

    database = new storageWrapper();

    // connect to reddit
    connection = new reddit(database, function(connection) {    

        // login to active user
        connection.loginActiveUser(function() {

            // delete old caches
            connection.purgeLocalStorageCache();        
            
            // check reddit for updates
            setTimeout(function() {
                    connection.setting('live_notification_updates', function(setting) {
                        if(setting) checkMail(); checkMailInterval = setInterval(checkMail, 60000);
                    });
            }, 3000);
        });     
    });


}


function checkMail() {

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