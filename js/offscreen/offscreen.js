self.importScripts('../../../build/v3d.js');
self.importScripts('./scene.js');

self.onmessage = function(message) {

    var data = message.data;
    init(data.drawingSurface, data.width, data.height, data.pixelRatio, data.path);

};
