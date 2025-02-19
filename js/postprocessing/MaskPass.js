/**
 * @author alteredq / http://alteredqualia.com/
 */

v3d.MaskPass = function(scene, camera) {

    v3d.Pass.call(this);

    this.scene = scene;
    this.camera = camera;

    this.clear = true;
    this.needsSwap = false;

    this.inverse = false;

};

v3d.MaskPass.prototype = Object.assign(Object.create(v3d.Pass.prototype), {

    constructor: v3d.MaskPass,

    render: function(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {

        var context = renderer.context;
        var state = renderer.state;

        // don't update color or depth

        state.buffers.color.setMask(false);
        state.buffers.depth.setMask(false);

        // lock buffers

        state.buffers.color.setLocked(true);
        state.buffers.depth.setLocked(true);

        // set up stencil

        var writeValue, clearValue;

        if (this.inverse) {

            writeValue = 0;
            clearValue = 1;

        } else {

            writeValue = 1;
            clearValue = 0;

        }

        state.buffers.stencil.setTest(true);
        state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
        state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 0xffffffff);
        state.buffers.stencil.setClear(clearValue);

        // draw into the stencil buffer

        renderer.setRenderTarget(readBuffer);
        if (this.clear) renderer.clear();
        renderer.render(this.scene, this.camera);

        renderer.setRenderTarget(writeBuffer);
        if (this.clear) renderer.clear();
        renderer.render(this.scene, this.camera);

        // unlock color and depth buffer for subsequent rendering

        state.buffers.color.setLocked(false);
        state.buffers.depth.setLocked(false);

        // only render where stencil is set to 1

        state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff); // draw if == 1
        state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);

    }

});


v3d.ClearMaskPass = function() {

    v3d.Pass.call(this);

    this.needsSwap = false;

};

v3d.ClearMaskPass.prototype = Object.create(v3d.Pass.prototype);

Object.assign(v3d.ClearMaskPass.prototype, {

    render: function(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {

        renderer.state.buffers.stencil.setTest(false);

    }

});
