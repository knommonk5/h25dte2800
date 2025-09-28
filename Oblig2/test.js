const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0,0,canvas.width,canvas.height);
gl.enable(gl.DEPTH_TEST);

// ===== Shaders =====
const vsSource = `
attribute vec3 aPosition;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition,1.0);
}`;
const fsSource = `
precision mediump float;
void main() {
    gl_FragColor = vec4(1.0,0.0,0.0,1.0); // Hard rød farge
}`;

// ===== Compile Shader =====
function createShader(gl,type,source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program,createShader(gl,gl.VERTEX_SHADER,vsSource));
gl.attachShader(program,createShader(gl,gl.FRAGMENT_SHADER,fsSource));
gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(program));
gl.useProgram(program);

// ===== Locations =====
const aPosition = gl.getAttribLocation(program,'aPosition');
const uModelMatrix = gl.getUniformLocation(program,'uModelMatrix');
const uViewMatrix = gl.getUniformLocation(program,'uViewMatrix');
const uProjectionMatrix = gl.getUniformLocation(program,'uProjectionMatrix');

// ===== Cube Data =====
const positions = new Float32Array([
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,0.5,-0.5,  -0.5,0.5,-0.5,
    -0.5,-0.5,0.5,   0.5,-0.5,0.5,   0.5,0.5,0.5,   -0.5,0.5,0.5
]);
const indices = new Uint16Array([
    0,1,2,0,2,3, 4,5,6,4,6,7,
    0,1,5,0,5,4, 2,3,7,2,7,6,
    0,3,7,0,7,4, 1,2,6,1,6,5
]);

const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,posBuf); gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
const idxBuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idxBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);

// ===== Draw =====
function draw(){
    gl.clearColor(0.2,0.2,0.2,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Model matrisen
    const modelMatrix = new Float32Array([
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1
    ]);

    // View - kamera bakover i Z
    const viewMatrix = new Float32Array([
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-3,1
    ]);

    // Projection - perspektiv
    const fov = 60*Math.PI/180;
    const aspect = canvas.width/canvas.height;
    const near = 0.1;
    const far = 100;
    const f = 1.0/Math.tan(fov/2);
    const projMatrix = new Float32Array([
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(far+near)/(near-far),-1,
        0,0,(2*far*near)/(near-far),0
    ]);

    gl.uniformMatrix4fv(uModelMatrix,false,modelMatrix);
    gl.uniformMatrix4fv(uViewMatrix,false,viewMatrix);
    gl.uniformMatrix4fv(uProjectionMatrix,false,projMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER,posBuf);
    gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idxBuf);

    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
}

draw();
