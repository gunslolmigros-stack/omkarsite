const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const app = express();
// VDS üzerinde 80 portu (standart web portu) veya ortam değişkeni
const port = process.env.PORT || 80;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Database Setup
// Persistent file database instead of :memory:
// Dosya tabanlı veritabanı kullanımı (kalıcı olması için)
const db = new sqlite3.Database(path.join(__dirname, 'omkar.db'));

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, message TEXT, date TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");

    const stmt = db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
    stmt.run("admin", "admin123");
    stmt.finalize();
});

const RECAPTCHA_SECRET_KEY = '6LcPHW8sAAAAAFLro5AI6n1LawBSY69tHTYvHRom';

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message, recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.status(400).json({ success: false, message: 'Captcha doğrulaması eksik.' });
    }

    try {
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
        const recaptchaResponse = await axios.post(verificationURL);

        if (!recaptchaResponse.data.success) {
            return res.status(400).json({ success: false, message: 'Captcha doğrulaması başarısız. Lütfen tekrar deneyin.' });
        }

        const stmt = db.prepare("INSERT INTO messages (name, email, phone, message, date) VALUES (?, ?, ?, ?, ?)");
        const date = new Date().toLocaleString('tr-TR');
        stmt.run(name, email, phone, message, date, function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Veritabanı hatası.' });
            }
            res.json({ success: true, message: 'Mesajınız başarıyla gönderildi.' });
        });
        stmt.finalize();

    } catch (error) {
        console.error('Recaptcha error:', error);
        return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
        }
        if (row) {
            res.json({ success: true, message: 'Giriş başarılı.' });
        } else {
            res.status(401).json({ success: false, message: 'Hatalı kullanıcı adı veya şifre.' });
        }
    });
});

app.get('/api/admin/messages', (req, res) => {
    db.all("SELECT * FROM messages ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Veritabanı hatası.' });
        }
        res.json(rows);
    });
});

// Main Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'omkar.html'));
});

// Admin Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Service Page Routes
app.get('/personel-tasimaciligi', (req, res) => {
    console.log('Request for: /personel-tasimaciligi');
    res.sendFile(path.join(__dirname, 'personel-tasimaciligi.html'));
});

app.get('/ogrenci-tasimaciligi', (req, res) => {
    console.log('Request for: /ogrenci-tasimaciligi');
    res.sendFile(path.join(__dirname, 'ogrenci-tasimaciligi.html'));
});

app.get('/ozel-transfer', (req, res) => {
    console.log('Request for: /ozel-transfer');
    res.sendFile(path.join(__dirname, 'ozel-transfer.html'));
});

app.get('/gezi-turlar', (req, res) => {
    console.log('Request for: /gezi-turlar');
    res.sendFile(path.join(__dirname, 'gezi-turlar.html'));
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
