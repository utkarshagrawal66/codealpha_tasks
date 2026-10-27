const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ecommerce.db');

db.serialize(() => {
    console.log("\n--- USERS ---");
    db.each("SELECT id, name, email FROM users", (err, row) => {
        console.log(row);
    });

    console.log("\n--- PRODUCTS ---");
    db.each("SELECT id, name, price FROM products LIMIT 5", (err, row) => {
        console.log(row);
    });

    console.log("\n--- WISHLIST ITEMS ---");
    db.each("SELECT * FROM wishlist_items", (err, row) => {
        console.log(row);
    });

    console.log("\n--- CART ITEMS ---");
    db.each("SELECT * FROM cart_items", (err, row) => {
        console.log(row);
    });
});

db.close();
