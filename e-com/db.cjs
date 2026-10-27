const { createClient } = require('@libsql/client');
require('dotenv').config();

const isCloud = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

// Abort early in production if Turso env vars are missing – Vercel cannot write to SQLite.
if (process.env.NODE_ENV === 'production' && !isCloud) {
    console.error('❌ Turso credentials missing in production – aborting server start.');
    process.exit(1);
}

let db = null;
let client = null;
let dbReadyPromise = null;

// Initialize connectivity immediately but safely
if (isCloud) {
    console.log("Using Cloud Database (Turso)");
    client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    dbReadyPromise = Promise.resolve(); // Cloud client is ready on creation
} else {
    // Lazy load sqlite3 to avoid binding errors on Vercel if we aren't using it
    console.log("Using Local Database (SQLite)");
    const sqlite3 = require('sqlite3').verbose();
    dbReadyPromise = new Promise((resolve, reject) => {
        db = new sqlite3.Database('./ecommerce.db', (err) => {
            if (err) {
                console.error('DB Connection Error:', err.message);
                reject(err);
            } else {
                console.log("Local SQLite DB Connected");
                resolve();
            }
        });
    });
}

const dbAdapter = {
    // Ensure DB is ready before usage in any query
    ensureReady: async () => {
        if (!dbReadyPromise) throw new Error("Database not initialized");
        await dbReadyPromise;
    },

    // Initialize Tables
    init: async () => {
        await dbAdapter.ensureReady();

        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT,
                price INTEGER,
                reviews INTEGER,
                image TEXT,
                images TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS wishlist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            )`,
            `CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            )`,
            `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                total INTEGER,
                status TEXT DEFAULT 'placed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                unit_price INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS group_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                product_id INTEGER NOT NULL,
                size INTEGER NOT NULL,
                status TEXT DEFAULT 'open',
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS group_order_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                order_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, user_id)
            )`
        ];

        for (const query of queries) {
            await dbAdapter.run(query);
        }

        // Migration logic for 'role'
        try {
            const rows = await dbAdapter.all("PRAGMA table_info(users)");
            const hasRole = rows.some(r => r.name === 'role');
            if (!hasRole) {
                await dbAdapter.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
                console.log("Migrated users table: added role column");
            }
        } catch (e) {
            // Pragma might fail on some cloud configs or if table doesn't exist yet
            console.log("Migration check info:", e.message);
        }

        // Migration logic for 'images' column in products table
        try {
            const rows = await dbAdapter.all("PRAGMA table_info(products)");
            const hasImages = rows.some(r => r.name === 'images');
            if (!hasImages) {
                await dbAdapter.run("ALTER TABLE products ADD COLUMN images TEXT");
                console.log("Migrated products table: added images column");
            }
        } catch (e) {
            console.log("Migration check info for products images column:", e.message);
        }
    },

    // Get all rows
    all: async (sql, params = []) => {
        await dbAdapter.ensureReady();
        if (isCloud) {
            try {
                const rs = await client.execute({ sql, args: params });
                return rs.rows;
            } catch (e) { throw e; }
        } else {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    // Get single row
    get: async (sql, params = []) => {
        await dbAdapter.ensureReady();
        if (isCloud) {
            try {
                const rs = await client.execute({ sql, args: params });
                return rs.rows[0];
            } catch (e) { throw e; }
        } else {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },

    // Execute (Insert/Update/Delete)
    run: async (sql, params = []) => {
        await dbAdapter.ensureReady();
        if (isCloud) {
            try {
                const rs = await client.execute({ sql, args: params });
                // Simulate `this.lastID` for inserts
                return { lastID: Number(rs.lastInsertRowid), changes: rs.rowsAffected };
            } catch (e) { throw e; }
        } else {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            });
        }
    }
};

module.exports = dbAdapter;
