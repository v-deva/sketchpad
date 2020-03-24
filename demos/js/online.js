/*global window, Sketchpad, WebSocket, Colorpalette, alert*/
var primaryServer="wss://"+window.location.hostname+"/wbs" || "ws://localhost" + ":8067/"
    secondaryServer = "wss://public.server.sketchpad.pro:8067/";


function splitScreen(wsA) {
    "use strict";
    console.log("Inintializing splitScreen", wsA);


    var sketchpadA = new Sketchpad({
        containerEl: document.getElementById("sketchpadA"),
        token: window.location.hash || "#multiplayer",
        ws: wsA,
        createPageConfig: {sid: "#1page_token"}
    });
    sketchpadA.setTool("pen");

    window.sketchpadA = sketchpadA;

}
function connectToServer(wsServerAddress, onSuccessCallback, onErrorCallback) {
    "use strict";
    var wsA = new WebSocket(wsServerAddress);
    function onError(e) {
        wsA.removeEventListener("error", onError);
        onErrorCallback(e);
    }

    function onOpen() {
        if (wsA.readyState === 1) {
            wsA.removeEventListener("error", onError);
            onSuccessCallback(wsA);
        }
    }
    wsA.addEventListener("open", onOpen);
    wsA.addEventListener("error", onError);
}

function initSketchpad() {
    "use strict";

    connectToServer(primaryServer, splitScreen, function () {
        console.log("Primary server fail, trying secondary server...", secondaryServer);
        connectToServer(secondaryServer, splitScreen, function () {
            alert("Connection fail.");
        });
    });

    window.addEventListener("hashchange", function () {
        window.location.reload();//reconnect on room name in hash change
    });

}
initSketchpad();


