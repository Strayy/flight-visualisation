import * as THREE from "three";
// import vertexShader from "../shaders/vertex.glsl";
// import fragmentShader from "../shaders/fragment.glsl";

import atmosphereVertex from "../shaders/atmosphereVertex.glsl";
import atmosphereFragment from "../shaders/atmosphereFragment.glsl";

import airportsData from "../data/airports.json";
import routesData from "../data/routes.json";

// Scene and Camera Config
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    1000
);

// Renderer Config
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Create Group to Hold Elements
const group = new THREE.Group();

// Create Globe
const dayTexture = new THREE.TextureLoader().load(
    "../data/earth_uv_map_day.jpg"
);
// const nightTexture = new THREE.TextureLoader().load(
//     "../data/earth_uv_map_night.jpeg"
// );

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(15, 64, 32),
    new THREE.MeshStandardMaterial({
        map: dayTexture, // new THREE.TextureLoader().load("../data/earth_uv_map_day.jpg"),
        // alphaMap: nightTexture,
        // alphaTest: 0,
        displacementMap: new THREE.TextureLoader().load(
            "../data/earth_displacement_map.jpg"
        ),
        blending: THREE.AdditiveBlending,
        displacementScale: 1,
    })
);

// Create Globe Atmosphere
const globeAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(15, 64, 32),
    new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
    })
);
globeAtmosphere.scale.set(1.1, 1.1, 1.1);
scene.add(globeAtmosphere);

// Add Lines
const flightRouteCount = 250;
const sphereRadius = 16;
const colorsArray = [
    0xd71f1f, 0xe13c32, 0xffd300, 0x7bb661, 0x639853, 0x006b3d,
];
for (var i = 0; i < flightRouteCount; i++) {
    const depCoords = airportsData[routesData[i].depAirport];
    const arrCoords = airportsData[routesData[i].arrAirport];

    const color = colorsArray[Math.floor(i / (flightRouteCount / 6))];

    function latLongToVector3(lat, lon, radius) {
        const phi = ((90 - lat) * Math.PI) / 180; // Convert latitude to radians
        const theta = ((lon + 180) * Math.PI) / 180; // Convert longitude to radians

        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        return new THREE.Vector3(x, y, z);
    }

    const pointStart = latLongToVector3(
        depCoords[0],
        depCoords[1],
        sphereRadius
    );
    const pointEnd = latLongToVector3(arrCoords[0], arrCoords[1], sphereRadius);

    spot(pointStart);
    spot(pointEnd);

    const zeroPoint = new THREE.Vector3();

    function spot(point) {
        const s = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 32, 24),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
            })
        );
        s.position.copy(point);
        group.add(s);
    }

    const lineStart = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([zeroPoint, pointStart]),
        new THREE.LineBasicMaterial({
            color: 0xffffff,
        })
    );
    group.add(lineStart);
    const lineEnd = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([zeroPoint, pointEnd]),
        new THREE.LineBasicMaterial({
            color: 0xffffff,
        })
    );
    group.add(lineEnd);

    const newArc = setArc3D(pointStart, pointEnd, 50, false);
    group.add(newArc);

    function setArc3D(pointStart, pointEnd, smoothness, clockWise) {
        // calculate normal
        const cb = new THREE.Vector3(),
            ab = new THREE.Vector3(),
            normal = new THREE.Vector3();
        cb.subVectors(new THREE.Vector3(), pointEnd);
        ab.subVectors(pointStart, pointEnd);
        cb.cross(ab);
        normal.copy(cb).normalize();

        // get angle between vectors
        const angle = pointStart.angleTo(pointEnd);
        if (clockWise) angle = angle - Math.PI * 2;
        const angleDelta = angle / (smoothness - 1);

        const pts = [];
        for (var i = 0; i < smoothness; i++) {
            pts.push(pointStart.clone().applyAxisAngle(normal, angleDelta * i));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(pts);

        const arc = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
                color,
            })
        );
        return arc;
    }
}

// Add Lighting
const lightingObject = new THREE.Object3D();
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 0, 0);
directionalLight.castShadow = true;
lightingObject.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
lightingObject.add(ambientLight);

group.add(sphere);
group.add(lightingObject);
scene.add(group);

// Add Stars
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
});

const starVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.3) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = -Math.random() * 3000;
    starVertices.push(x, y, z);
}

starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Move Camera
camera.position.z = 40;

var mouseClick = false;
let initialMouseX = 0;
let initialMouseY = 0;
let initialGroupRotationY = 0;
let initialGroupRotationX = 0;

addEventListener("mousemove", (event) => {
    if (mouseClick) {
        const mouseX = event.clientX;
        const movementX = mouseX - initialMouseX;
        group.rotation.y =
            initialGroupRotationY + (movementX / innerWidth) * Math.PI * 2;

        const mouseY = event.clientY;
        const movementY = mouseY - initialMouseY;
        group.rotation.x =
            initialGroupRotationX + (movementY / innerHeight) * Math.PI * 2;
    }
});

addEventListener("mousedown", () => {
    mouseClick = true;
    initialMouseX = event.clientX;
    initialGroupRotationY = group.rotation.y;

    initialMouseY = event.clientY;
    initialGroupRotationX = group.rotation.x;
});

addEventListener("mouseup", () => {
    mouseClick = false;
});

setInterval(() => {
    if (group.rotation.x < -Math.PI) {
        group.rotation.x += Math.PI;
    }

    if (group.rotation.x > Math.PI) {
        group.rotation.x -= Math.PI;
    }

    if (group.rotation.x > 0.003) {
        group.rotation.x = group.rotation.x * 0.99;
    } else if (group.rotation.x < -0.03) {
        group.rotation.x = group.rotation.x * 0.99;
    } else {
        group.rotation.x = 0;
    }
}, 50);

function animate() {
    requestAnimationFrame(animate);

    // Rotating the Earth
    group.rotation.y += 0.00125;
    lightingObject.rotation.y += 0.005;

    renderer.render(scene, camera);
}

animate();
