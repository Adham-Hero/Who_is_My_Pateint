const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ضروري لخدمة ملفات HTML/CSS/JS

const app = express();

// --- الإعدادات الأساسية ---
app.use(cors()); 
app.use(express.json()); 

// خدمة الملفات الثابتة (لضمان ظهور صفحة الـ HTML عند فتح الرابط)
app.use(express.static(path.join(__dirname, '/')));

// --- 1. الاتصال بـ MongoDB Atlas ---
const dbURI = 'mongodb+srv://adham612199:A_h61219975@cluster0.ybubu9q.mongodb.net/HospitalDB?retryWrites=true&w=majority';

// تحسين الاتصال ليتناسب مع بيئة Vercel
mongoose.connect(dbURI)
    .then(() => {
        console.log("✅ Successfully connected to MongoDB Atlas!");
        createDefaultUsers(); 
    })
    .catch(err => {
        console.error("❌ Connection error detail:", err.message);
    });

// --- 2. تعريف الموديلات (Models) ---

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

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
    },
    profileUrl: String 
});
const Patient = mongoose.model('Patient', patientSchema, 'patients');

// --- 3. المسارات (Routes) ---

// مسار تسجيل الدخول
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
        res.status(500).json({ success: false, message: "خطأ في السيرفر الداخلي" });
    }
});

// إضافة مريض
app.post('/api/patients', async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json({ success: true, message: "تم إضافة المريض بنجاح" });
    } catch (err) {
        res.status(400).json({ success: false, message: "فشل إضافة المريض، تأكد من الرقم القومي" });
    }
});

// جلب كل المرضى
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ _id: -1 });
        res.json({ success: true, data: patients });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// البحث عن مريض محدد
app.get('/api/patient/:id', async (req, res) => {
    try {
        const patient = await Patient.findOne({ nationalId: req.params.id });
        if (patient) {
            res.json({ success: true, data: patient });
        } else {
            res.status(404).json({ success: false, message: "المريض غير موجود" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: "خطأ في الاتصال بالقاعدة" });
    }
});

// حذف مريض
app.delete('/api/patient/:id', async (req, res) => {
    try {
        const result = await Patient.findOneAndDelete({ nationalId: req.params.id });
        if (result) {
            res.json({ success: true, message: "تم حذف سجل المريض بنجاح" });
        } else {
            res.status(404).json({ success: false, message: "المريض غير موجود بالفعل" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// توجيه أي طلب آخر لصفحة index.html (ضروري لـ Vercel)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 4. وظيفة إنشاء مستخدمين افتراضيين ---
async function createDefaultUsers() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({ username: 'admin', password: '123', role: 'admin' });
            await User.create({ username: 'user1', password: '456', role: 'user' });
            console.log("👥 Default users created");
        }
    } catch (err) {
        console.error("❌ Error creating users:", err.message);
    }
}

// --- 5. تشغيل السيرفر وتصديره ---
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server is flying on https://who-is-my-pateint.vercel.app`);
    });
}

module.exports = app; // ضروري جداً لـ Vercel
