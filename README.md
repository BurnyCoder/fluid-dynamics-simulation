# Fluid Dynamics Simulation

A real-time fluid dynamics simulation using Three.js. This interactive web application visualizes fluid behavior using WebGL.

![image](https://github.com/user-attachments/assets/3c1d1940-83d1-4962-8c4a-2cc280acd4bd)

## Online Repository

This project is available on GitHub at: https://github.com/BurnyCoder/fluid-dynamics-simulation

To clone this repository:
```bash
git clone https://github.com/BurnyCoder/fluid-dynamics-simulation.git
cd fluid-dynamics-simulation
```

## Features

- Real-time 2D fluid simulation
- Interactive fluid disturbance with mouse drag
- Beautiful visualization using Three.js and WebGL shaders
- Physically-based simulation using the Navier-Stokes equations
- Interactive control panel for tuning simulation parameters
- Preset fluid types (water, smoke, fire, oil)
- Touch support for mobile devices

## How to Run (Single Command)

Choose one of the following methods based on your preference and system:

### Method 1: Using Node.js

If you have Node.js installed:

```bash
# Install dependencies (first time only)
npm install

# Run the simulation
npm start
```

Then open your browser to http://localhost:3000

### Method 2: Using the Shell Script (Linux/Mac)

```bash
# Make sure the script is executable (first time only)
chmod +x run.sh

# Run the simulation
./run.sh
```

Then open your browser to http://localhost:3000

### Method 3: Using Batch File (Windows)

On Windows, simply double-click the `run.bat` file or run it from the command prompt:

```
run.bat
```

Then open your browser to http://localhost:3000

### Method 4: Using Python (Cross-platform)

If you prefer Python over Node.js:

```bash
# Make sure the script is executable on Linux/Mac (first time only)
chmod +x run.py

# Run the simulation
python run.py
# OR on Linux/Mac:
./run.py
```

This will automatically open your browser to http://localhost:8000

## Interactive Parameters

The simulation includes a control panel with tunable parameters, allowing you to experiment with different fluid behaviors:

### Physics Parameters

- **Time Step**: Controls the size of each simulation step (affects simulation speed)
- **Diffusion**: Controls how quickly properties spread through the fluid
- **Viscosity**: Controls the "thickness" of the fluid
- **Solver Iterations**: Higher values increase accuracy but decrease performance
- **Density Persistence**: How long density (dye) remains visible
- **Velocity Persistence**: How long velocity remains active

### Interaction Parameters

- **Force Strength**: Controls how strongly your mouse movements affect the fluid
- **Force Radius**: Controls the area of influence of your mouse movements

### Visualization Parameters

- **Show Velocity Field**: Toggle to visualize the velocity field
- **Color 1 & Color 2**: Customize the fluid's color gradient
- **Velocity Color**: Customize the color of the velocity visualization
- **Background Opacity**: Adjust the background transparency
- **Fluid Opacity**: Adjust the fluid's transparency

### Presets

Choose from predefined fluid types:
- **Water**: Default fluid with low viscosity and bluish colors
- **Smoke**: Higher diffusion with grayscale colors
- **Fire**: Lower viscosity with orange/yellow colors
- **Oil**: Higher viscosity with brown/amber colors

## How It Works

The simulation is based on the following core components:

1. **Advection**: Transport of density and velocity through the fluid
2. **Diffusion**: Viscous spreading of the fluid properties
3. **Projection**: Ensuring mass conservation (incompressibility)

The implementation follows Jos Stam's approach to stable fluid simulations, which uses a semi-Lagrangian advection scheme and a Jacobi iteration for the pressure solver.

## Controls

- **Mouse drag/touch**: Add force and dye to the fluid
- **R key**: Reset the simulation
- **Control panel**: Adjust simulation parameters in real-time

## Technical Details

- Grid size: 256×256
- Visualization: WebGL shaders via Three.js
- Implemented using ES6 JavaScript modules
- Cross-platform: Run on Windows, Mac, or Linux with a single command
- Interactive UI built with dat.GUI for parameter tuning

## References

- Jos Stam's "Stable Fluids" paper (1999)
- GPU Gems Chapter 38: Fast Fluid Dynamics Simulation on the GPU 
