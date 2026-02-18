const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 80;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const db = new sqlite3.Database(path.join(__dirname, 'omkar.db'));

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, message TEXT, date TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)");
    // INSERT OR IGNORE ile her baslatmada tekrar eklenmesin
    db.run("INSERT OR IGNORE INTO admins (username, password) VALUES ('admin', 'admin123')");
});

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

    const stmt = db.prepare("INSERT INTO messages (name, email, phone, message, date) VALUES (?, ?, ?, ?, ?)");
    const date = new Date().toLocaleString('tr-TR');
    stmt.run(name, email, phone, message, date, function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Veritabani hatasi.' });
        res.json({ success: true, message: 'Mesajiniz basariyla gonderildi. En kisa surede donus yapacagiz.' });
    });
    stmt.finalize();
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: 'Sunucu hatasi.' });
        if (row) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Hatali kullanici adi veya sifre.' });
        }
    });
});

app.get('/api/admin/messages', (req, res) => {
    const auth = req.headers['x-admin-auth'];
    if (auth !== 'omkar-admin-2026') {
        return res.status(403).json({ success: false, message: 'Yetkisiz erisim.' });
    }
    db.all("SELECT * FROM messages ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Veritabani hatasi.' });
        res.json(rows);
    });
});

app.delete('/api/admin/messages/:id', (req, res) => {
    const auth = req.headers['x-admin-auth'];
    if (auth !== 'omkar-admin-2026') {
        return res.status(403).json({ success: false, message: 'Yetkisiz erisim.' });
    }
    db.run("DELETE FROM messages WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Silinemedi.' });
        res.json({ success: true });
    });
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
