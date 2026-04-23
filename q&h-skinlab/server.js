const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// 1. Logging setup
const log = (msg) => {
    console.log(`[${new Date().toISOString()}] ${msg}`);
};

log('--- SERVER STARTING ---');

// 2. Firebase Init
let firebaseConfig = null;
try {
    const configPath = path.join(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        log('Loaded firebase-applet-config.json');
    }
} catch (e) { log('Error loading config: ' + e.message); }

const hasFullAuth = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
const firebaseReady = !!(hasFullAuth || (firebaseConfig && firebaseConfig.projectId));

if (firebaseReady && admin.apps.length === 0) {
    try {
        if (hasFullAuth) {
            log('Initializing with Service Account Cert');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                }),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        } else if (firebaseConfig?.projectId) {
            log('Initializing with Project ID: ' + firebaseConfig.projectId);
            admin.initializeApp({ projectId: firebaseConfig.projectId });
        }
    } catch (e) { log('Firebase Init Error: ' + e.message); }
}

let db = null;
if (firebaseReady) {
    try {
        const { getFirestore } = require('firebase-admin/firestore');
        const dbId = firebaseConfig?.firestoreDatabaseId || '(default)';
        log(`Connecting to Firestore: ${dbId}`);
        db = getFirestore(admin.app(), dbId === '(default)' ? undefined : dbId);
        log('Firestore OK');
    } catch (e) { log('Firestore Error: ' + e.message); }
}

// 3. Express App
const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
});

const root = __dirname;
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));
app.use('/public', express.static(publicDir));

// Models / Helpers
function normalizeFirestoreValue(value) {
    if (Array.isArray(value)) return value.map(normalizeFirestoreValue);
    if (value && typeof value === 'object') {
        if (typeof value.toDate === 'function') return value.toDate().toISOString();
        const normalized = {};
        for (const [key, child] of Object.entries(value)) normalized[key] = normalizeFirestoreValue(child);
        return normalized;
    }
    return value;
}
function mapDoc(doc) {
    return { _id: doc.id, ...normalizeFirestoreValue(doc.data()) };
}

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'qh-skinlab-secret-key-2026';

// APIs
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!db) return res.status(500).json({ message: 'Database not ready' });

        // Kiểm tra user tồn tại
        const userSnap = await db.collection('users').where('email', '==', email).get();
        if (!userSnap.empty) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Tự động gán quyền Quản trị viên cho email chủ cửa hàng
        const role = email === 'abcdxyz09090808@gmail.com' ? 'Quản trị viên' : 'Khách hàng';
        
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('users').add(newUser);
        const token = jwt.sign({ 
            id: docRef.id, 
            email, 
            name, 
            isAdmin: role === 'Quản trị viên' 
        }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({ token, name, email });
    } catch (e) {
        log('Register Error: ' + e.message);
        return res.status(500).json({ message: 'Lỗi server khi đăng ký' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!db) return res.status(500).json({ message: 'Database not ready' });

        const userSnap = await db.collection('users').where('email', '==', email).get();
        if (userSnap.empty) {
            return res.status(400).json({ message: 'Tài khoản không tồn tại. Vui lòng đăng ký!' });
        }

        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();

        // Đảm bảo email chủ shop luôn có quyền Quản trị viên
        if (email === 'abcdxyz09090808@gmail.com' && userData.role !== 'Quản trị viên') {
            await userDoc.ref.update({ role: 'Quản trị viên' });
            userData.role = 'Quản trị viên';
        }

        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không chính xác' });
        }

        const token = jwt.sign({ 
            id: userDoc.id, 
            email: userData.email, 
            name: userData.name, 
            isAdmin: userData.role === 'Quản trị viên' 
        }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({ token, name: userData.name, email: userData.email });
    } catch (e) {
        log('Login Error: ' + e.message);
        return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
    }
});

app.get('/api/users/login', (req, res) => res.status(405).json({ message: 'Method Not Allowed. Use POST.' }));

app.get('/api/users/admin-check', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        
        return res.json({ status: 'ok', isAdmin: true });
    } catch (e) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        if (!db) return res.json([]);
        const snapshot = await db.collection('products').get();
        return res.json(snapshot.docs.map(mapDoc));
    } catch (e) { return res.json([]); }
});

app.get('/api/categories', async (req, res) => {
    try {
        if (!db) return res.json([]);
        const snapshot = await db.collection('categories').get();
        return res.json(snapshot.docs.map(mapDoc));
    } catch (e) { return res.json([]); }
});

app.get('/api/users', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: 'Database not ready' });
        const snapshot = await db.collection('users').get();
        const userList = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.password; // Không bao giờ gửi password ra ngoài
            return { _id: doc.id, ...data };
        });
        return res.json(userList);
    } catch (e) {
        return res.status(500).json({ message: 'Lỗi tải danh sách người dùng' });
    }
});

app.get('/api/config', (req, res) => res.json({ hotline: "1900 636 510", email: "contact@qhskinlab.com" }));

// HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));
const pages = ['index', 'admin', 'category', 'magazine', 'magazine-detail', 'product-detail'];
pages.forEach(p => {
    app.get(`/${p}`, (req, res) => res.sendFile(path.join(root, `${p}.html`)));
    app.get(`/${p}.html`, (req, res) => res.sendFile(path.join(root, `${p}.html`)));
});

const PORT = 3000;
const startServer = () => {
    const server = app.listen(PORT, '0.0.0.0', () => {
        log(`Server listening on port ${PORT}`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            log('Port 3000 in use, retrying in 2s...');
            setTimeout(() => {
                server.close();
                startServer();
            }, 2000);
        } else {
            log('Server error: ' + err.message);
        }
    });
};

startServer();
