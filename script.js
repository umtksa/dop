import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Setup Scene
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#111113');
scene.fog = new THREE.Fog('#111113', 10, 40); // Simulate grid fade

// 2. Setup Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 25);

// 3. Setup Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// 4. Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight1.position.set(10, 20, 10);
dirLight1.castShadow = true;
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-10, 5, -10);
scene.add(dirLight2);

// 5. Objects
const material = new THREE.MeshStandardMaterial({ 
    color: 0x00ffcc, 
    roughness: 0.3, 
    metalness: 0.2 
});

// Main Box
const box1Geometry = new THREE.BoxGeometry(2.4, 2.4, 2.4);
const box1 = new THREE.Mesh(box1Geometry, material);
box1.position.set(-1.5, 1.2, -1);
box1.rotation.set(0, Math.PI / 6, 0);
box1.castShadow = true;
box1.receiveShadow = true;
scene.add(box1);

// Group
const group = new THREE.Group();
group.position.set(1.2, 0, 1.2);
group.rotation.set(0, -Math.PI / 4, 0);
scene.add(group);

const box2Geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const box2 = new THREE.Mesh(box2Geometry, material);
box2.position.set(0, 0.75, 0);
box2.castShadow = true;
box2.receiveShadow = true;
group.add(box2);

const box3Geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const box3 = new THREE.Mesh(box3Geometry, material);
box3.position.set(0, 1.9, 0);
box3.castShadow = true;
box3.receiveShadow = true;
group.add(box3);

// GridHelper
const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
gridHelper.position.y = -0.01;
scene.add(gridHelper);

// 6. Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 60;
controls.minDistance = 5;
controls.maxPolarAngle = Math.PI;
controls.minPolarAngle = 0;

// 7. Prompt Logic
function generatePrompt(rotation, tilt, distance) {
    const tiltDeg = Math.round(tilt);
    const rotDeg = Math.round(rotation);
    const parts = [];

    if (tiltDeg >= 75) parts.push("bird's eye view");
    else if (tiltDeg <= -75) parts.push("extreme worm's eye view");
    else if (tiltDeg > 10) parts.push(`rotate camera ${tiltDeg} degrees high`);
    else if (tiltDeg < -10) parts.push(`rotate camera ${Math.abs(tiltDeg)} degrees worm's eye`);
    else parts.push("eye level view");

    if (distance < 15) parts.push("close frame");
    else if (distance > 40) parts.push("far frame");
    else parts.push("medium frame");

    if (rotDeg !== 0) {
        if (Math.abs(rotDeg) === 180) {
            parts.push("180 degrees directly behind");
        } else {
            parts.push(`${Math.abs(rotDeg)} degrees ${rotDeg > 0 ? 'right' : 'left'}`);
        }
    }

    const prompt = parts.join(", ") + ".";
    return prompt.charAt(0).toUpperCase() + prompt.slice(1);
}

// UI Interaction
const promptTextEl = document.getElementById('prompt-text');
const copyContainer = document.getElementById('copy-container');

let currentPrompt = "";
let isCopied = false;
let copyTimeout;

function updateAngles() {
    const polar = controls.getPolarAngle();
    const azimuth = controls.getAzimuthalAngle();
    const dist = controls.getDistance();

    const tiltDeg = (Math.PI / 2 - polar) * (180 / Math.PI);
    const rotDeg = azimuth * (180 / Math.PI);

    currentPrompt = generatePrompt(rotDeg, tiltDeg, dist);
    
    if (!isCopied) {
        promptTextEl.innerText = currentPrompt;
        promptTextEl.className = "text-sm md:text-base font-mono leading-relaxed tracking-wide transition-colors text-neutral-300 group-hover:text-white";
    }
}

copyContainer.addEventListener('click', () => {
    navigator.clipboard.writeText(currentPrompt).then(() => {
        isCopied = true;
        promptTextEl.innerText = "Copied to clipboard!";
        promptTextEl.className = "text-sm md:text-base font-mono leading-relaxed tracking-wide transition-colors text-[var(--color-brand-green,#00ffcc)]";
        
        clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
            isCopied = false;
            updateAngles(); // Refresh class names & text
        }, 2000);
    });
});

controls.addEventListener('change', updateAngles);
controls.update(); 
updateAngles();

// 8. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 9. Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});