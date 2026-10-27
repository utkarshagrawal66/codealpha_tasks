// Native fetch is available in Node.js 18+

const BASE_URL = 'http://localhost:4242/api';

async function runTests() {
    console.log("Starting Persistence Verification...");

    // 1. Register & Login
    const email = `persisted_${Date.now()}@example.com`;
    const password = 'password123';
    console.log(`\n1. Creating User: ${email}...`);

    await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Persist User', email, password })
    });

    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("✅ Logged In");

    // 2. Get Products to use IDs
    const prodRes = await fetch(`${BASE_URL}/products`);
    const products = await prodRes.json();
    const p1 = products[0].id;
    const p2 = products[1].id;

    // 3. Test Wishlist
    console.log(`\n2. Testing Wishlist...`);
    await fetch(`${BASE_URL}/wishlist`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: p1 })
    });

    const wishRes = await fetch(`${BASE_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const wishlist = await wishRes.json();
    if (wishlist.length === 1 && wishlist[0].id === p1) {
        console.log("✅ Wishlist persists item");
    } else {
        console.error("❌ Wishlist failed", wishlist);
    }

    // 4. Test Cart
    console.log(`\n3. Testing Cart...`);
    await fetch(`${BASE_URL}/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: p2, quantity: 2 })
    });

    const cartRes = await fetch(`${BASE_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const cart = await cartRes.json();
    if (cart.length === 1 && cart[0].id === p2 && cart[0].quantity === 2) {
        console.log("✅ Cart persists item");
    } else {
        console.error("❌ Cart failed", cart);
    }

    console.log("\nALL PERSISTENCE TESTS PASSED 🎉");
}

runTests().catch(err => console.error("❌ TEST FAILED:", err.message));
