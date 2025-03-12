import * as THREE from 'three';

export class FluidSimulation {
    constructor(size, scene) {
        this.size = size;
        this.scene = scene;
        
        // Simulation parameters - moved to a params object for easier GUI integration
        this.params = {
            // Time and physics
            dt: 0.1,                // Time step
            diffusion: 0.0001,      // Diffusion rate
            viscosity: 0.000001,    // Viscosity
            iterations: 4,          // Solver iterations
            densityDissipation: 0.99, // How quickly density fades
            velocityDissipation: 0.99, // How quickly velocity fades
            
            // Force parameters
            forceMultiplier: 10,   // Multiplier for mouse force
            forceRadius: size / 20, // Radius of force effect
            
            // Visualization
            showVelocity: false,    // Toggle velocity visualization
            velocityColor: 0xFF0000, // Color for velocity visualization
            densityColor1: 0x2155CD, // Deep blue
            densityColor2: 0x0AA1DD, // Light blue
            backgroundOpacity: 0.0,  // Background opacity
            fluidOpacity: 1.0       // Fluid opacity multiplier
        };
        
        // Initialize grid arrays
        this.reset();
        
        // Create the visualization
        this.createVisualization();
    }
    
    reset() {
        const N = this.size;
        
        // Velocity fields (u = x component, v = y component)
        this.u = new Float32Array(N * N);
        this.v = new Float32Array(N * N);
        this.u_prev = new Float32Array(N * N);
        this.v_prev = new Float32Array(N * N);
        
        // Density field
        this.density = new Float32Array(N * N);
        this.density_prev = new Float32Array(N * N);
        
        // Add random initial density for visual interest
        for (let i = 0; i < N * N; i++) {
            if (Math.random() < 0.001) {
                this.density[i] = Math.random() * 50 + 50;
            }
        }
    }
    
    // Helper to get 1D index from 2D coordinates
    IX(x, y) {
        const N = this.size;
        return Math.floor(x) + Math.floor(y) * N;
    }
    
    createVisualization() {
        const N = this.size;
        
        // Create a data texture from the density field
        this.texture = new THREE.DataTexture(
            this.density,
            N,
            N,
            THREE.RedFormat,
            THREE.FloatType
        );
        this.texture.needsUpdate = true;
        
        // Create a data texture for velocity field
        this.velocityTexture = new THREE.DataTexture(
            new Float32Array(N * N * 3),  // RGB for x,y components and magnitude
            N,
            N,
            THREE.RGBFormat,
            THREE.FloatType
        );
        this.velocityTexture.needsUpdate = true;
        
        // Custom shader material to visualize the fluid
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_fluid: { value: this.texture },
                u_velocity: { value: this.velocityTexture },
                u_color1: { value: new THREE.Color(this.params.densityColor1) },
                u_color2: { value: new THREE.Color(this.params.densityColor2) },
                u_velocity_color: { value: new THREE.Color(this.params.velocityColor) },
                u_show_velocity: { value: this.params.showVelocity },
                u_background_opacity: { value: this.params.backgroundOpacity },
                u_fluid_opacity: { value: this.params.fluidOpacity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D u_fluid;
                uniform sampler2D u_velocity;
                uniform vec3 u_color1;
                uniform vec3 u_color2;
                uniform vec3 u_velocity_color;
                uniform bool u_show_velocity;
                uniform float u_background_opacity;
                uniform float u_fluid_opacity;
                varying vec2 vUv;
                
                void main() {
                    float density = texture2D(u_fluid, vUv).r;
                    vec3 color;
                    float alpha;
                    
                    if (u_show_velocity) {
                        vec3 vel = texture2D(u_velocity, vUv).rgb;
                        float velMagnitude = vel.b;
                        
                        // Mix velocity visualization with density
                        color = mix(
                            mix(u_color1, u_color2, density / 100.0),
                            u_velocity_color,
                            velMagnitude * 5.0
                        );
                        
                        alpha = max(velMagnitude * 2.0, density / 50.0) * u_fluid_opacity;
                    } else {
                        color = mix(u_color1, u_color2, density / 100.0);
                        alpha = (density / 50.0) * u_fluid_opacity;
                    }
                    
                    // Add background opacity
                    alpha = max(alpha, u_background_opacity);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true
        });
        
        // Create a plane geometry that fills the viewport
        const aspect = window.innerWidth / window.innerHeight;
        const planeWidth = Math.max(1, aspect) * 1000;
        const planeHeight = Math.max(1, 1 / aspect) * 1000;
        
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        this.plane = new THREE.Mesh(geometry, material);
        this.scene.add(this.plane);
    }
    
