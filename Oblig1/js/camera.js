import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

export class Camera {
    constructor() {
        this.pos = vec3.fromValues(0, 3, 5);   // standard vinkel
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 1, 0);

        this.fov = Math.PI / 3;
        this.aspect = 1.0;
        this.near = 0.1;
        this.far = 100.0;

        this.view = mat4.create();
        this.proj = mat4.create();

        this.updateMatrices();
    }

    updateMatrices() {
        mat4.lookAt(this.view, this.pos, this.target, this.up);
        mat4.perspective(this.proj, this.fov, this.aspect, this.near, this.far);
    }

    moveForward(dist) {
        const forward = vec3.create();
        vec3.subtract(forward, this.target, this.pos);
        vec3.normalize(forward, forward);
        vec3.scaleAndAdd(this.pos, this.pos, forward, dist);
        vec3.scaleAndAdd(this.target, this.target, forward, dist);
        this.updateMatrices();
    }

    moveRight(dist) {
        const forward = vec3.create();
        vec3.subtract(forward, this.target, this.pos);
        const right = vec3.create();
        vec3.cross(right, forward, this.up);
        vec3.normalize(right, right);
        vec3.scaleAndAdd(this.pos, this.pos, right, dist);
        vec3.scaleAndAdd(this.target, this.target, right, dist);
        this.updateMatrices();
    }

    moveUp(dist) {
        vec3.scaleAndAdd(this.pos, this.pos, this.up, dist);
        vec3.scaleAndAdd(this.target, this.target, this.up, dist);
        this.updateMatrices();
    }

    zoom(factor) {
        this.fov += factor;
        if (this.fov < 0.2) this.fov = 0.2;
        if (this.fov > Math.PI - 0.2) this.fov = Math.PI - 0.2;
        this.updateMatrices();
    }

    setPreset(name) {
        switch (name) {
            case "side":
                this.pos = vec3.fromValues(5, 0, 0);
                this.target = vec3.fromValues(0, 0, 0);
                this.up = vec3.fromValues(0, 1, 0);
                break;

            case "top":
                this.pos = vec3.fromValues(0, 5, 0);
                this.target = vec3.fromValues(0, 0, 0);
                this.up = vec3.fromValues(0, 0, -1);
                break;

            default:
                this.pos = vec3.fromValues(0, 3, 5);
                this.target = vec3.fromValues(0, 0, 0);
                this.up = vec3.fromValues(0, 1, 0);
                break;
        }
        this.updateMatrices();
    }
}
