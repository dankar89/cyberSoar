import { mainContext, cameraPos, mainCanvasSize, vec2, time } from 'littlejsengine';
import { createShaderProgram } from '../shaderUtils.ts';

// this one is really cool:
// https://www.shadertoy.com/view/wdfGW4


export class BackgroundLayer {
  private shaderProgram: WebGLProgram | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenContext: WebGLRenderingContext;
  public initialized: boolean = false;

  public loaded: Promise<void>;

  constructor() {
    // Set up an offscreen canvas and WebGL context
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = mainCanvasSize.x;
    this.offscreenCanvas.height = mainCanvasSize.y;
    this.offscreenContext = this.offscreenCanvas.getContext('webgl') as WebGLRenderingContext;

    this.loaded = this.init();
  }
  private async init() {
    this.shaderProgram = await createShaderProgram(this.offscreenContext, 'shaders/vertex.glsl', 'shaders/background.glsl');

    if (!this.shaderProgram) {
      console.error("Failed to create shader program.");
    }

    console.log("BackgroundLayer: Initialized");
    this.initialized = true;
  }

  render() {
    if (!this.shaderProgram) return;

    const gl = this.offscreenContext;

    // Use the shader program for the offscreen context
    gl.useProgram(this.shaderProgram);

    // Set uniforms for resolution and camera position
    const resolutionLocation = gl.getUniformLocation(this.shaderProgram, 'u_resolution');
    const cameraPosLocation = gl.getUniformLocation(this.shaderProgram, 'u_cameraPos');
    const timeLocation = gl.getUniformLocation(this.shaderProgram, 'u_time');

    if (resolutionLocation) {
      gl.uniform2f(resolutionLocation, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }
    if (cameraPosLocation) {
      gl.uniform2f(cameraPosLocation, cameraPos.x, cameraPos.y);
    }
    if (timeLocation) {
      gl.uniform1f(timeLocation, time);
    }

    // Define the vertex positions for a full-canvas quad
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);

    // Set up buffer and attributes for the vertex shader
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(this.shaderProgram, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Clear and render the quad to the offscreen canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Draw the offscreen canvas onto the main context without affecting other elements
    const pos = mainCanvasSize.scale(0.5).add(vec2(-this.offscreenCanvas.width / 2, -this.offscreenCanvas.height / 2));
    mainContext.drawImage(this.offscreenCanvas, pos.x, pos.y, this.offscreenCanvas.width, this.offscreenCanvas.height);
  }
}
