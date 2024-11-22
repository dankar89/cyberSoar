#version 300 es

precision highp float;

uniform sampler2D u_texture; // Scene texture
uniform vec2 u_resolution;
uniform float u_bloomThreshold; // Brightness threshold for bloom
uniform float u_bloomIntensity; // Intensity of the bloom effect
uniform float u_time; // Time uniform for animation
uniform vec2 u_cameraPos;
out vec4 fragColor; // Declare output variable for fragment color

// Function to generate random values based on input coordinates
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Function to create smooth noise
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

    // Four corners of the cell
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

    // flip the y axis
  uv.y = 1.0 - uv.y;

    // Sample the scene texture
  vec4 color = texture(u_texture, uv);

    // Extract bright areas based on the threshold
  vec3 bright = max(color.rgb - vec3(u_bloomThreshold), vec3(0.0));

    // Approximate blur using neighboring samples
  vec3 blurred = bright;
  blurred += texture(u_texture, uv + vec2(1.0, 0.0) / u_resolution).rgb;
  blurred += texture(u_texture, uv - vec2(1.0, 0.0) / u_resolution).rgb;
  blurred += texture(u_texture, uv + vec2(0.0, 1.0) / u_resolution).rgb;
  blurred += texture(u_texture, uv - vec2(0.0, 1.0) / u_resolution).rgb;

  blurred += texture(u_texture, uv + vec2(1.0, 1.0) / u_resolution).rgb;
  blurred += texture(u_texture, uv + vec2(-1.0, 1.0) / u_resolution).rgb;
  blurred += texture(u_texture, uv + vec2(1.0, -1.0) / u_resolution).rgb;
  blurred += texture(u_texture, uv + vec2(-1.0, -1.0) / u_resolution).rgb;

  blurred /= 9.0; // Average the samples

    // Combine the blurred bloom effect with the original color
  vec3 bloom = u_bloomIntensity * blurred;
  vec3 finalColor = color.rgb + bloom;

    // Add procedural clouds
  vec2 camPos = u_cameraPos * u_resolution;
  camPos.y = u_resolution.y - camPos.y; // Flip y axis
  vec2 worldPos = (uv * u_resolution) - camPos * -0.02; // Calculate world position relative to camera
  vec2 cloudUV = (worldPos - u_cameraPos) * 0.002; // Adjust cloud position relative to camera movement
  // cloudUV.x += u_time * 0.1; // Move clouds horizontally over time
  float cloudPattern = noise(cloudUV);
  float cloud = smoothstep(0.5, 0.7, cloudPattern); // Create more defined cloud edges
    // Set cloud color
  vec3 cloudColor = vec3(0.47, 0.0, 0.59) * cloud * 0.1; // White clouds

  finalColor += cloudColor;

    // Add square vignette effect
  float vignette = 1.0 - pow(length(uv - 0.5), 1.0);
  finalColor *= vignette;

  fragColor = vec4(finalColor, 1.0); // Write final color to output
}
