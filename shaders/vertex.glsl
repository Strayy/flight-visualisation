varying vec2 vertexUV;
void main() {
  vertexUV = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}



// uniform sampler2D displacementMap;

// varying vec2 vertexUV;
// varying vec3 vertexNormal;

// void main() {
//     vertexUV = uv;
//     vec4 displacement = texture2D(displacementMap, uv);
//     vec3 newPosition = position + normal * displacement.r * 0.99;

//     vertexNormal = normalize(normalMatrix * normal);

//     gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
// }