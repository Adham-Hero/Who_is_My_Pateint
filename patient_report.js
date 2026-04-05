        // --- تهيئة Three.js للخلفية المتحركة ---
        const canvas = document.querySelector('#bg-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // إنشاء جزيئات (Particles)
        const particlesGeometry = new THREE.BufferGeometry();
        const count = 1500;
        const positions = new Float32Array(count * 3);

        for(let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 50;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x0dcaf0,
            transparent: true,
            opacity: 0.4
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        camera.position.z = 15;

        // تحريك الخلفية مع الماوس ببطء
        let mouseX = 0;
        let mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) - 0.5;
            mouseY = (e.clientY / window.innerHeight) - 0.5;
        });

        function animate() {
            requestAnimationFrame(animate);
            particlesMesh.rotation.y += 0.001;
            particlesMesh.rotation.x += 0.0005;
            
            // تحريك الكاميرا بناءً على الماوس لتأثير Parallax
            camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
            camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // --- كود تعبئة البيانات (المنطق السابق) ---
        const patientData = JSON.parse(localStorage.getItem('tempPatientData'));

        if (patientData) {
            document.getElementById('p-name').innerText = patientData.name;
            document.getElementById('p-id').innerText = patientData.nationalId;
            document.getElementById('p-age').innerText = patientData.age + " سنة";
            document.getElementById('p-phone').innerText = patientData.phone;
            document.getElementById('p-address').innerText = patientData.address;
            document.getElementById('p-family-count').innerText = patientData.familyCount;
            document.getElementById('p-family-history').innerText = patientData.familyHistory;
            document.getElementById('p-visits').innerText = patientData.medicalHistory.visitsCount;

            const surgDiv = document.getElementById('p-surgeries');
            if(patientData.medicalHistory.surgeries.length > 0) {
                surgDiv.innerHTML = patientData.medicalHistory.surgeries.map(s => `<span class="medical-badge">${s}</span>`).join('');
            } else { surgDiv.innerText = "لا يوجد سجل عمليات"; }

            const chronicDiv = document.getElementById('p-chronic');
            if(patientData.medicalHistory.chronicDiseases.length > 0) {
                chronicDiv.innerHTML = patientData.medicalHistory.chronicDiseases.map(d => `<span class="medical-badge" style="border-color:#ffc107; color:#ffc107; background:rgba(255,193,7,0.1)">${d}</span>`).join('');
            } else { chronicDiv.innerText = "لا يوجد أمراض مزمنة"; }

            const medsDiv = document.getElementById('p-meds');
            if(patientData.medicalHistory.medications.length > 0) {
                medsDiv.innerHTML = patientData.medicalHistory.medications.map(m => `<div class="med-list-item">🔹 ${m}</div>`).join('');
            } else { medsDiv.innerText = "لا يتم تناول أدوية حالياً"; }

            document.getElementById('report-date').innerText = "توليد: " + new Date().toLocaleDateString('ar-EG');
        } else {
            window.location.href = "User.html";
        }

        