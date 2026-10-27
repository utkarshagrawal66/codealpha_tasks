const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Never run in production with the insecure dev fallback secret
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ SECRET_KEY is required in production – aborting server start.');
        process.exit(1);
    }
    console.warn('⚠️  SECRET_KEY not set – using insecure dev fallback. Set SECRET_KEY before deploying.');
}

// Configure Multer (Memory Storage) with size + type limits
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file), false);
        }
    }
});

// Use the new DB Adapter
const db = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 4242;

// Middleware
// Allow specific origins in production; default to open CORS only in dev.
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
    : (process.env.NODE_ENV === 'production' ? [] : '*');
app.use(cors({
    origin: Array.isArray(allowedOrigins) && allowedOrigins.length === 0 ? false : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Vite/React bundles are same-origin; no inline scripts.
            scriptSrc: ["'self'"],
            // React inline style attributes + Tailwind + Google Fonts stylesheet.
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            styleSrcAttr: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            // Product images live on Cloudinary; hero image is external; placeholders are data URIs.
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            // API calls are same-origin (relative /api paths).
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
        },
    },
}));
app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' }
});

// --- Group buying helpers ---
// Group discount applies only once a group is complete (all members joined).
const groupDiscountPercent = (size) => (Number(size) === 5 ? 10 : Number(size) === 2 ? 5 : 0);

const GROUP_WORDS = [
    'LAMP', 'LUMEN', 'NEST', 'NOVA', 'ORBIT', 'QUILL', 'RIVER', 'SAHARA',
    'TAIGA', 'ULYSSES', 'VALLEY', 'WINTER', 'YODA', 'ZEPHYR', 'ALPHA', 'BETA',
    'CRYSTAL', 'DUSK', 'EMBER', 'FROST', 'GLACIER', 'HARBOR', 'ISLAND', 'JUNGLE',
    'KITE', 'LAGOON', 'MEADOW', 'NORTH', 'OCEAN', 'PEBBLE', 'QUARTZ', 'RAINBOW',
    'SUMMIT', 'TUNDRA', 'UPHILL', 'VIOLET', 'WINDOW', 'XYLON', 'YELLOW', 'ZEBRA',
    'AURORA', 'BRIDGE', 'COMET', 'DOLPHIN', 'ECLIPSE', 'FALCON', 'GARDEN', 'HORIZON'
];

const generateGroupCode = async () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let code;
    do {
        code = `${pick(GROUP_WORDS)}-${pick(GROUP_WORDS)}-${Math.floor(100 + Math.random() * 900)}`;
    } while (await db.get('SELECT id FROM group_orders WHERE code = ?', [code]));
    return code;
};

// Loads discount eligibility per product for a user: only groups that are full
// AND have not already been used in one of this user's orders qualify.
// Returns { product_id: { size, group_id } }.
const getFullGroupDiscountsByProduct = async (userId) => {
    const rows = await db.all(`
        SELECT go.product_id, go.size, go.id AS group_id
        FROM group_members gm
        JOIN group_orders go ON go.id = gm.group_id
        LEFT JOIN group_order_usage u ON u.group_id = go.id AND u.user_id = gm.user_id
        WHERE gm.user_id = ? AND go.status = 'full' AND u.id IS NULL
    `, [userId]);
    const byProduct = {};
    for (const r of rows) byProduct[r.product_id] = { size: r.size, group_id: r.group_id };
    return byProduct;
};

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Initialize Database Tables
db.init();

// Seed Admin User
const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@shopnest.com';
        const user = await db.get("SELECT * FROM users WHERE email = ?", [adminEmail]);
        if (!user) {
            const hashedPassword = await bcrypt.hash('123@admin', 10);
            await db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
                ['Admin', adminEmail, hashedPassword, 'admin']
            );
            console.log('Admin account seeded');
        }
    } catch (e) {
        console.error('Failed to seed admin:', e);
    }
};
seedAdmin();

