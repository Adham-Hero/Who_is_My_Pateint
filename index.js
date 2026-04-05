// --- GLOBAL VARIABLES ---
let scene, camera, renderer, textMesh, starSystem;
const clock = new THREE.Clock();

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25; 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const container = document.getElementById('canvas-container');
    if (container) container.appendChild(renderer.domElement);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 5, 15);
    scene.add(keyLight);

    const fillLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(fillLight);
    
    const pointLight = new THREE.PointLight(0x0dcaf0, 1.8, 100);
    pointLight.position.set(-15, -10, 5);
    scene.add(pointLight);

    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (font) {
        const geometry = new THREE.TextGeometry('Who is my patient?', {
            font: font,
            size: 1.5,
            height: 0.5,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.06,
            bevelSize: 0.04,
            bevelSegments: 5
        });
        geometry.center();
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x0dcaf0, shininess: 150 });
        textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.y = 8;
        scene.add(textMesh);
    });

    const starCount = 12000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starPositions[i] = (Math.random() - 0.5) * 250;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8 });
    starSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(starSystem);
}

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    if (textMesh) {
        textMesh.rotation.y += 0.003;
        textMesh.position.y = 8 + Math.sin(elapsedTime * 0.5) * 1;
    }
    if (starSystem) {
        starSystem.rotation.y += 0.0004;
    }
    renderer.render(scene, camera);
}

// --- TILT EFFECT ---
const tiltContainer = document.getElementById('tilt-container');
if (tiltContainer) {
    tiltContainer.addEventListener('mousemove', (e) => {
        const rect = tiltContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((centerY - y) / centerY) * 12;
        const rotateY = ((x - centerX) / centerX) * 12;
        tiltContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    tiltContainer.addEventListener('mouseleave', () => {
        tiltContainer.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
}

// --- SEARCH LOGIC ---
async function validateSearch() {
    const input = document.getElementById('patientID').value.trim();
    const loadingSpinner = document.getElementById('loading-spinner');
    
    if (input.length === 14 && /^\d+$/.test(input)) {
        try {
            if(loadingSpinner) loadingSpinner.style.display = 'block';
            
            // طلب البيانات من السيرفر
            const response = await fetch(`/api/patient/${input}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "المريض غير مسجل");
            }

            const result = await response.json();
            if (result.success) {
                localStorage.setItem('tempPatientData', JSON.stringify(result.data));
                window.location.href = "patient_report.html"; 
            }
        } catch (err) {
            showError(err.message === "Failed to fetch" ? "السيرفر غير متصل!" : err.message);
        } finally {
            if(loadingSpinner) loadingSpinner.style.display = 'none';
        }
    } else {
        showError("يرجى إدخال 14 رقماً صحيحاً.");
    }
}

// تشغيل البحث عند الضغط على Enter
document.getElementById('patientID')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validateSearch();
});

function showError(msg) {
    const errorPopup = document.getElementById('error-popup');
    const errorText = document.getElementById('error-message');
    if (errorPopup && errorText) {
        errorText.innerText = msg;
        errorPopup.style.display = 'block';
        setTimeout(closeError, 5000);
    }
}

function closeError() {
    const errorPopup = document.getElementById('error-popup');
    if (errorPopup) errorPopup.style.display = 'none';
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initThree();
animate();
