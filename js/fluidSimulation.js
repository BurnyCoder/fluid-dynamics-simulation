import * as THREE from 'three';

export class FluidSimulation {
    constructor(size, scene) {
        this.size = size;
        this.scene = scene;
        
        // Simulation parameters
        this.dt = 0.1;              // Time step
        this.diffusion = 0.0001;    // Diffusion rate
        this.viscosity = 0.000001;  // Viscosity
        this.iterations = 4;        // Solver iterations
        
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
        
        // Custom shader material to visualize the fluid
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_fluid: { value: this.texture },
                u_color1: { value: new THREE.Color(0x2155CD) },  // Deep blue
                u_color2: { value: new THREE.Color(0x0AA1DD) }   // Light blue
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
                uniform vec3 u_color1;
                uniform vec3 u_color2;
                varying vec2 vUv;
                
                void main() {
                    float density = texture2D(u_fluid, vUv).r;
                    vec3 color = mix(u_color1, u_color2, density / 100.0);
                    gl_FragColor = vec4(color, density / 50.0);
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
        
        // Add velocity at the point
        const radius = N / 20;
        
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
    }
    
    velocityStep() {
        const N = this.size;
        const visc = this.viscosity;
        const dt = this.dt;
        
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
    }
    
    densityStep() {
        const N = this.size;
        const diff = this.diffusion;
        const dt = this.dt;
        
        // Diffuse density
        this.diffuse(0, this.density_prev, this.density, diff, dt);
        
        // Advect density
        this.advect(0, this.density, this.density_prev, this.u, this.v, dt);
        
        // Slowly dissipate density
        for (let i = 0; i < N * N; i++) {
            this.density[i] *= 0.99;
        }
    }
    
    // Core fluid simulation functions based on Jos Stam's paper
    diffuse(b, x, x0, diffusion, dt) {
        const N = this.size;
        const iterations = this.iterations;
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
        const iterations = this.iterations;
        
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