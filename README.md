# Fluid Dynamics Simulation

A real-time fluid dynamics simulation using Three.js based on Jos Stam's "Stable Fluids" paper. This interactive web application visualizes fluid behavior using WebGL.

## Features

- Real-time 2D fluid simulation
- Interactive fluid disturbance with mouse drag
- Beautiful visualization using Three.js and WebGL shaders
- Physically-based simulation using the Navier-Stokes equations

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

## How It Works

The simulation is based on the following core components:

1. **Advection**: Transport of density and velocity through the fluid
2. **Diffusion**: Viscous spreading of the fluid properties
3. **Projection**: Ensuring mass conservation (incompressibility)

The implementation follows Jos Stam's approach to stable fluid simulations, which uses a semi-Lagrangian advection scheme and a Jacobi iteration for the pressure solver.

## Controls

- **Mouse drag**: Add force and dye to the fluid
- **R key**: Reset the simulation

## Technical Details

- Grid size: 256×256
- Visualization: WebGL shaders via Three.js
- Implemented using ES6 JavaScript modules
- Cross-platform: Run on Windows, Mac, or Linux with a single command

## References

- Jos Stam's "Stable Fluids" paper (1999)
- GPU Gems Chapter 38: Fast Fluid Dynamics Simulation on the GPU 