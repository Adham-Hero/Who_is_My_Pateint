const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- الإعدادات الأساسية ---
app.use(cors()); 
app.use(express.json()); 

// خدمة الملفات الثابتة (ضروري لظهور الواجهة على Vercel)
// يفترض أن ملفات HTML/CSS/JS موجودة في المجلد الرئيسي للمشروع
app.use(express.static(path.join(__dirname, '/')));

// --- 1. الاتصال بـ MongoDB Atlas ---
const dbURI = 'mongodb+srv://adham612199:A_h61219975@cluster0.ybubu9q.mongodb.net/HospitalDB?retryWrites=true&w=majority';

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

// --- 3. المسارات (API Routes) ---

// تسجيل الدخول
app.post('/api/index', async (req, res) => {
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

// البحث عن مريض
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

// --- التوجيه الشامل (Catch-all Route) ---
// هذا السطر يضمن أنه عند طلب أي مسار غير موجود في الـ API، يتم إرسال صفحة index.html
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

// --- 5. تشغيل السيرفر وتصديره لـ Vercel ---
const PORT = process.env.PORT || 3000;

// ملاحظة: Vercel يستخدم module.exports لتشغيل السيرفر كدالة سحابية
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
