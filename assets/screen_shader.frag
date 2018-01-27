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
    
    // get colour
    vec3 col = vec3(0);
    float e = 0.001;
    col.rgb -= texture2D(uSampler, uv+vec2(-e*sin(uTime*1.11),-e* sin(uTime*1.12))).rgb;
    col.rgb -= texture2D(uSampler, uv+vec2( e*sin(uTime*1.18),-e* sin(uTime*1.17))).rgb;
    col.rgb -= texture2D(uSampler, uv+vec2(-e*sin(uTime*1.15), e* sin(uTime*1.16))).rgb;
    col.rgb -= texture2D(uSampler, uv+vec2( e*sin(uTime*1.14), e* sin(uTime*1.13))).rgb;

    col.rgb *= 0.25;
    col.rgb += texture2D(uSampler, uv).rgb*2.0;

    uv /= uScreenSize;
    uv *= uBufferSize;

    col.b += rand(uv+vec2(uTime))/10.0*(1.0-uv.y);

  
    col *= 16.0;
    col = floor(col);
    col /= 16.0;

    // output
	gl_FragColor = vec4(col, 1.0);
}