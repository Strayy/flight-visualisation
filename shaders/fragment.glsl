uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform float blendFactor;

varying vec2 vUv;

void main() {
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    
    gl_FragColor = mix(nightColor, dayColor, blendFactor);
}



// uniform sampler2D globeTexture;
// varying vec2 vertexUV;
// varying vec3 vertexNormal;

// void main() {
//     float intensity = 1.05 - dot(vertexNormal, vec3(0, 0, 1));
//     vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);

//     gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz, 1);
// }