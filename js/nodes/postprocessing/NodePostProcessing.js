/**
 * @author sunag / http://www.sunag.com.br/
 */

import { NodeMaterial } from '../materials/NodeMaterial.js';
import { ScreenNode } from '../inputs/ScreenNode.js';

function NodePostProcessing(renderer, renderTarget) {

    if (renderTarget === undefined) {

        var parameters = {
            minFilter: v3d.LinearFilter,
            magFilter: v3d.LinearFilter,
            format: v3d.RGBAFormat,
            stencilBuffer: false
        };

        var size = renderer.getDrawingBufferSize(new v3d.Vector2());
        renderTarget = new v3d.WebGLRenderTarget(size.width, size.height, parameters);

    }

    this.renderer = renderer;
    this.renderTarget = renderTarget;

    this.output = new ScreenNode();
    this.material = new NodeMaterial();

    this.camera = new v3d.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.scene = new v3d.Scene();

    this.quad = new v3d.Mesh(new v3d.PlaneBufferGeometry(2, 2), this.material);
    this.quad.frustumCulled = false; // Avoid getting clipped
    this.scene.add(this.quad);

    this.needsUpdate = true;

}

NodePostProcessing.prototype = {

    constructor: NodePostProcessing,

    render: function(scene, camera, frame) {

        if (this.needsUpdate) {

            this.material.dispose();

            this.material.fragment.value = this.output;
            this.material.build();

            if (this.material.uniforms.renderTexture) {

                this.material.uniforms.renderTexture.value = this.renderTarget.texture;

            }

            this.needsUpdate = false;

        }

        frame.setRenderer(this.renderer)
            .setRenderTexture(this.renderTarget.texture);

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(scene, camera);

        frame.updateNode(this.material);

        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);

    },

    setSize: function(width, height) {

        this.renderTarget.setSize(width, height);

        this.renderer.setSize(width, height);

    },

    copy: function(source) {

        this.output = source.output;

    },

    toJSON: function(meta) {

        var isRootObject = (meta === undefined || typeof meta === 'string');

        if (isRootObject) {

            meta = {
                nodes: {}
            };

        }

        if (meta && ! meta.post) meta.post = {};

        if (!meta.post[this.uuid]) {

            var data = {};

            data.uuid = this.uuid;
            data.type = "NodePostProcessing";

            meta.post[this.uuid] = data;

            if (this.name !== "") data.name = this.name;

            if (JSON.stringify(this.userData) !== '{}') data.userData = this.userData;

            data.output = this.output.toJSON(meta).uuid;

        }

        meta.post = this.uuid;

        return meta;

    }

};

export { NodePostProcessing };
