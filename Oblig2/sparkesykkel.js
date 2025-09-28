// ====================== Hjelpeklasser ======================
class Stack {
    constructor() { this.stack = []; }
    pushMatrix(m) { this.stack.push(m.slice()); }
    popMatrix() { return this.stack.pop(); }
    peekMatrix() { return this.stack[this.stack.length-1].slice(); }
}

class Matrix4 {
    constructor() { this.elements = Matrix4.identity(); }
    static identity() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
    static multiply(a,b){
        let r = new Array(16).fill(0);
        for(let i=0;i<4;i++)
            for(let j=0;j<4;j++)
                for(let k=0;k<4;k++)
                    r[i*4+j] += a[i*4+k]*b[k*4+j];
        return r;
    }
    translate(x,y,z){ let t=Matrix4.identity(); t[12]=x; t[13]=y; t[14]=z; this.elements=Matrix4.multiply(this.elements,t); return this;}
    scale(sx,sy,sz){ let s=Matrix4.identity(); s[0]=sx; s[5]=sy; s[10]=sz; this.elements=Matrix4.multiply(this.elements,s); return this;}
    rotateZ(angle){ let c=Math.cos(angle),s=Math.sin(angle); let r=Matrix4.identity(); r[0]=c;r[1]=-s;r[4]=s;r[5]=c; this.elements=Matrix4.multiply(this.elements,r); return this;}
}

// ====================== Math hjelp ======================
function perspective(fovY,aspect,znear,zfar){
    let f=1/Math.tan(fovY*Math.PI/360); let nf=1/(znear-zfar);
    return [f/aspect,0,0,0,0,f,0,0,0,0,(zfar+znear)*nf,-1,0,0,2*znear*zfar*nf,0];
}
function lookAt(eye,center,up){
    let f=[center[0]-eye[0],center[1]-eye[1],center[2]-eye[2]];
    let r=Math.hypot(...f); f=f.map(v=>v/r);
    let s=[f[1]*up[2]-f[2]*up[1],f[2]*up[0]-f[0]*up[2],f[0]*up[1]-f[1]*up[0]];
    r=Math.hypot(...s); s=s.map(v=>v/r);
    let u=[s[1]*f[2]-s[2]*f[1], s[2]*f[0]-s[0]*f[2], s[0]*f[1]-s[1]*f[0]];
    return [
        s[0], u[0], -f[0],0, s[1], u[1], -f[1],0, s[2], u[2], -f[2],0,
        -dot(s,eye),-dot(u,eye),dot(f,eye),1
    ];
}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

// ====================== WebGL Setup ======================
const canvas=document.getElementById('glCanvas');
const gl=canvas.getContext('webgl');
canvas.width=window.innerWidth; canvas.height=window.innerHeight;
gl.viewport(0,0,canvas.width,canvas.height);
gl.enable(gl.DEPTH_TEST);

// Vertex + Fragment shader med tekstur
const vsSource=`
attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 uModelMatrix,uViewMatrix,uProjectionMatrix;
varying vec2 vTexCoord;
void main(){
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition,1.0);
    vTexCoord = aTexCoord;
}`;
const fsSource=`
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSampler;
void main(){
    gl_FragColor = texture2D(uSampler, vTexCoord);
}`;
function createShader(gl,type,source){ let s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s); return s; }
const program=gl.createProgram();
gl.attachShader(program,createShader(gl,gl.VERTEX_SHADER,vsSource));
gl.attachShader(program,createShader(gl,gl.FRAGMENT_SHADER,fsSource));
gl.linkProgram(program); gl.useProgram(program);

const aPosition=gl.getAttribLocation(program,'aPosition');
const aTexCoord=gl.getAttribLocation(program,'aTexCoord');
const uModelMatrix=gl.getUniformLocation(program,'uModelMatrix');
const uViewMatrix=gl.getUniformLocation(program,'uViewMatrix');
const uProjectionMatrix=gl.getUniformLocation(program,'uProjectionMatrix');
const uSampler=gl.getUniformLocation(program,'uSampler');

// ====================== Buffers ======================
function createCubeBuffer(){
    const positions=new Float32Array([
        -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5, -0.5,0.5,-0.5,
        -0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5
    ]);
    const uvs=new Float32Array([
        0,0,1,0,1,1,0,1,
        0,0,1,0,1,1,0,1
    ]);
    const indices=new Uint16Array([
        0,1,2, 0,2,3, 4,5,6, 4,6,7,
        0,1,5, 0,5,4, 2,3,7, 2,7,6,
        0,3,7, 0,7,4, 1,2,6, 1,6,5
    ]);

    const posBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,posBuf); gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
    const uvBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,uvBuf); gl.bufferData(gl.ARRAY_BUFFER,uvs,gl.STATIC_DRAW);
    const idxBuf=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idxBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);

    return {posBuf, uvBuf, idxBuf, count: indices.length};
}
const cube=createCubeBuffer();

