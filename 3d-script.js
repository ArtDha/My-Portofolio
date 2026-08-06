import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('3d-container');

// 1. SCENE SETUP
const scene = new THREE.Scene();

// Because container is display:none initially, clientWidth is 0. 
// We use hardcoded dimensions matching the CSS width (250px) and height (350px).
const width = 250;
const height = 350;

// Camera setup
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
camera.position.set(0, 1.5, 5);

// Renderer setup (alpha: true makes the background transparent)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
// Important: this prevents the canvas from blocking pointer events incorrectly if not styled right
renderer.domElement.style.outline = 'none';
container.appendChild(renderer.domElement);

// 2. LIGHTING
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffeedd, 0.8);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

// 3. LOAD 3D MODEL
let modelGroup = new THREE.Group();
scene.add(modelGroup);

// Try to load user's GLB model from the injected Base64 string
const loader = new GLTFLoader();
loader.load(
    typeof MODEL_B64 !== 'undefined' ? MODEL_B64 : 'model.glb', // Gunakan Base64 agar anti-CORS
    function (gltf) {
        // Jika berhasil load 3D, sembunyikan gambar 2D dan tampilkan canvas 3D
        document.getElementById('char-img-fallback').style.display = 'none';
        container.style.display = 'block';
        
        const model = gltf.scene;
        // Center and scale the model automatically
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim; // Scale to fit nicely
        
        model.scale.set(scale, scale, scale);
        model.position.sub(center.multiplyScalar(scale)); // Center it
        model.position.y += 1; // Lift it slightly
        
        modelGroup.add(model);
        
        // --- PRELOADER SYNC ---
        window.assetsLoaded.threeD = true;
        if (typeof window.checkAllLoaded === 'function') window.checkAllLoaded();
    },
    undefined,
    function (error) {
        console.warn('GLB Model not found or blocked by CORS. Using 2D image fallback instead.');
        // --- PRELOADER SYNC (Even on error, we must release the loading screen) ---
        window.assetsLoaded.threeD = true;
        if (typeof window.checkAllLoaded === 'function') window.checkAllLoaded();
    }
);

// 4. ORBIT CONTROLS (Rotation only)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false; // Disable zooming so scrolling the page isn't blocked
controls.enablePan = false; // Disable panning
// Lock vertical rotation (pitch) so it only spins left/right (yaw)
controls.minPolarAngle = Math.PI / 2; // 90 degrees
controls.maxPolarAngle = Math.PI / 2;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 5. PHYSICS (Pendulum Swaying on Drag)
let swayAngleX = 0; // Rotation around X axis (pitch swaying)
let swayAngleZ = 0; // Rotation around Z axis (roll swaying)
let angularVelocityX = 0;
let angularVelocityZ = 0;

const springForce = 0.05; // How strongly it pulls back to center
const damping = 0.90; // How quickly the swing dies down
const sensitivity = 0.002; // How much mouse movement affects the swing

function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    // Read velocity from global window object (set by script.js)
    if (window.isCharDragging) {
        // Apply mouse movement velocity to angular velocity
        const dx = window.charDragVelocityX || 0;
        const dy = window.charDragVelocityY || 0;
        
        // Sway Z (left/right roll) based on X movement
        angularVelocityZ += dx * sensitivity;
        
        // Sway X (forward/back pitch) based on Y movement
        angularVelocityX += dy * sensitivity;
        
        // Reset the read values so they don't compound infinitely
        window.charDragVelocityX = 0;
        window.charDragVelocityY = 0;
    }
    
    // Apply pendulum physics
    angularVelocityX -= swayAngleX * springForce;
    angularVelocityZ -= swayAngleZ * springForce;
    
    angularVelocityX *= damping;
    angularVelocityZ *= damping;
    
    swayAngleX += angularVelocityX;
    swayAngleZ += angularVelocityZ;
    
    // Apply the angles to the model group (simulate hanging from a pin)
    modelGroup.rotation.x = swayAngleX;
    modelGroup.rotation.z = -swayAngleZ; // Negative so it swings opposite to movement direction

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    if(container.clientWidth > 0 && container.clientHeight > 0) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});

animate();
