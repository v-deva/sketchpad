For it to work on your local ... 

change the first line of demos/js/online.js or demos/js/changed.js to 

var primaryServer= "ws://" + (window.location.hostname || "localhost") + ":8067/"

start the server from server/server.js and see the html output from demos/online.html or demos/changed.html