// --- GLOBAL VARIABLES ---
let scene, camera, renderer, textMesh, starSystem;
const clock = new THREE.Clock();

function initThree() {
    // 1. Scene & Camera Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25; 

    // 2. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 3. Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 5, 15);
    scene.add(keyLight);

    const fillLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(fillLight);
    
    const pointLight = new THREE.PointLight(0x0dcaf0, 1.8, 100);
    pointLight.position.set(-15, -10, 5);
    scene.add(pointLight);

    // 4. 3D Text Creation
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
        
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            specular: 0x0dcaf0,
            shininess: 150
        });
        
        textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.y = 10; 
        scene.add(textMesh);
    });

    // 5. Starfield Effect
    const starCount = 12000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
        starPositions[i] = (Math.random() - 0.5) * 250;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.12,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    starSystem = new THREE.Points(starGeometry, starMaterial);
    scene.add(starSystem);
}

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Text Floating Animation
    if (textMesh) {
        textMesh.rotation.y += 0.003;
        textMesh.position.y = 10 + Math.sin(elapsedTime * 0.5) * 1;
    }

    // Starfield Subtle Drift
    if (starSystem) {
        starSystem.rotation.y += 0.0004;
        starSystem.rotation.x += 0.0001;
    }

    renderer.render(scene, camera);
}

// --- UI INTERACTION: TILT EFFECT ---
const tiltContainer = document.getElementById('tilt-container');

if (tiltContainer) {
    tiltContainer.addEventListener('mousemove', (e) => {
        const rect = tiltContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const maxTilt = 12; 
        const rotateX = ((centerY - y) / centerY) * maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;
        
        tiltContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        tiltContainer.style.boxShadow = `${-rotateY * 1.5}px ${rotateX * 1.5}px 60px rgba(0, 0, 0, 0.7)`;
    });

    tiltContainer.addEventListener('mouseleave', () => {
        tiltContainer.style.transform = 'rotateX(0deg) rotateY(0deg)';
        tiltContainer.style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.5)';
    });
}

// --- SEARCH VALIDATION & API CALL ---
async function validateSearch() {
    const input = document.getElementById('patientID').value.trim();
    
    if (input.length === 14 && /^\d+$/.test(input)) {
        try {
            // تأكد أن الرابط هو نفس بورت السيرفر (3000)
            const response = await fetch(`http://localhost:3000/api/patient/${input}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "المريض غير مسجل");
            }

            const result = await response.json();
            
            if (result.success) {
                // تخزين البيانات كاملة
                localStorage.setItem('tempPatientData', JSON.stringify(result.data));
                // الانتقال للصفحة التي أرسلت كودها أنت
                window.location.href = "patient_report.html"; 
            }
        } catch (err) {
            // استدعاء دالة إظهار الخطأ الموجودة في index.html
            showError(err.message === "Failed to fetch" ? "السيرفر غير متصل!" : err.message);
        }
    } else {
        showError("يرجى إدخال 14 رقماً صحيحاً.");
    }
}

function showError(msg) {
    const errorPopup = document.getElementById('error-popup');
    const errorText = document.getElementById('error-message');
    if (errorPopup && errorText) {
        errorText.innerText = msg;
        errorPopup.style.display = 'block';
    }
}

function showError(msg) {
    const errorPopup = document.getElementById('error-popup');
    const errorText = document.getElementById('error-message');
    if (errorText) errorText.innerText = msg;
    errorPopup.style.display = 'block';
}

function closeError() {
    document.getElementById('error-popup').style.display = 'none';
}

// --- EVENT LISTENERS ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start Everything
initThree();
animate();

