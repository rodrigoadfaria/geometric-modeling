Obj = function() {
    this.primitive;
    this.vertices    = [];
    this.normals     = [];
    this.modelMatrix = mat4([1, 0, 0, 0],
                            [0, 1, 0, 0],
                            [0, 0, 1, 0],
                            [0, 0, 0, 1]);
};
