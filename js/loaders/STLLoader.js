/**
 * @author aleeper / http://adamleeper.com/
 * @author mrdoob / http://mrdoob.com/
 * @author gero3 / https://github.com/gero3
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Description: A v3d loader for STL ASCII files, as created by Solidworks and other CAD programs.
 *
 * Supports both binary and ASCII encoded files, with automatic detection of type.
 *
 * The loader returns a non-indexed buffer geometry.
 *
 * Limitations:
 *  Binary decoding supports "Magics" color format (http://en.wikipedia.org/wiki/STL_(file_format)#Color_in_binary_STL).
 *  There is perhaps some question as to how valid it is to always assume little-endian-ness.
 *  ASCII decoding assumes file is UTF-8.
 *
 * Usage:
 *  var loader = new v3d.STLLoader();
 *  loader.load('./models/stl/slotted_disk.stl', function(geometry) {
 *    scene.add(new v3d.Mesh(geometry));
 *  });
 *
 * For binary STLs geometry might contain colors for vertices. To use it:
 *  // use the same code to load STL as above
 *  if (geometry.hasColors) {
 *    material = new v3d.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: v3d.VertexColors });
 *  } else { .... }
 *  var mesh = new v3d.Mesh(geometry, material);
 */


v3d.STLLoader = function(manager) {

    this.manager = (manager !== undefined) ? manager : v3d.DefaultLoadingManager;

};

