import { vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

export class Controls {
    constructor(camera) {
        this.camera = camera;
        this.compassYaw = 0.0;

        // Bind keyboard
        this._keydown = this._keydown.bind(this);
        window.addEventListener("keydown", this._keydown);
    }

    _keydown(e) {
        const step = 0.2;     // Camera movement step
        const rotStep = 0.05; // Compass rotation step
        const zoomStep = 0.1; // Zoom step

        switch (e.key.toLowerCase()) {
            case "w": this.camera.moveForward(-step); break;
            case "s": this.camera.moveForward(step); break;
            case "a": this.camera.moveRight(-step); break;
            case "d": this.camera.moveRight(step); break;
            case "q": this.camera.moveUp(step); break;
            case "e": this.camera.moveUp(-step); break;
            case "v": this.camera.zoom(-zoomStep); break;
            case "b": this.camera.zoom(zoomStep); break;
            case "n": this.compassYaw += rotStep; break;
            case "m": this.compassYaw -= rotStep; break;
            case "r":
                // Reset camera + compass
                this.camera.pos = vec3.fromValues(0, 3, 5);
                this.camera.target = vec3.fromValues(0, 0, 0);
                this.camera.fov = Math.PI / 3;
                this.compassYaw = 0;
                this.camera.updateMatrices();
                break;
            //TODO cam preset
        }
    }
}
