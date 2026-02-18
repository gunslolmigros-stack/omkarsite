const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Static dosyalar için explicit route'lar
app.get('/omkar.css', (req, res) => res.sendFile(path.join(__dirname, 'omkar.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, 'script.js')));

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/omkar';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Mongoose şemaları
const messageSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String
});

const Message = mongoose.model('Message', messageSchema);
const Admin = mongoose.model('Admin', adminSchema);

// Varsayılan admin oluştur
async function createDefaultAdmin() {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
        await Admin.create({ username: 'admin', password: 'admin123' });
        console.log('Varsayılan admin oluşturuldu');
    }
}
createDefaultAdmin();

const RECAPTCHA_SECRET_KEY = '6LcPHW8sAAAAAFLro5AI6n1LawBSY69tHTYvHRom';

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message, recaptchaToken } = req.body;

    if (!name || !email || !phone || !message) {
        return res.status(400).json({ success: false, message: 'Lutfen tum alanlari doldurun.' });
    }

    if (recaptchaToken) {
        try {
            const url = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
            const recaptchaRes = await axios.post(url);
            if (!recaptchaRes.data.success) {
                return res.status(400).json({ success: false, message: 'Captcha dogrulamasi basarisiz. Lutfen tekrar deneyin.' });
            }
        } catch (e) {
            console.error('reCAPTCHA hatasi:', e.message);
        }
    }

    try {
        await Message.create({ name, email, phone, message });
        res.json({ success: true, message: 'Mesajiniz basariyla gonderildi. En kisa surede donus yapacagiz.' });
    } catch (err) {
        console.error('Mesaj kaydetme hatasi:', err);
        res.status(500).json({ success: false, message: 'Veritabani hatasi.' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username, password });
        if (admin) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Hatali kullanici adi veya sifre.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatasi.' });
    }
});

app.get('/api/admin/messages', async (req, res) => {
    const auth = req.headers['x-admin-auth'];
    if (auth !== 'omkar-admin-2026') {
        return res.status(403).json({ success: false, message: 'Yetkisiz erisim.' });
    }
    try {
        const messages = await Message.find().sort({ _id: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Veritabani hatasi.' });
    }
});

app.delete('/api/admin/messages/:id', async (req, res) => {
    const auth = req.headers['x-admin-auth'];
    if (auth !== 'omkar-admin-2026') {
        return res.status(403).json({ success: false, message: 'Yetkisiz erisim.' });
    }
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Silinemedi.' });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'omkar.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/personel-tasimaciligi', (req, res) => res.sendFile(path.join(__dirname, 'personel-tasimaciligi.html')));
app.get('/ogrenci-tasimaciligi', (req, res) => res.sendFile(path.join(__dirname, 'ogrenci-tasimaciligi.html')));
app.get('/ozel-transfer', (req, res) => res.sendFile(path.join(__dirname, 'ozel-transfer.html')));
app.get('/gezi-turlar', (req, res) => res.sendFile(path.join(__dirname, 'gezi-turlar.html')));
app.get('/hizmetler', (req, res) => res.sendFile(path.join(__dirname, 'services.html')));

app.listen(port, () => {
    console.log('Sunucu http://localhost:' + port + ' adresinde calisiyor.');
});
