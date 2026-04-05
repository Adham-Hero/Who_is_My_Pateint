const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- الإعدادات الأساسية ---
app.use(cors()); 
app.use(express.json()); 

// خدمة ملفات الواجهة الأمامية (Frontend) من المجلد الرئيسي
app.use(express.static(path.join(__dirname, '/')));

// --- 1. الاتصال بـ MongoDB Atlas ---
const dbURI = 'mongodb+srv://adham612199:A_h61219975@cluster0.ybubu9q.mongodb.net/HospitalDB?retryWrites=true&w=majority';

// خيارات الاتصال لضمان الاستقرار في بيئة المطور و Vercel
mongoose.connect(dbURI)
    .then(() => {
        console.log("✅ Successfully connected to MongoDB Atlas!");
        createDefaultUsers(); 
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err.message);
    });

// --- 2. تعريف الموديلات (Models) ---
// استخدام mongoose.models لتجنب خطأ إعادة تعريف الموديل عند التحديث التلقائي (Hot Reload)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const patientSchema = new mongoose.Schema({
    nationalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: Number,
    address: String,
    phone: String,
    familyCount: { type: Number, default: 0 },
    familyHistory: { type: String, default: "لا يوجد تاريخ مسجل" },
    medicalHistory: {
        surgeries: { type: [String], default: [] },
        chronicDiseases: { type: [String], default: [] },
        medications: { type: [String], default: [] },
        visitsCount: { type: Number, default: 0 }
    }
});
const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema, 'patients');

// --- 3. مسارات تسجيل الدخول (Authentication) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ 
                success: true, 
                role: user.role,
                message: "تم تسجيل الدخول بنجاح" 
            });
        } else {
            res.status(401).json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "خطأ في السيرفر" });
    }
});

// --- 4. مسارات المرضى (Patients API) ---

// جلب كل المرضى
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ _id: -1 });
        res.json({ success: true, data: patients });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// جلب مريض واحد بالرقم القومي
app.get('/api/patient/:id', async (req, res) => {
    try {
        const patient = await Patient.findOne({ nationalId: req.params.id });
        if (patient) res.json({ success: true, data: patient });
        else res.status(404).json({ success: false, message: "المريض غير موجود" });
    } catch (err) {
        res.status(500).json({ success: false, error: "خطأ في قاعدة البيانات" });
    }
});

// إضافة مريض جديد
app.post('/api/patients', async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json({ success: true, message: "تمت الإضافة بنجاح" });
    } catch (err) {
        res.status(400).json({ success: false, message: "فشل الإضافة: الرقم القومي مسجل مسبقاً" });
    }
});

// حذف مريض
app.delete('/api/patient/:id', async (req, res) => {
    try {
        const result = await Patient.findOneAndDelete({ nationalId: req.params.id });
        if (result) res.json({ success: true, message: "تم الحذف بنجاح" });
        else res.status(404).json({ success: false, message: "السجل غير موجود" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- 5. تهيئة المستخدمين الافتراضيين ---
async function createDefaultUsers() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({ username: 'admin', password: '123', role: 'admin' });
            await User.create({ username: 'user1', password: '456', role: 'user' });
            console.log("👥 Default Accounts Created: (admin/123) & (user1/456)");
        }
    } catch (err) {
        console.error("❌ Error creating users:", err.message);
    }
}

// --- 6. التعامل مع صفحات الـ Frontend ---
// توجيه أي مسار غير معرف في الـ API إلى الصفحة الرئيسية (index.html)
app.get('*', (req, res) => {
    // تأكد من أن ملف index.html موجود في نفس المجلد
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 7. تشغيل السيرفر ---
const PORT = process.env.PORT || 3000;

// التحقق مما إذا كان الملف يعمل محلياً أو كـ Function (لـ Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is flying on http://localhost:${PORT}`);
    });
}

module.exports = app;
