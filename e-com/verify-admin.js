// Native fetch is available in Node.js 18+

async function runAdminTests() {
    const BASE_URL = 'http://localhost:4242/api';
    console.log("Starting Admin API Verification...");

    // 1. Create Admin User
    const adminEmail = `admin_${Date.now()}@shopnest.com`;
    const userEmail = `user_${Date.now()}@test.com`;
    const password = 'password123';

    console.log(`\n1. Creating Admin: ${adminEmail}`);
    const adminReg = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Admin', email: adminEmail, password })
    });
    const adminData = await adminReg.json();
    // Check if role is admin
    if (adminData.user && adminData.user.role !== 'admin') {
        // It might be that the logic only makes 'admin@shopnest.com' admin, 
        // or checks 'admin' string in email. My server.cjs logic was `email.includes('admin')`
        // So `admin_...` should work.
        console.error("User created but role is:", adminData.user.role);
        throw new Error("Failed to create admin role");
    }
    console.log("✅ Admin Created with role:", adminData.user.role);

    console.log(`\n2. Creating Regular User: ${userEmail}`);
    const userReg = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'User', email: userEmail, password })
    });
    const userData = await userReg.json();
    if (userData.user.role !== 'user') throw new Error("Regular user has wrong role");
    console.log("✅ User Created with role:", userData.user.role);

    // 3. Test Create Product (Admin)
    console.log("\n3. Testing Admin Create Product...");
    const createRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminData.token}`
        },
        body: JSON.stringify({
            name: 'Admin Product',
            description: 'Created by admin',
            price: 9999,
            image: '/assets/admin.png'
        })
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
        console.error("Create failed:", createData);
        throw new Error("Admin failed to create product");
    }
    console.log("✅ Admin Created Product ID:", createData.id);

    // 4. Test Create Product (User - Should Fail)
    console.log("\n4. Testing User Create Product (Should Fail)...");
    const failRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({ name: 'Hacker Product', price: 1 })
    });
    if (failRes.status === 403) {
        console.log("✅ Access Denied for User (Expected)");
    } else {
        throw new Error(`User was able to create product! Status: ${failRes.status}`);
    }

    // 5. Test Delete Product (Admin)
    console.log("\n5. Testing Admin Delete Product...");
    const delRes = await fetch(`${BASE_URL}/products/${createData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminData.token}` }
    });
    if (delRes.ok) {
        console.log("✅ Admin Deleted Product");
    } else {
        throw new Error("Admin failed to delete product");
    }

    console.log("\nALL ADMIN TESTS PASSED 🎉");
}

runAdminTests().catch(err => {
    console.error("❌ ADMIN TEST FAILED:", err.message);
    process.exit(1);
});
