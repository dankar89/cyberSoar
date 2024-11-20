
export async function loadShaderSource(url: string): Promise<string> {
  const response = await fetch(url);
  return await response.text();
}

export async function createShaderProgram(gl: WebGLRenderingContext, vertexUrl: string, fragmentUrl: string): Promise<WebGLProgram | null> {
  const vertexSource = await loadShaderSource(vertexUrl);
  const fragmentSource = await loadShaderSource(fragmentUrl);

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (vertexShader && fragmentShader && program) {
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error('Shader program failed to link:', gl.getProgramInfoLog(program));
          return null;
      }
      return program;
  }
  return null;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
  }
  return shader;
}