// --- Middleware ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, async () => {
        try {
            const user = await db.get("SELECT role FROM users WHERE id = ?", [req.user.id]);
            if (!user || user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
            next();
        } catch (e) {
            res.sendStatus(500);
        }
    });
};

// --- API Routes ---

// Register
app.post('/api/register', authLimiter, async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Please enter your name' });
    }
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Only allow registration with well-known email providers
    const allowedDomains = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
        'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'mail.com',
        'yandex.com', 'gmx.com', 'fastmail.com', 'tutanota.com',
        'yahoo.co.in', 'rediffmail.com', 'msn.com', 'example.com', 'test.com', 'shopnest.com'
    ];
    const emailDomain = email.split('@')[1].toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
        return res.status(400).json({ error: 'Please use a valid email from a recognized provider (e.g., Gmail, Yahoo, Outlook)' });
    }

    // Always user by default
    const role = 'user';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            [name.trim(), email.trim(), hashedPassword, role]
        );
        const token = jwt.sign({ id: result.lastID, email, role }, SECRET_KEY, { expiresIn: '24h' });
        res.status(201).json({
            token,
            user: { id: result.lastID, name: name.trim(), email, role }
        });
    } catch (e) {
        console.error("Registration Error:", e);
        if (e.message && e.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login
app.post('/api/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    try {
        const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (e) {
        console.error("Login Error:", e);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Get Products (Public) — includes real order count
app.get('/api/products', async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS total_orders
            FROM products p
            LEFT JOIN order_items oi ON oi.product_id = p.id
            GROUP BY p.id
        `);
        res.json(rows);
    } catch (e) {
        console.error('Failed to fetch products:', e);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get Single Product (Public) — includes real order count
app.get('/api/products/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid product id' });
    try {
        const row = await db.get(`
            SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS total_orders
            FROM products p
            LEFT JOIN order_items oi ON oi.product_id = p.id
            WHERE p.id = ?
            GROUP BY p.id
        `, [id]);
        if (!row) return res.sendStatus(404);
        res.json(row);
    } catch (e) {
        console.error('Failed to fetch product:', e);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// --- ADMIN PRODUCTS APIs ---

// Upload Image
app.post('/api/upload', verifyAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    try {
        // Upload to Cloudinary using stream
        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'shopnest_products' },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.write(buffer);
                stream.end();
            });
        };

        const result = await streamUpload(req.file.buffer);
        res.json({ url: result.secure_url });
    } catch (e) {
        console.error('Cloudinary Upload Error:', e);
        res.status(500).json({ error: 'Image upload failed' });
    }
});

// Create Product
app.post('/api/products', verifyAdmin, async (req, res) => {
    const { name, description, price, image, images } = req.body;
    if (!name || !description || price === undefined || price === null || price === '') {
        return res.status(400).json({ error: 'Name, description and price are required' });
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Product name is required' });
    }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ error: 'Price must be a valid non-negative number' });
    }
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([image]);
    try {
        const result = await db.run(
            `INSERT INTO products (name, description, price, reviews, image, images) VALUES (?, ?, ?, 0, ?, ?)`,
            [name.trim(), description, numericPrice, image, imagesJson]
        );
        res.json({ success: true, id: result.lastID });
    } catch (e) {
        console.error('Create product error:', e);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update Product
app.put('/api/products/:id', verifyAdmin, async (req, res) => {
    const { name, description, price, image, images } = req.body;
    if (!name || !description || price === undefined || price === null || price === '') {
        return res.status(400).json({ error: 'Name, description and price are required' });
    }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ error: 'Price must be a valid non-negative number' });
    }
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([image]);
    try {
        const result = await db.run(
            `UPDATE products SET name = ?, description = ?, price = ?, image = ?, images = ? WHERE id = ?`,
            [name.trim(), description, numericPrice, image, imagesJson, req.params.id]
        );
        if (result.changes === 0) return res.sendStatus(404);
        res.json({ success: true });
    } catch (e) {
        console.error('Update product error:', e);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete Product
app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
        const result = await db.run(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        if (result.changes === 0) return res.sendStatus(404);
        res.json({ success: true });
    } catch (e) {
        console.error('Delete product error:', e);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get User Profile (Protected)
app.get('/api/me', verifyToken, async (req, res) => {
    try {
        const row = await db.get(`SELECT id, name, email, role FROM users WHERE id = ?`, [req.user.id]);
        if (!row) return res.sendStatus(404);
        res.json(row);
    } catch (e) {
        res.sendStatus(500);
    }
});

// --- Wishlist APIs ---

// Get Wishlist
app.get('/api/wishlist', verifyToken, async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT p.*, w.id as wishlist_id 
            FROM wishlist_items w 
            JOIN products p ON w.product_id = p.id 
            WHERE w.user_id = ?
        `, [req.user.id]);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Add to Wishlist
app.post('/api/wishlist', verifyToken, async (req, res) => {
    const { productId } = req.body;
    try {
        const result = await db.run(`INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)`,
            [req.user.id, productId]
        );
        res.json({ success: true, id: result.lastID });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Remove from Wishlist
app.delete('/api/wishlist/:productId', verifyToken, async (req, res) => {
    const { productId } = req.params;
    try {
        await db.run(`DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?`,
            [req.user.id, productId]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// --- Cart APIs ---

// Get Cart — each item includes its authoritative discount % (0 once the
// group's discount has already been consumed by this user's order).
app.get('/api/cart', verifyToken, async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT p.*, c.quantity, c.id as cart_item_id
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.user.id]);
        const discByProduct = await getFullGroupDiscountsByProduct(req.user.id);
        const items = rows.map(r => ({
            ...r,
            discount_percent: discByProduct[r.id] ? groupDiscountPercent(discByProduct[r.id].size) : 0
        }));
        res.json(items);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Add/Update Cart Item
app.post('/api/cart', verifyToken, async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        const row = await db.get(`SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`, [req.user.id, productId]);

        if (row) {
            const newQuantity = row.quantity + quantity;
            await db.run(`UPDATE cart_items SET quantity = ? WHERE id = ?`, [newQuantity, row.id]);
        } else {
            await db.run(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)`,
                [req.user.id, productId, quantity]
            );
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Update Cart Quantity (Set exact)
app.put('/api/cart/:productId', verifyToken, async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    try {
        await db.run(`UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?`,
            [quantity, req.user.id, productId]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Remove from Cart
app.delete('/api/cart/:productId', verifyToken, async (req, res) => {
    const { productId } = req.params;
    try {
        await db.run(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`,
            [req.user.id, productId]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// --- Group Orders APIs ---

// Create a group: generates a reference code and adds the creator as the first member.
app.post('/api/groups', verifyToken, async (req, res) => {
    const numericProductId = parseInt(req.body?.productId, 10);
    const numericSize = parseInt(req.body?.size, 10);

    if (!Number.isInteger(numericProductId) || numericProductId <= 0) {
        return res.status(400).json({ error: 'Invalid product' });
    }
    if (numericSize !== 2 && numericSize !== 5) {
        return res.status(400).json({ error: 'Group size must be 2 or 5 people' });
    }

    try {
        const product = await db.get('SELECT id FROM products WHERE id = ?', [numericProductId]);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // A group only counts as "active" (blocking a new one) if this user has not yet
        // consumed their discount in it. Once they place an order with the discount, they
        // can start a fresh group for another round — while their old group stays intact
        // (still full) so the other members' discounts remain live.
        const existing = await db.get(`
            SELECT go.id FROM group_members gm
            JOIN group_orders go ON go.id = gm.group_id
            LEFT JOIN group_order_usage u ON u.group_id = go.id AND u.user_id = gm.user_id
            WHERE gm.user_id = ? AND go.product_id = ? AND go.status IN ('open', 'full') AND u.id IS NULL
            LIMIT 1
        `, [req.user.id, numericProductId]);
        if (existing) {
            return res.status(400).json({ error: 'You already have an active group for this product' });
        }

        const code = await generateGroupCode();
        const groupResult = await db.run(
            `INSERT INTO group_orders (code, product_id, size, status, created_by) VALUES (?, ?, ?, 'open', ?)`,
            [code, numericProductId, numericSize, req.user.id]
        );
        await db.run(`INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`, [groupResult.lastID, req.user.id]);

        res.status(201).json({
            success: true,
            group: {
                group_id: groupResult.lastID,
                code,
                product_id: numericProductId,
                size: numericSize,
                status: 'open',
                member_count: 1,
                discount_percent: 0,
                created_by: req.user.id
            }
        });
    } catch (e) {
        console.error('Failed to create group:', e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Join a group with a reference code pasted by the user.
app.post('/api/groups/join', verifyToken, async (req, res) => {
    const { code, productId } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Please paste a reference code' });
    }
    const normalized = code.trim().toUpperCase();

    try {
        const group = await db.get('SELECT * FROM group_orders WHERE code = ?', [normalized]);
        if (!group) return res.status(404).json({ error: 'Invalid group code. Check with your friend and try again.' });
        if (group.status === 'full') return res.status(400).json({ error: 'This group is already full.' });

        if (productId !== undefined && Number(group.product_id) !== Number(productId)) {
            return res.status(400).json({ error: 'This code belongs to a different product.' });
        }

        const alreadyMember = await db.get(
            `SELECT id FROM group_members WHERE group_id = ? AND user_id = ?`,
            [group.id, req.user.id]
        );
        if (alreadyMember) {
            const memberRow = await db.get(`SELECT COUNT(*) AS c FROM group_members WHERE group_id = ?`, [group.id]);
            const memberCount = Number(memberRow.c) || 0;
            return res.json({
                success: true,
                group: {
                    group_id: group.id,
                    code: group.code,
                    product_id: group.product_id,
                    size: group.size,
                    status: group.status,
                    member_count: memberCount,
                    discount_percent: group.status === 'full' ? groupDiscountPercent(group.size) : 0
                }
            });
        }

        const conflicting = await db.get(`
            SELECT go.id FROM group_members gm
            JOIN group_orders go ON go.id = gm.group_id
            WHERE gm.user_id = ? AND go.product_id = ? AND go.id != ? AND go.status IN ('open', 'full')
            LIMIT 1
        `, [req.user.id, group.product_id, group.id]);
        if (conflicting) {
            return res.status(400).json({ error: 'You already have an active group for this product' });
        }

        await db.run(`INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`, [group.id, req.user.id]);

        const memberRow = await db.get(`SELECT COUNT(*) AS c FROM group_members WHERE group_id = ?`, [group.id]);
        const memberCount = Number(memberRow.c) || 0;

        let status = group.status;
        if (memberCount >= group.size) {
            status = 'full';
            await db.run(`UPDATE group_orders SET status = 'full' WHERE id = ?`, [group.id]);
        }

        res.status(201).json({
            success: true,
            group: {
                group_id: group.id,
                code: group.code,
                product_id: group.product_id,
                size: group.size,
                status,
                member_count: memberCount,
                discount_percent: status === 'full' ? groupDiscountPercent(group.size) : 0
            }
        });
    } catch (e) {
        console.error('Failed to join group:', e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Get the user's active groups (used by the cart to apply discounts and the product page to show status).
app.get('/api/groups/my', verifyToken, async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT go.id AS group_id, go.code, go.product_id, go.size, go.status, go.created_by,
                   p.name AS product_name, p.image AS product_image,
                   (SELECT COUNT(*) FROM group_members m WHERE m.group_id = go.id) AS member_count,
                   (SELECT COUNT(*) FROM group_order_usage u WHERE u.group_id = go.id AND u.user_id = ?) AS used_count
            FROM group_members gm
            JOIN group_orders go ON go.id = gm.group_id
            LEFT JOIN products p ON p.id = go.product_id
            WHERE gm.user_id = ? AND go.status IN ('open', 'full')
            ORDER BY go.created_at DESC
        `, [req.user.id, req.user.id]);
        const groups = rows.map(r => {
            const used = Number(r.used_count) > 0;
            return {
                ...r,
                member_count: Number(r.member_count) || 0,
                used,
                // A completed group discounts only the user's first order using it.
                discount_percent: (r.status === 'full' && !used) ? groupDiscountPercent(r.size) : 0
            };
        });
        res.json(groups);
    } catch (e) {
        console.error('Failed to fetch groups:', e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Leave a group (undoes a join; deletes the group if it becomes empty, reopens it if it was full).
app.delete('/api/groups/leave', verifyToken, async (req, res) => {
    const numericGroupId = parseInt(req.body?.groupId, 10);
    if (!Number.isInteger(numericGroupId) || numericGroupId <= 0) {
        return res.status(400).json({ error: 'Invalid group' });
    }

    try {
        const membership = await db.get(
            `SELECT id FROM group_members WHERE group_id = ? AND user_id = ?`,
            [numericGroupId, req.user.id]
        );
        if (!membership) return res.status(404).json({ error: 'You are not a member of this group' });

        await db.run(`DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, [numericGroupId, req.user.id]);

        const remaining = await db.get(`SELECT COUNT(*) AS c FROM group_members WHERE group_id = ?`, [numericGroupId]);
        const remainingCount = Number(remaining.c) || 0;

        if (remainingCount === 0) {
            await db.run(`DELETE FROM group_orders WHERE id = ?`, [numericGroupId]);
        } else {
            await db.run(`UPDATE group_orders SET status = 'open' WHERE id = ?`, [numericGroupId]);
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Failed to leave group:', e);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// --- Orders APIs ---

// Create Order from the user's cart.
// NOTE: Payment is not integrated yet — this endpoint is the intended
// creation path once checkout is wired up (currently the UI shows a stub).
app.post('/api/orders', verifyToken, async (req, res) => {
    try {
        const items = await db.all(`
            SELECT p.id, p.price, c.quantity
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.user.id]);

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty' });
        }

        // Apply group discounts: a completed (full) group lowers the unit price, but each
        // group can discount a given user's order only once (see group_order_usage).
        const discByProduct = await getFullGroupDiscountsByProduct(req.user.id);
        const pricedItems = items.map(item => {
            const discount = discByProduct[item.id] || null;
            const discountPercent = discount ? groupDiscountPercent(discount.size) : 0;
            return {
                ...item,
                group_id: discount ? discount.group_id : null,
                discount_percent: discountPercent,
                unit_price: Math.round(item.price * (100 - discountPercent) / 100)
            };
        });

        const total = pricedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

        const orderResult = await db.run(
            `INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'placed')`,
            [req.user.id, total]
        );
        const orderId = orderResult.lastID;

        for (const item of pricedItems) {
            await db.run(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
                [orderId, item.id, item.quantity, item.unit_price]
            );
            // Consume the group discount for this user so their next order is at full price.
            if (item.group_id) {
                await db.run(
                    `INSERT OR IGNORE INTO group_order_usage (group_id, user_id, order_id) VALUES (?, ?, ?)`,
                    [item.group_id, req.user.id, orderId]
                );
            }
        }

        await db.run(`DELETE FROM cart_items WHERE user_id = ?`, [req.user.id]);

        res.status(201).json({
            success: true,
            order: {
                id: orderId,
                total,
                items: items.length,
                status: 'placed'
            }
        });
    } catch (e) {
        console.error('Failed to create order:', e);
        res.status(500).json({ error: 'Failed to create order. Please try again.' });
    }
});

// Global error handler (multer + unexpected errors)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large. Maximum size is 5MB.'
            : err.code === 'LIMIT_UNEXPECTED_FILE'
                ? 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.'
                : `Upload error: ${err.message}`;
        return res.status(400).json({ error: msg });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

if (process.env.VERCEL) {
    // When deployed on Vercel, export the app as a serverless function
    module.exports = app;
} else {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
