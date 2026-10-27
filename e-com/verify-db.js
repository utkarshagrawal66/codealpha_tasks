// Native fetch is available in Node.js 18+

const BASE_URL = 'http://localhost:4242/api';

async function runTests() {
    console.log("Starting Verification...");

    // 1. Register
    const email = `test_${Date.now()}@example.com`;
    console.log(`\n1. Testing Register with ${email}...`);
    const regRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email, password: 'password123' })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Register failed: ${regData.error}`);
    console.log("✅ Register Success", regData);

    // 2. Login
    console.log(`\n2. Testing Login...`);
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
    console.log("✅ Login Success, Token received");

    // 3. Products
    console.log(`\n3. Testing Get Products...`);
    const prodRes = await fetch(`${BASE_URL}/products`);
    const products = await prodRes.json();
    if (!prodRes.ok) throw new Error("Failed to get products");
    console.log(`✅ Products Fetched: ${products.length} items`);
    if (products.length === 0) console.warn("⚠️ No products found!");
    else console.log("Sample:", products[0].name);

    console.log("\nALL TESTS PASSED 🎉");
}

runTests().catch(err => console.error("❌ TEST FAILED:", err.message));
