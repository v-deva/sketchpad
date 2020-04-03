/*global window, Sketchpad, WebSocket, Colorpalette, alert*/
var primaryServer="wss://"+window.location.hostname+"/wbs" || "ws://localhost" + ":8067/";
var secondaryServer = 'wss://public.server.sketchpad.pro:8067/';

function splitScreen(wsA) {
    'use strict';
    console.log('Inintializing splitScreen', wsA);

    var sketchpadA = new Sketchpad({
        containerEl: document.getElementById('sketchpadA'),
        token: window.location.hash || '#multiplayer',
        ws: wsA,
        createPageConfig: {
            sid: '#1page_token'
        }
    });
    sketchpadA.setTool('pen');
    sketchpadA.getCurrentTool().setSize(3);
    sketchpadA.watermark.style.display = 'none';
    sketchpadA.canvas.style.backgroundColor = 'white';
    window.sketchpadA = sketchpadA;

    function selectTool(toolId) {
        sketchpadA.setTool(toolId);
    }

    document.getElementById('tool-pen').addEventListener('click', function () {
        selectTool('pen');
    });

    document.getElementById('tool-eraser').addEventListener('click', function () {
        selectTool('eraser');
    });

    document.getElementById('tool-save').addEventListener('click', function () {
        var data = sketchpadA.saveSketchpad(true);
        saveFile(JSON.stringify(data), sketchpadA.room.room_token + '.json', 'text/json');
    });

    function saveFile(data, filename, type) {
        'use strict';
        var filesize = data.toString().length;
        filename = prompt('Size of sketch is ' + bytesToSize(filesize) + ', save?', filename);
        if (!filename) {
            return;
        }
        var a = document.createElement('a'),
            file = new Blob([data], {
                type: type
            });
        if (window.navigator.msSaveOrOpenBlob) {
            // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        } else {
            // Others
            var url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    function bytesToSize(bytes) {
        'use strict';
        bytes = parseInt(bytes, 10);
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) {
            return '0 Byte';
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    document.getElementById('tool-load').addEventListener('click', function () {
        loadFile('.json,application/json', function (data) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error('Error parsing file', e);
                return;
            }
            if (Array.isArray(data)) {
                return jsonToDraw(sketchpadA, data);
            } else {
                console.error('Wrong file content');
                return;
            }
        });
    });

    function jsonToDraw(sketchpadA, inputList) {
        var i, input;

        sketchpadA.reset();
        sketchpadA.receiveMessageFromServer({
            data: JSON.stringify({
                cmd: 'history-begin'
            })
        });
        sketchpadA.sendMessageToServer({
            cmd: 'history-begin'
        });

        for (i = 0; i < inputList.length; i += 1) {
            input = inputList[i];
            input.bid = 0;
            input.uid = sketchpadA.UID;
            if (input.config && input.config.sid) {
                console.log('PAGE: Input.cmd', input.cmd, input.config, input.config.sid);
            } else {
                console.log('Input: Input.cmd', input.cmd, input.sid);
            }

            sketchpadA.sendMessageToServer(inputList[i]);
            sketchpadA.receiveMessageFromServer({
                data: JSON.stringify(inputList[i])
            });
        }
        sketchpadA.receiveMessageFromServer({
            data: JSON.stringify({
                cmd: 'history-end'
            })
        });
        sketchpadA.sendMessageToServer({
            cmd: 'history-end'
        });
        //select current page?
        return inputList;
    }

    function loadFile(accept, callback) {
        'use strict';

        function loadSubfile(file) {
            var reader = new FileReader();
            reader.onloadend = function (evt) {
                if (evt.target.readyState === FileReader.DONE) {
                    // DONE == 2
                    callback(evt.target.result, file);
                }
            };
            reader.readAsBinaryString(file);
        }

        function inputChange(evt) {
            var files = evt.target.files;
            var i;
            for (i = 0; i < files.length; i += 1) {
                loadSubfile(files[i]);
            }
        }
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = accept;
        fileInput.addEventListener('change', inputChange, false);
        fileInput.click();
    }
    document.getElementById('tool-undo').addEventListener("click", function () {
        sketchpadA.undo();
    });
    document.getElementById('tool-redo').addEventListener("click", function () {
        sketchpadA.redo();
    });
}

function connectToServer(wsServerAddress, onSuccessCallback, onErrorCallback) {
    'use strict';
    var wsA = new WebSocket(wsServerAddress);
    var wsB = new WebSocket(wsServerAddress);

    function onError(e) {
        wsA.removeEventListener('error', onError);
        onErrorCallback(e);
    }

    function onOpen() {
        if (wsA.readyState === 1) {
            wsA.removeEventListener('error', onError);
            onSuccessCallback(wsA);
        }
    }
    wsA.addEventListener('open', onOpen);
    wsB.addEventListener('open', onOpen);
    wsA.addEventListener('error', onError);
    wsB.addEventListener('error', onError);
}

function initSketchpad() {
    'use strict';

    connectToServer(primaryServer, splitScreen, function () {
        console.log('Primary server fail, trying secondary server...', secondaryServer);
        connectToServer(secondaryServer, splitScreen, function () {
            alert('Connection fail.');
        });
    });

    window.addEventListener('hashchange', function () {
        window.location.reload(); //reconnect on room name in hash change
    });
}
initSketchpad();
