import * as THREE from 'three';
import { GUI } from 'dat.gui';
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

// Set up GUI with parameter controls
const gui = new GUI();
gui.width = 300;

// Physics parameters folder
const physicsFolder = gui.addFolder('Physics');
physicsFolder.add(simulation.params, 'dt', 0.01, 0.5).name('Time Step').onChange(onParamChange);
physicsFolder.add(simulation.params, 'diffusion', 0.000001, 0.001).name('Diffusion').onChange(onParamChange);
physicsFolder.add(simulation.params, 'viscosity', 0.000001, 0.01).name('Viscosity').onChange(onParamChange);
physicsFolder.add(simulation.params, 'iterations', 1, 20, 1).name('Solver Iterations').onChange(onParamChange);
physicsFolder.add(simulation.params, 'densityDissipation', 0.9, 1.0).name('Density Persistence').onChange(onParamChange);
physicsFolder.add(simulation.params, 'velocityDissipation', 0.9, 1.0).name('Velocity Persistence').onChange(onParamChange);
physicsFolder.open();

// Interaction parameters folder
const interactionFolder = gui.addFolder('Interaction');
interactionFolder.add(simulation.params, 'forceMultiplier', 1, 50).name('Force Strength').onChange(onParamChange);
interactionFolder.add(simulation.params, 'forceRadius', 1, 50).name('Force Radius').onChange(onParamChange);
interactionFolder.open();

// Visualization parameters folder
const visualFolder = gui.addFolder('Visualization');
visualFolder.add(simulation.params, 'showVelocity').name('Show Velocity Field').onChange(onParamChange);
visualFolder.addColor(simulation.params, 'densityColor1').name('Color 1').onChange(onParamChange);
visualFolder.addColor(simulation.params, 'densityColor2').name('Color 2').onChange(onParamChange);
visualFolder.addColor(simulation.params, 'velocityColor').name('Velocity Color').onChange(onParamChange);
visualFolder.add(simulation.params, 'backgroundOpacity', 0, 1).name('Background Opacity').onChange(onParamChange);
visualFolder.add(simulation.params, 'fluidOpacity', 0, 2).name('Fluid Opacity').onChange(onParamChange);
visualFolder.open();

// Add presets folder
const presetsFolder = gui.addFolder('Presets');
presetsFolder.add({ preset: 'Water' }, 'preset').onChange(() => applyPreset('water'));
presetsFolder.add({ preset: 'Smoke' }, 'preset').onChange(() => applyPreset('smoke'));
presetsFolder.add({ preset: 'Fire' }, 'preset').onChange(() => applyPreset('fire'));
presetsFolder.add({ preset: 'Oil' }, 'preset').onChange(() => applyPreset('oil'));
presetsFolder.open();

// Function to handle parameter changes
function onParamChange() {
    simulation.updateVisualizationUniforms();
}

// Function to apply parameter presets
function applyPreset(type) {
    switch (type) {
        case 'water':
            simulation.params.diffusion = 0.0001;
            simulation.params.viscosity = 0.000001;
            simulation.params.densityDissipation = 0.99;
            simulation.params.velocityDissipation = 0.99;
            simulation.params.densityColor1 = 0x2155CD;
            simulation.params.densityColor2 = 0x0AA1DD;
            simulation.params.showVelocity = false;
            break;
        case 'smoke':
            simulation.params.diffusion = 0.0003;
            simulation.params.viscosity = 0.000001;
            simulation.params.densityDissipation = 0.995;
            simulation.params.velocityDissipation = 0.98;
            simulation.params.densityColor1 = 0x222222;
            simulation.params.densityColor2 = 0x999999;
            simulation.params.showVelocity = false;
            break;
        case 'fire':
            simulation.params.diffusion = 0.0005;
            simulation.params.viscosity = 0.0000005;
            simulation.params.densityDissipation = 0.97;
            simulation.params.velocityDissipation = 0.995;
            simulation.params.densityColor1 = 0xFF5500;
            simulation.params.densityColor2 = 0xFFDD00;
            simulation.params.showVelocity = false;
            break;
        case 'oil':
            simulation.params.diffusion = 0.00005;
            simulation.params.viscosity = 0.0005;
            simulation.params.densityDissipation = 0.999;
            simulation.params.velocityDissipation = 0.98;
            simulation.params.densityColor1 = 0x332200;
            simulation.params.densityColor2 = 0x996600;
            simulation.params.showVelocity = false;
            break;
    }
    
    // Update the GUI controllers
    updateGUIControllers();
    
    // Update visualization uniforms
    simulation.updateVisualizationUniforms();
}

// Function to update GUI controllers with new values
function updateGUIControllers() {
    // Update all controllers to reflect parameter changes
    for (let i = 0; i < gui.__controllers.length; i++) {
        gui.__controllers[i].updateDisplay();
    }
    // Also update controllers in folders
    for (const folder in gui.__folders) {
        for (let i = 0; i < gui.__folders[folder].__controllers.length; i++) {
            gui.__folders[folder].__controllers[i].updateDisplay();
        }
    }
}

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
        const forceX = (mouse.x - prevMouse.x);
        const forceY = (mouse.y - prevMouse.y);
        simulation.addForce(mouse.x, mouse.y, forceX, forceY);
    }
    
    prevMouse.copy(mouse);
});

// Touch interaction for mobile devices
window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    mouseDown = true;
    updateTouchPosition(event);
    prevMouse.copy(mouse);
});

window.addEventListener('touchend', (event) => {
    event.preventDefault();
    mouseDown = false;
});

window.addEventListener('touchmove', (event) => {
    event.preventDefault();
    updateTouchPosition(event);
    
    if (mouseDown) {
        const forceX = (mouse.x - prevMouse.x);
        const forceY = (mouse.y - prevMouse.y);
        simulation.addForce(mouse.x, mouse.y, forceX, forceY);
    }
    
    prevMouse.copy(mouse);
});

function updateMousePosition(event) {
    mouse.x = (event.clientX - window.innerWidth / 2);
    mouse.y = -(event.clientY - window.innerHeight / 2);
}

function updateTouchPosition(event) {
    if (event.touches.length > 0) {
        mouse.x = (event.touches[0].clientX - window.innerWidth / 2);
        mouse.y = -(event.touches[0].clientY - window.innerHeight / 2);
    }
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