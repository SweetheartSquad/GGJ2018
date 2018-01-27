precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform float uTime;

uniform vec2 uScreenSize;
uniform vec2 uBufferSize;

// glsl rand one-liner
// https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
void main(void){
    vec2 uv = vTextureCoord.xy;
    uv /= uScreenSize;
    uv *= uBufferSize;
    rand(vec2(uTime));
    // get colour
    vec3 col = texture2D(uSampler, uv).rgb;
    
    float horizon = 0.5;
    float sky = step(uv.y, horizon);
    
    uv.y -= horizon;
    uv.y /= (1.0 - horizon);

    vec3 skyCol = vec3(0.5,0.5,1.0);
    vec3 groundCol = vec3(0);
    vec3 roadCol = vec3(rand(uv + vec2(0.0, uTime))/10.0);
    vec3 stripeCol = vec3(1.0,1.0,0.0);
    vec3 sideCol = vec3(0.5,1.0,0.5);
    groundCol = mix(sideCol, roadCol, step(abs(uv.x-0.5)-uv.y, 0.1));
    groundCol = mix(groundCol, stripeCol, step(abs(uv.x-0.5)*20.0-uv.y, 0.1) * step(fract(pow(1.0-uv.y, 3.0)*2.0+uTime*4.0), 0.5));
    col.rgb = mix(groundCol, skyCol, sky);

    // output
	gl_FragColor = vec4(col, 1.0);
}