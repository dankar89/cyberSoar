#version 300 es

precision highp float;

uniform sampler2D u_texture; // Scene texture
uniform vec2 u_resolution;
uniform float u_bloomThreshold; // Brightness threshold for bloom
uniform float u_bloomIntensity; // Intensity of the bloom effect

out vec4 fragColor; // Declare output variable for fragment color

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

    // Add square vinette effect
    float vinette = 1.0 - pow(length(uv - 0.5), 1.0);
    finalColor *= vinette;

    fragColor = vec4(finalColor, 1.0); // Write final color to output
}