// ====================== Teksturer ======================
function loadTexture(src){
    const tex=gl.createTexture();
    const img=new Image();
    img.onload=()=>{ gl.bindTexture(gl.TEXTURE_2D,tex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
        gl.generateMipmap(gl.TEXTURE_2D);}
    img.src=src;
    return tex;
}
const metalTex = loadTexture('metal1.png');
const wheelTex = loadTexture('wheelTexture-1-2.png');

// ====================== Kontroller ======================
let keys={};
window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

let steer=0, maxSteer=Math.PI/4;
let wheelSpin=0, spinVel=0;

const stack=new Stack();
const camera={theta:Math.PI/4, phi:Math.PI/6, radius:15, update:function(){ /* Kameramatrise */ this.viewMatrix = lookAt([this.radius*Math.cos(this.phi)*Math.sin(this.theta), this.radius*Math.sin(this.phi), this.radius*Math.cos(this.phi)*Math.cos(this.theta)],[0,1,0],[0,1,0]); this.projectionMatrix = perspective(60,gl.canvas.width/gl.canvas.height,0.1,100); }, handleKeys:function(el){if(keys['a']) this.theta-=1*el; if(keys['d']) this.theta+=1*el; if(keys['w']) this.phi=Math.min(this.phi+1*el,Math.PI/2-0.1); if(keys['s']) this.phi=Math.max(this.phi-1*el,-Math.PI/3); if(keys['v']) this.radius=Math.max(5,this.radius-5*el); if(keys['b']) this.radius=Math.min(40,this.radius+5*el); this.update();}};
camera.update();

// ====================== Tegnefunksjoner ======================
function drawCube(modelMatrix, texture){
    gl.uniformMatrix4fv(uModelMatrix,false,new Float32Array(modelMatrix));
    gl.uniformMatrix4fv(uViewMatrix,false,new Float32Array(camera.viewMatrix));
    gl.uniformMatrix4fv(uProjectionMatrix,false,new Float32Array(camera.projectionMatrix));

    gl.bindBuffer(gl.ARRAY_BUFFER,cube.posBuf); gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER,cube.uvBuf); gl.vertexAttribPointer(aTexCoord,2,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(aTexCoord);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cube.idxBuf);

    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.uniform1i(uSampler,0);
    gl.drawElements(gl.TRIANGLES,cube.count,gl.UNSIGNED_SHORT,0);
}

function drawScooter(){
    stack.pushMatrix(Matrix4.identity().elements);

    // Deck
    let m=new Matrix4().translate(0,0,0).scale(3,0.1,0.5);
    drawCube(m.elements, metalTex);

    // Bakre støtte
    m=new Matrix4().translate(1.5,0.35,0).rotateZ(-Math.PI/6).scale(0.15,0.7,0.15);
    drawCube(m.elements, metalTex);

    // Bak-hjul
    m=new Matrix4().translate(1.7,0,0).scale(0.35,0.35,0.05).rotateZ(wheelSpin);
    drawCube(m.elements, wheelTex);

    // Front stamme
    m=new Matrix4().translate(-1.6,0,0).rotateZ(-Math.PI/7).scale(0.07,2.0,0.07);
    drawCube(m.elements, metalTex);

    // Front-hjul
    m=new Matrix4().translate(-1.6,0,0).scale(0.35,0.35,0.05).rotateZ(wheelSpin);
    drawCube(m.elements, wheelTex);

    // Styre
    m=new Matrix4().translate(-1.6,2,0).rotateZ(Math.PI/2).scale(1.2,0.06,0.06);
    drawCube(m.elements, metalTex);

    stack.popMatrix();
}

// ====================== Animasjon ======================
let lastTime=0;
function animate(currentTime){
    requestAnimationFrame(animate);
    if(!lastTime) lastTime=currentTime;
    const elapsed=(currentTime-lastTime)/1000; lastTime=currentTime;

    camera.handleKeys(elapsed);

    // Styring
    if(keys['arrowleft']) steer=Math.max(steer-1*elapsed,-maxSteer);
    if(keys['arrowright']) steer=Math.min(steer+1*elapsed,maxSteer);

    // Hjulspinn
    if(keys['f']) spinVel=-6;
    else if(keys['g']) spinVel=6;
    else spinVel*=0.9;
    wheelSpin += spinVel*elapsed*10;

    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clearColor(0.2,0.2,0.2,1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawScooter();
}
animate();


console.log(gl.getProgramInfoLog(program));
