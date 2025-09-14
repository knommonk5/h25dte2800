import { createProgram } from './glutils.js';
import { Camera } from './camera.js';
import { Controls } from './controls.js';
import { Compass } from './compass.js';
import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl2');
if (!gl) throw "WebGL2 not supported";

//Cam og kontroller
const camera = new Camera();
camera.setPreset("default");
const controls = new Controls(camera);

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    camera.aspect = canvas.width / canvas.height;
    camera.updateMatrices();
}
window.addEventListener('resize', resize);
resize();

//Shader
const vsSrc = document.getElementById('vs').text.trim();
const fsSrc = document.getElementById('fs').text.trim();
const program = createProgram(gl, vsSrc, fsSrc);

//Init compass
const compass = new Compass(gl, program);

//WebGL state
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.clearColor(0.9, 0.92, 0.95, 1.0);

function drawMesh(mesh, modelMat, color, drawMode = gl.TRIANGLES) {
    gl.useProgram(program);

    const uMVP = gl.getUniformLocation(program, 'uMVP');
    const uModel = gl.getUniformLocation(program, 'uModel');
    const uLight = gl.getUniformLocation(program, 'uLightDir');
    const uColor = gl.getUniformLocation(program, 'uColor');
    const uUseTexture = gl.getUniformLocation(program, 'uUseTexture');

    const mvp = mat4.create();
    mat4.mul(mvp, camera.proj, camera.view);
    mat4.mul(mvp, mvp, modelMat);

    gl.uniformMatrix4fv(uMVP, false, new Float32Array(mvp));
    gl.uniformMatrix4fv(uModel, false, new Float32Array(modelMat));
    gl.uniform3fv(uLight, vec3.normalize(vec3.create(), [0.5, 1.0, 0.8]));
    gl.uniform4fv(uColor, new Float32Array(color));
    gl.uniform1i(uUseTexture, 0);

    if (mesh.vao) {
        gl.bindVertexArray(mesh.vao);
        gl.drawElements(drawMode, mesh.n, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

//Kamera presets, hvorfor ikke bare flytte dette til controls TODO
window.addEventListener("keydown", (e) => {
    if (e.key === "1") camera.setPreset("side");
    if (e.key === "2") camera.setPreset("top");
    if (e.key === "3") camera.setPreset("default");
});

function animate() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    compass.rotationY = controls.compassYaw;
    compass.draw(gl, program, camera.view, camera.proj, drawMesh);

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
