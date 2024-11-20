import { mainContext, glContext, glFlush, glCanvas, mainCanvas, glCreateTexture } from 'littlejsengine';
import { createShaderProgram } from './shaderUtils.ts';

export class PostProcessLayer {
  private shaderProgram: WebGLProgram | null = null;
  initialized: boolean = false;
  bloomThreshold: number = 0.9;
  bloomIntensity: number = 1.0;

  glPostTexture: WebGLTexture;

  public loaded: Promise<void>;


  constructor() {
    this.loaded = this.init();
  }

  private async init() {
    this.shaderProgram = await createShaderProgram(glContext, 'shaders/vertex300.glsl', 'shaders/postProcess.glsl');

    if (!this.shaderProgram) {
      console.error("Failed to create shader program.");
    }

    // @ts-ignore
    this.glPostTexture = glCreateTexture(undefined);

    console.log("PostProcessLayer: Initialized");
    this.initialized = true;
  }

  render() {
    if (!this.shaderProgram) return;

    glFlush(); // clear out the buffer
    mainContext.drawImage(glCanvas, 0, 0); // copy to the main canvas


    // Use the shader program for the offscreen context
    glContext.useProgram(this.shaderProgram);

    // Set uniforms for resolution and camera position
    const textureLocation = glContext.getUniformLocation(this.shaderProgram, 'u_texture');
    const resolutionLocation = glContext.getUniformLocation(this.shaderProgram, 'u_resolution');
    const bloomThresholdLocation = glContext.getUniformLocation(this.shaderProgram, 'u_bloomThreshold');
    const bloomIntensityLocation = glContext.getUniformLocation(this.shaderProgram, 'u_bloomIntensity');

    if (textureLocation) {
      glContext.uniform1i(textureLocation, 0);
    }

    if (resolutionLocation) {
      glContext.uniform2f(resolutionLocation, mainCanvas.width, mainCanvas.height);
    }

    if (bloomThresholdLocation) {
      glContext.uniform1f(bloomThresholdLocation, this.bloomThreshold);
    }

    if (bloomIntensityLocation) {
      glContext.uniform1f(bloomIntensityLocation, this.bloomIntensity);
    }

    // Define the vertex positions for a full-canvas quad
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);

    // Set up buffer and attributes for the vertex shader
    const buffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, buffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, vertices, glContext.STATIC_DRAW);
    const positionLocation = glContext.getAttribLocation(this.shaderProgram, 'a_position');
    glContext.enableVertexAttribArray(positionLocation);
    glContext.vertexAttribPointer(positionLocation, 2, glContext.FLOAT, false, 0, 0);

    // set textures, pass in the 2d canvas and gl canvas in separate texture channels
    glContext.activeTexture(glContext.TEXTURE0);
    glContext.bindTexture(glContext.TEXTURE_2D, this.glPostTexture);
    glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, glContext.RGBA, glContext.UNSIGNED_BYTE, mainCanvas);

    glContext.clear(glContext.COLOR_BUFFER_BIT);
    glContext.drawArrays(glContext.TRIANGLES, 0, 6);
  }
}
