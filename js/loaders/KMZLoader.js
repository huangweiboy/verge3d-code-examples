/**
 * @author mrdoob / http://mrdoob.com/
 */

v3d.KMZLoader = function(manager) {

    this.manager = (manager !== undefined) ? manager : v3d.DefaultLoadingManager;

};

v3d.KMZLoader.prototype = {

    constructor: v3d.KMZLoader,

    load: function(url, onLoad, onProgress, onError) {

        var scope = this;

        var loader = new v3d.FileLoader(scope.manager);
        loader.setPath(scope.path);
        loader.setResponseType('arraybuffer');
        loader.load(url, function(text) {

            onLoad(scope.parse(text));

        }, onProgress, onError);

    },

    setPath: function(value) {

        this.path = value;
        return this;

    },

    parse: function(data) {

        function findFile(url) {

            for (var path in zip.files) {

                if (path.substr(- url.length) === url) {

                    return zip.files[path];

                }

            }

        }

        var manager = new v3d.LoadingManager();
        manager.setURLModifier(function(url) {

            var image = findFile(url);

            if (image) {

                console.log('Loading', url);

                var blob = new Blob([image.asArrayBuffer()], { type: 'application/octet-stream' });
                return URL.createObjectURL(blob);

            }

            return url;

        });

        //

        var zip = new JSZip(data); // eslint-disable-line no-undef

        if (zip.files['doc.kml']) {

            var xml = new DOMParser().parseFromString(zip.files['doc.kml'].asText(), 'application/xml');

            var model = xml.querySelector('Placemark Model Link href');

            if (model) {

                var loader = new v3d.ColladaLoader(manager);
                return loader.parse(zip.files[model.textContent].asText());

            }

        } else {

            console.warn('KMZLoader: Missing doc.kml file.');

            for (var path in zip.files) {

                var extension = path.split('.').pop().toLowerCase();

                if (extension === 'dae') {

                    var loader = new v3d.ColladaLoader(manager);
                    return loader.parse(zip.files[path].asText());

                }

            }

        }

        console.error('KMZLoader: Couldn\'t find .dae file.');
        return { scene: new v3d.Group() };

    }

};
