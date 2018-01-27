precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform float uTime;

uniform vec2 uScreenSize;
uniform vec2 uBufferSize;

uniform float horizon;
uniform float angle;

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
    
    float horizon = horizon + sin(uv.x*3.0+uTime)*0.05;
    float range = (1.0-horizon)*0.02;
    float sky = smoothstep(horizon+range, horizon-range, uv.y) + sin(uTime/2.0+uv.y*7.0+uv.x*11.0)*0.1 + sin(uTime*1.1+uv.y*3.0+uv.x*10.0)*0.1;
    
    uv.y -= horizon;
    uv.y /= (1.0 - horizon);
    uv.x += -0.25 + uv.y*0.25;

    vec3 skyCol = vec3(0.5,0.5,1.0);
    vec3 groundCol = vec3(0);
    vec3 roadCol = vec3(rand(uv + vec2(0.0, uTime))/10.0);
    vec3 stripeCol = vec3(1.0,1.0,0.0);
    vec3 sideCol = vec3(0.5,1.0,0.5);

    float a = angle;
    float roadPersp = uv.y*2.0;// * mix(distance(uv.x,angle),1.0,0.25) * 10.0;
    float roadAngle = abs(uv.x-mix(0.5,angle,0.5)) - roadPersp;
    float far = 0.01 + sin(uTime)*0.01;
    groundCol = mix(sideCol, roadCol, step(roadAngle, far));
    groundCol = mix(groundCol, stripeCol, step((roadAngle+roadPersp) * 20.0 - roadPersp, far) * step(fract(pow(1.0-uv.y, 3.0)*2.0+uTime*4.0), 0.5)-0.1);
    col.rgb = mix(groundCol, skyCol, sky);
    // col.rgb += 1.0-distance(uv, vec2(angle,horizon));
    // col.rgb = vec3(uv.x-angle, -(uv.x-angle), 0);
    // col.rgb = vec3(roadPersp);

    // output
	gl_FragColor = vec4(col, 1.0);
}