v3d.STLLoader.prototype = {

    constructor: v3d.STLLoader,

    load: function(url, onLoad, onProgress, onError) {

        var scope = this;

        var loader = new v3d.FileLoader(scope.manager);
        loader.setPath(scope.path);
        loader.setResponseType('arraybuffer');
        loader.load(url, function(text) {

            try {

                onLoad(scope.parse(text));

            } catch (exception) {

                if (onError) {

                    onError(exception);

                }

            }

        }, onProgress, onError);

    },

    setPath: function(value) {

        this.path = value;
        return this;

    },

    parse: function(data) {

        function isBinary(data) {

            var expect, face_size, n_faces, reader;
            reader = new DataView(data);
            face_size = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
            n_faces = reader.getUint32(80, true);
            expect = 80 + (32 / 8) + (n_faces * face_size);

            if (expect === reader.byteLength) {

                return true;

            }

            // An ASCII STL data must begin with 'solid ' as the first six bytes.
            // However, ASCII STLs lacking the SPACE after the 'd' are known to be
            // plentiful.  So, check the first 5 bytes for 'solid'.

            // Several encodings, such as UTF-8, precede the text with up to 5 bytes:
            // https://en.wikipedia.org/wiki/Byte_order_mark#Byte_order_marks_by_encoding
            // Search for "solid" to start anywhere after those prefixes.

            // US-ASCII ordinal values for 's', 'o', 'l', 'i', 'd'

            var solid = [115, 111, 108, 105, 100];

            for (var off = 0; off < 5; off ++) {

                // If "solid" text is matched to the current offset, declare it to be an ASCII STL.

                if (matchDataViewAt (solid, reader, off)) return false;

            }

            // Couldn't find "solid" text at the beginning; it is binary STL.

            return true;

        }

        function matchDataViewAt(query, reader, offset) {

            // Check if each byte in query matches the corresponding byte from the current offset

            for (var i = 0, il = query.length; i < il; i++) {

                if (query[i] !== reader.getUint8(offset + i, false)) return false;

            }

            return true;

        }

        function parseBinary(data) {

            var reader = new DataView(data);
            var faces = reader.getUint32(80, true);

            var r, g, b, hasColors = false, colors;
            var defaultR, defaultG, defaultB, alpha;

            // process STL header
            // check for default color in header ("COLOR=rgba" sequence).

            for (var index = 0; index < 80 - 10; index ++) {

                if ((reader.getUint32(index, false) == 0x434F4C4F /*COLO*/) &&
                    (reader.getUint8(index + 4) == 0x52 /*'R'*/) &&
                    (reader.getUint8(index + 5) == 0x3D /*'='*/)) {

                    hasColors = true;
                    colors = [];

                    defaultR = reader.getUint8(index + 6) / 255;
                    defaultG = reader.getUint8(index + 7) / 255;
                    defaultB = reader.getUint8(index + 8) / 255;
                    alpha = reader.getUint8(index + 9) / 255;

                }

            }

            var dataOffset = 84;
            var faceLength = 12 * 4 + 2;

            var geometry = new v3d.BufferGeometry();

            var vertices = [];
            var normals = [];

            for (var face = 0; face < faces; face ++) {

                var start = dataOffset + face * faceLength;
                var normalX = reader.getFloat32(start, true);
                var normalY = reader.getFloat32(start + 4, true);
                var normalZ = reader.getFloat32(start + 8, true);

                if (hasColors) {

                    var packedColor = reader.getUint16(start + 48, true);

                    if ((packedColor & 0x8000) === 0) {

                        // facet has its own unique color

                        r = (packedColor & 0x1F) / 31;
                        g = ((packedColor >> 5) & 0x1F) / 31;
                        b = ((packedColor >> 10) & 0x1F) / 31;

                    } else {

                        r = defaultR;
                        g = defaultG;
                        b = defaultB;

                    }

                }

                for (var i = 1; i <= 3; i++) {

                    var vertexstart = start + i * 12;

                    vertices.push(reader.getFloat32(vertexstart, true));
                    vertices.push(reader.getFloat32(vertexstart + 4, true));
                    vertices.push(reader.getFloat32(vertexstart + 8, true));

                    normals.push(normalX, normalY, normalZ);

                    if (hasColors) {

                        colors.push(r, g, b);

                    }

                }

            }

            geometry.addAttribute('position', new v3d.BufferAttribute(new Float32Array(vertices), 3));
            geometry.addAttribute('normal', new v3d.BufferAttribute(new Float32Array(normals), 3));

            if (hasColors) {

                geometry.addAttribute('color', new v3d.BufferAttribute(new Float32Array(colors), 3));
                geometry.hasColors = true;
                geometry.alpha = alpha;

            }

            return geometry;

        }

        function parseASCII(data) {

            var geometry = new v3d.BufferGeometry();
            var patternFace = /facet([\s\S]*?)endfacet/g;
            var faceCounter = 0;

            var patternFloat = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/.source;
            var patternVertex = new RegExp('vertex' + patternFloat + patternFloat + patternFloat, 'g');
            var patternNormal = new RegExp('normal' + patternFloat + patternFloat + patternFloat, 'g');

            var vertices = [];
            var normals = [];

            var normal = new v3d.Vector3();

            var result;

            while ((result = patternFace.exec(data)) !== null) {

                var vertexCountPerFace = 0;
                var normalCountPerFace = 0;

                var text = result[0];

                while ((result = patternNormal.exec(text)) !== null) {

                    normal.x = parseFloat(result[1]);
                    normal.y = parseFloat(result[2]);
                    normal.z = parseFloat(result[3]);
                    normalCountPerFace ++;

                }

                while ((result = patternVertex.exec(text)) !== null) {

                    vertices.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
                    normals.push(normal.x, normal.y, normal.z);
                    vertexCountPerFace ++;

                }

                // every face have to own ONE valid normal

                if (normalCountPerFace !== 1) {

                    console.error('v3d.STLLoader: Something isn\'t right with the normal of face number ' + faceCounter);

                }

                // each face have to own v3d valid vertices

                if (vertexCountPerFace !== 3) {

                    console.error('v3d.STLLoader: Something isn\'t right with the vertices of face number ' + faceCounter);

                }

                faceCounter ++;

            }

            geometry.addAttribute('position', new v3d.Float32BufferAttribute(vertices, 3));
            geometry.addAttribute('normal', new v3d.Float32BufferAttribute(normals, 3));

            return geometry;

        }

        function ensureString(buffer) {

            if (typeof buffer !== 'string') {

                return v3d.LoaderUtils.decodeText(new Uint8Array(buffer));

            }

            return buffer;

        }

        function ensureBinary(buffer) {

            if (typeof buffer === 'string') {

                var array_buffer = new Uint8Array(buffer.length);
                for (var i = 0; i < buffer.length; i++) {

                    array_buffer[i] = buffer.charCodeAt(i) & 0xff; // implicitly assumes little-endian

                }
                return array_buffer.buffer || array_buffer;

            } else {

                return buffer;

            }

        }

        // start

        var binData = ensureBinary(data);

        return isBinary(binData) ? parseBinary(binData) : parseASCII(ensureString(data));

    }

};
