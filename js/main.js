import * as THREE from 'three';
import { FluidSimulation } from './fluidSimulation.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
    -window.innerWidth / 2, window.innerWidth / 2,
    window.innerHeight / 2, -window.innerHeight / 2,
    0.1, 1000
);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize fluid simulation
const GRID_SIZE = 256;
const simulation = new FluidSimulation(GRID_SIZE, scene);

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    simulation.resize(width, height);
});

// Mouse interaction
const mouse = new THREE.Vector2();
const prevMouse = new THREE.Vector2();
let mouseDown = false;

window.addEventListener('mousedown', (event) => {
    mouseDown = true;
    updateMousePosition(event);
    prevMouse.copy(mouse);
});

window.addEventListener('mouseup', () => {
    mouseDown = false;
});

window.addEventListener('mousemove', (event) => {
    updateMousePosition(event);
    
    if (mouseDown) {
        const forceX = (mouse.x - prevMouse.x) * 10;
        const forceY = (mouse.y - prevMouse.y) * 10;
        simulation.addForce(mouse.x, mouse.y, forceX, forceY);
    }
    
    prevMouse.copy(mouse);
});

function updateMousePosition(event) {
    mouse.x = (event.clientX - window.innerWidth / 2);
    mouse.y = -(event.clientY - window.innerHeight / 2);
}

// Reset simulation on 'R' keypress
window.addEventListener('keydown', (event) => {
    if (event.key === 'r' || event.key === 'R') {
        simulation.reset();
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    simulation.update();
    renderer.render(scene, camera);
}

animate(); 