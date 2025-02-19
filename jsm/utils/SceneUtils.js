/**
 * @author alteredq / http://alteredqualia.com/
 */

import {
    Group,
    Matrix4,
    Mesh
} from "../../../build/v3d.module.js";

var SceneUtils = {

    createMultiMaterialObject: function(geometry, materials) {

        var group = new Group();

        for (var i = 0, l = materials.length; i < l; i++) {

            group.add(new Mesh(geometry, materials[i]));

        }

        return group;

    },

    detach: function(child, parent, scene) {

        child.applyMatrix(parent.matrixWorld);
        parent.remove(child);
        scene.add(child);

    },

    attach: function(child, scene, parent) {

        child.applyMatrix(new Matrix4().getInverse(parent.matrixWorld));

        scene.remove(child);
        parent.add(child);

    }

};

export { SceneUtils };
