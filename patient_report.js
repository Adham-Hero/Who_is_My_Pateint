// --- 1. Three.js Background Logic ---
const initBackground = () => {
    const canvas = document.querySelector('#bg-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);

    for(let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 50;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.04,
        color: 0x0dcaf0,
        transparent: true,
        opacity: 0.3
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 15;

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    const animate = () => {
        requestAnimationFrame(animate);
        particlesMesh.rotation.y += 0.0008;
        
        camera.position.x += (mouseX * 4 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 4 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// --- 2. Data Population Logic ---
const populateData = () => {
    const rawData = localStorage.getItem('tempPatientData');
    
    if (!rawData) {
        alert("لم يتم العثور على بيانات مريض. سيتم توجيهك لصفحة البحث.");
        window.location.href = "index.html";
        return;
    }

    const patient = JSON.parse(rawData);

    // الحقول الأساسية
    document.getElementById('p-name').innerText = patient.name || "غير مسجل";
    document.getElementById('p-id').innerText = patient.nationalId || "---";
    document.getElementById('p-id-display').innerText = patient.nationalId ? `ID-${patient.nationalId.slice(-4)}` : "NA";
    document.getElementById('p-age').innerText = (patient.age || "??") + " سنة";
    document.getElementById('p-phone').innerText = patient.phone || "---";
    document.getElementById('p-address').innerText = patient.address || "غير متوفر";
    document.getElementById('p-family-count').innerText = patient.familyCount || "0";
    document.getElementById('p-family-history').innerText = patient.familyHistory || "لا توجد ملاحظات وراثية مسجلة.";
    document.getElementById('p-visits').innerText = patient.medicalHistory?.visitsCount || "0";

    // العمليات الجراحية
    const surgDiv = document.getElementById('p-surgeries');
    const surgeries = patient.medicalHistory?.surgeries || [];
    surgDiv.innerHTML = surgeries.length > 0 
        ? surgeries.map(s => `<span class="medical-badge">✚ ${s}</span>`).join('') 
        : '<p class="text-muted small">لا يوجد سجل عمليات جراحية</p>';

    // الأمراض المزمنة
    const chronicDiv = document.getElementById('p-chronic');
    const chronic = patient.medicalHistory?.chronicDiseases || [];
    chronicDiv.innerHTML = chronic.length > 0 
        ? chronic.map(d => `<span class="medical-badge" style="border-color:#ff4d4d; color:#ff4d4d; background:rgba(255,77,77,0.1)">⚠ ${d}</span>`).join('') 
        : '<p class="text-muted small">لا توجد أمراض مزمنة مسجلة</p>';

    // الأدوية
    const medsDiv = document.getElementById('p-meds');
    const meds = patient.medicalHistory?.medications || [];
    medsDiv.innerHTML = meds.length > 0 
        ? meds.map(m => `<div class="med-list-item">💊 ${m}</div>`).join('') 
        : '<p class="text-muted small">لا توجد أدوية حالية</p>';

    // تاريخ اليوم
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('report-date').innerText = "تاريخ الاستخراج: " + new Date().toLocaleDateString('ar-EG', options);
};

// تشغيل الوظائف
initBackground();
populateData();
