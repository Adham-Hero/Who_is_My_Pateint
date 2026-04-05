const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- الإعدادات الأساسية ---
app.use(cors()); 
app.use(express.json()); 

// خدمت ملفات الواجهة الأمامية من المجلد الرئيسي
app.use(express.static(path.join(__dirname, '/')));

// --- 1. الاتصال بـ MongoDB Atlas ---
const dbURI = 'mongodb+srv://adham612199:A_h61219975@cluster0.ybubu9q.mongodb.net/HospitalDB?retryWrites=true&w=majority';

// تحسين الاتصال لبيئة Serverless (إضافة خيارات الاستقرار)
mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    createDefaultUsers(); 
})
.catch(err => {
    console.error("❌ Connection error:", err.message);
});

// --- 2. تعريف الموديلات (Models) ---
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

// --- 3. مسارات تسجيل الدخول ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, role: user.role });
        } else {
            res.status(401).json({ success: false, message: "بيانات الدخول خاطئة" });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- 4. مسارات المرضى (محدثة لتتوافق مع لوحة التحكم) ---

// جلب مريض واحد بالرقم القومي
app.get('/api/patient/:id', async (req, res) => {
    try {
        const patient = await Patient.findOne({ nationalId: req.params.id });
        if (patient) res.json({ success: true, data: patient });
        else res.status(404).json({ success: false, message: "غير موجود" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// جلب قائمة كل المرضى (مهم جداً للوحة التحكم)
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ _id: -1 });
        res.json({ success: true, data: patients });
    } catch (err) { res.status(500).json({ success: false }); }
});

// إضافة مريض جديد
app.post('/api/patients', async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// حذف مريض (مهم جداً للوحة التحكم)
app.delete('/api/patient/:id', async (req, res) => {
    try {
        await Patient.findOneAndDelete({ nationalId: req.params.id });
        res.json({ success: true, message: "تم الحذف" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- 5. وظيفة إنشاء مستخدمين افتراضيين ---
async function createDefaultUsers() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({ username: 'admin', password: '123', role: 'admin' });
            console.log("👥 Default admin created");
        }
    } catch (err) {}
}

// --- 6. معالجة الصفحات (Frontend fallback) ---
// هذا السطر يضمن أنه عند كتابة رابط الصفحة مباشرة، يتم توجيه المتصفح لملف الـ HTML الصحيح
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// التشغيل المحلي
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
}

module.exports = app;
