import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

export class Compass {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.rotationY = 0;

        this.base = this.initMesh(gl, program, this.createCompassBase());
        this.needle = this.initMesh(gl, program, this.createNeedleMesh());
        this.markers = this.initMesh(gl, program, this.createMarkers());
    }

    initMesh(gl, program, mesh) {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, "aPosition");
        if (posLoc >= 0) {
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        }

        if (mesh.normals) {
            const nrmBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
            gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
            const nrmLoc = gl.getAttribLocation(program, "aNormal");
            if (nrmLoc >= 0) {
                gl.enableVertexAttribArray(nrmLoc);
                gl.vertexAttribPointer(nrmLoc, 3, gl.FLOAT, false, 0, 0);
            }
        }

        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return {
            vao,
            n: mesh.indices.length,
            drawMode: mesh.drawMode || gl.TRIANGLES
        };
    }

    createCompassBase() {
        const radius = 1.6;
        const height = 0.3;
        const segments = 64;

        const positions = [];
        const normals = [];
        const indices = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle);
            const z = Math.sin(angle);

            positions.push(radius * x, -height / 2, radius * z);
            normals.push(x, 0, z);

            positions.push(radius * x, height / 2, radius * z);
            normals.push(x, 0, z);
        }
        for (let i = 0; i < segments; i++) {
            const o = i * 2;
            indices.push(o, o + 1, o + 2);
            indices.push(o + 1, o + 3, o + 2);
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            indices: new Uint16Array(indices)
        };
    }

    createNeedleMesh() {
        const length = 1.5;
        const width = 0.3;
        const height = 0.1;

        const positions = [
            0,  height/2,  length,
            -width/2,  height/2, 0,
            width/2,  height/2, 0,
            0, -height/2,  length,
            -width/2, -height/2, 0,
            width/2, -height/2, 0,
        ];

        const indices = [
            0,1,2,
            3,5,4,
            0,2,5,
            0,5,3,
            0,4,1,
            0,3,4,
            1,4,5,
            1,5,2
        ];

        const normals = new Array(positions.length).fill(0);

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            indices: new Uint16Array(indices),
        };
    }

    createMarkers() {
        const segments = 16;
        const radius = 1.65;
        const positions = [];
        const indices = [];

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            positions.push(x, 0.16, z);
            indices.push(i);
        }

        return {
            positions: new Float32Array(positions),
            normals: null,
            indices: new Uint16Array(indices),
            drawMode: this.gl.POINTS
        };
    }

    createFace() {
        const size = 1.5;
        const y = 0.16;

        const positions = [
            0, y, 0,   0, y, size,
            0, y, 0,   0, y, -size,
            0, y, 0,   size, y, 0,
            0, y, 0,   -size, y, 0
        ];

        const indices = [
            0, 1,
            2, 3,
            4, 5,
            6, 7
        ];

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(positions.length).fill(0),
            indices: new Uint16Array(indices),
            drawMode: this.gl.LINES
        };
    }

    draw(gl, program, viewMatrix, projMatrix, drawMesh) {
        const modelBase = mat4.create();
        mat4.rotateY(modelBase, modelBase, this.rotationY);
        drawMesh(this.base, modelBase, [0.2, 0.2, 0.2, 1.0]);

        const modelNeedle = mat4.create();
        mat4.translate(modelNeedle, modelNeedle, [0, 0.2, 0]);
        mat4.rotateY(modelNeedle, modelNeedle, Math.PI / 1.5);
        drawMesh(this.needle, modelNeedle, [1.0, 0.0, 0.0, 1.0]);

        const modelMarkers = mat4.create();
        mat4.rotateY(modelMarkers, modelMarkers, this.rotationY);
        drawMesh(this.markers, modelMarkers, [0.6, 0.6, 0.6, 1.0], gl.POINTS);
    }
}