    updateVisualizationUniforms() {
        const material = this.plane.material;
        
        // Update color uniforms
        material.uniforms.u_color1.value.set(this.params.densityColor1);
        material.uniforms.u_color2.value.set(this.params.densityColor2);
        material.uniforms.u_velocity_color.value.set(this.params.velocityColor);
        
        // Update visibility uniforms
        material.uniforms.u_show_velocity.value = this.params.showVelocity;
        material.uniforms.u_background_opacity.value = this.params.backgroundOpacity;
        material.uniforms.u_fluid_opacity.value = this.params.fluidOpacity;
    }
    
    resize(width, height) {
        const aspect = width / height;
        const planeWidth = Math.max(1, aspect) * 1000;
        const planeHeight = Math.max(1, 1 / aspect) * 1000;
        
        this.plane.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    }
    
    addForce(x, y, amountX, amountY) {
        const N = this.size;
        
        // Scale coordinates to grid space
        const gridX = Math.floor(((x + window.innerWidth / 2) / window.innerWidth) * N);
        const gridY = Math.floor(((y + window.innerHeight / 2) / window.innerHeight) * N);
        
        // Apply the force multiplier
        amountX *= this.params.forceMultiplier;
        amountY *= this.params.forceMultiplier;
        
        // Add velocity at the point
        const radius = this.params.forceRadius;
        
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const d = Math.sqrt(i * i + j * j);
                if (d > radius) continue;
                
                const influence = 1 - (d / radius);
                
                const px = Math.min(N - 1, Math.max(0, gridX + i));
                const py = Math.min(N - 1, Math.max(0, gridY + j));
                
                const idx = this.IX(px, py);
                
                this.u[idx] += amountX * influence;
                this.v[idx] += amountY * influence;
                
                // Add some density for visualization
                this.density[idx] += 100 * influence;
            }
        }
    }
    
    update() {
        this.velocityStep();
        this.densityStep();
        
        // Update the texture with new density values
        this.texture.needsUpdate = true;
        
        // Update velocity visualization texture if enabled
        if (this.params.showVelocity) {
            this.updateVelocityTexture();
        }
    }
    
    updateVelocityTexture() {
        const N = this.size;
        const data = this.velocityTexture.image.data;
        
        for (let j = 0; j < N; j++) {
            for (let i = 0; i < N; i++) {
                const idx = this.IX(i, j);
                const dataIdx = (i + j * N) * 3;
                
                const u = this.u[idx];
                const v = this.v[idx];
                const magnitude = Math.sqrt(u * u + v * v);
                
                // Store u, v, and magnitude in RGB
                data[dataIdx] = u;
                data[dataIdx + 1] = v;
                data[dataIdx + 2] = magnitude;
            }
        }
        
        this.velocityTexture.needsUpdate = true;
    }
    
    velocityStep() {
        const N = this.size;
        const visc = this.params.viscosity;
        const dt = this.params.dt;
        
        // Diffuse velocity
        this.diffuse(1, this.u_prev, this.u, visc, dt);
        this.diffuse(2, this.v_prev, this.v, visc, dt);
        
        // Project to ensure mass conservation
        this.project(this.u_prev, this.v_prev, this.u, this.v);
        
        // Advect velocity
        this.advect(1, this.u, this.u_prev, this.u_prev, this.v_prev, dt);
        this.advect(2, this.v, this.v_prev, this.u_prev, this.v_prev, dt);
        
        // Project again
        this.project(this.u, this.v, this.u_prev, this.v_prev);
        
        // Apply velocity dissipation
        const dissipation = this.params.velocityDissipation;
        for (let i = 0; i < N * N; i++) {
            this.u[i] *= dissipation;
            this.v[i] *= dissipation;
        }
    }
    
    densityStep() {
        const N = this.size;
        const diff = this.params.diffusion;
        const dt = this.params.dt;
        
        // Diffuse density
        this.diffuse(0, this.density_prev, this.density, diff, dt);
        
        // Advect density
        this.advect(0, this.density, this.density_prev, this.u, this.v, dt);
        
        // Apply density dissipation
        const dissipation = this.params.densityDissipation;
        for (let i = 0; i < N * N; i++) {
            this.density[i] *= dissipation;
        }
    }
    
    // Core fluid simulation functions based on Jos Stam's paper
    diffuse(b, x, x0, diffusion, dt) {
        const N = this.size;
        const iterations = this.params.iterations;
        const a = dt * diffusion * (N - 2) * (N - 2);
        
        for (let k = 0; k < iterations; k++) {
            for (let j = 1; j < N - 1; j++) {
                for (let i = 1; i < N - 1; i++) {
                    x[this.IX(i, j)] = 
                        (x0[this.IX(i, j)] + 
                         a * (x[this.IX(i+1, j)] + x[this.IX(i-1, j)] +
                              x[this.IX(i, j+1)] + x[this.IX(i, j-1)])) / (1 + 4 * a);
                }
            }
            this.setBoundary(b, x);
        }
    }
    
    project(velocX, velocY, p, div) {
        const N = this.size;
        const iterations = this.params.iterations;
        
        // Calculate divergence
        for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
                div[this.IX(i, j)] = -0.5 * (
                    velocX[this.IX(i+1, j)] - velocX[this.IX(i-1, j)] +
                    velocY[this.IX(i, j+1)] - velocY[this.IX(i, j-1)]
                ) / N;
                p[this.IX(i, j)] = 0;
            }
        }
        this.setBoundary(0, div);
        this.setBoundary(0, p);
        
        // Solve pressure Poisson equation
        for (let k = 0; k < iterations; k++) {
            for (let j = 1; j < N - 1; j++) {
                for (let i = 1; i < N - 1; i++) {
                    p[this.IX(i, j)] = (div[this.IX(i, j)] + 
                                       p[this.IX(i+1, j)] + p[this.IX(i-1, j)] +
                                       p[this.IX(i, j+1)] + p[this.IX(i, j-1)]) / 4;
                }
            }
            this.setBoundary(0, p);
        }
        
        // Apply pressure gradient
        for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
                velocX[this.IX(i, j)] -= 0.5 * (p[this.IX(i+1, j)] - p[this.IX(i-1, j)]) * N;
                velocY[this.IX(i, j)] -= 0.5 * (p[this.IX(i, j+1)] - p[this.IX(i, j-1)]) * N;
            }
        }
        this.setBoundary(1, velocX);
        this.setBoundary(2, velocY);
    }
    
    advect(b, d, d0, velocX, velocY, dt) {
        const N = this.size;
        
        for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
                let x = i - dt * N * velocX[this.IX(i, j)];
                let y = j - dt * N * velocY[this.IX(i, j)];
                
                if (x < 0.5) x = 0.5;
                if (x > N - 1.5) x = N - 1.5;
                
                if (y < 0.5) y = 0.5;
                if (y > N - 1.5) y = N - 1.5;
                
                const i0 = Math.floor(x);
                const i1 = i0 + 1;
                const j0 = Math.floor(y);
                const j1 = j0 + 1;
                
                const s1 = x - i0;
                const s0 = 1 - s1;
                const t1 = y - j0;
                const t0 = 1 - t1;
                
                d[this.IX(i, j)] = 
                    s0 * (t0 * d0[this.IX(i0, j0)] + t1 * d0[this.IX(i0, j1)]) +
                    s1 * (t0 * d0[this.IX(i1, j0)] + t1 * d0[this.IX(i1, j1)]);
            }
        }
        this.setBoundary(b, d);
    }
    
    setBoundary(b, x) {
        const N = this.size;
        
        // Set vertical boundary conditions
        for (let j = 1; j < N - 1; j++) {
            x[this.IX(0, j)] = b === 1 ? -x[this.IX(1, j)] : x[this.IX(1, j)];
            x[this.IX(N-1, j)] = b === 1 ? -x[this.IX(N-2, j)] : x[this.IX(N-2, j)];
        }
        
        // Set horizontal boundary conditions
        for (let i = 1; i < N - 1; i++) {
            x[this.IX(i, 0)] = b === 2 ? -x[this.IX(i, 1)] : x[this.IX(i, 1)];
            x[this.IX(i, N-1)] = b === 2 ? -x[this.IX(i, N-2)] : x[this.IX(i, N-2)];
        }
        
        // Set corner points
        x[this.IX(0, 0)] = 0.5 * (x[this.IX(1, 0)] + x[this.IX(0, 1)]);
        x[this.IX(0, N-1)] = 0.5 * (x[this.IX(1, N-1)] + x[this.IX(0, N-2)]);
        x[this.IX(N-1, 0)] = 0.5 * (x[this.IX(N-2, 0)] + x[this.IX(N-1, 1)]);
        x[this.IX(N-1, N-1)] = 0.5 * (x[this.IX(N-2, N-1)] + x[this.IX(N-1, N-2)]);
    }
} 