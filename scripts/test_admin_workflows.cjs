const API_BASE = 'http://localhost:5001/api';

async function runAdminVerification() {
  console.log('========================================================');
  console.log('🧪 VERIFYING ADMIN DATA MANAGEMENT & PERSISTENCE WORKFLOWS');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Admin Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shivshakti.com',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginData.token && loginData.user?.role === 'ADMIN', 'Admin authentication succeeds with JWT and ADMIN role');
    const adminToken = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    };

    // 2. Fetch Users List
    const usersRes = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders });
    const usersData = await usersRes.json();
    assert(Array.isArray(usersData) && usersData.length > 0, `Admin can retrieve users list (${usersData.length} users returned)`);

    // 3. Fetch Full PostgreSQL Data
    const dataRes = await fetch(`${API_BASE}/data`, { headers: authHeaders });
    const data = await dataRes.json();
    assert(Array.isArray(data.projects) && data.projects.length > 0, `Admin can retrieve live projects (${data.projects.length} sites)`);
    assert(Array.isArray(data.partners) && data.partners.length === 3, 'Admin can retrieve all 3 partners');
    assert(Array.isArray(data.clients), 'Admin can retrieve clients list');
    assert(Array.isArray(data.suppliers), 'Admin can retrieve suppliers list');
    assert(Array.isArray(data.subcontractors), 'Admin can retrieve subcontractors list');
    assert(Array.isArray(data.assetsAndDeposits), 'Admin can retrieve assets and deposits');
    assert(Array.isArray(data.purchaseBills), 'Admin can retrieve purchase bills');
    assert(Array.isArray(data.labourWages), 'Admin can retrieve labour wages');

    // 4. Verify Financial Limit Enforced (<= ₹50,00,000 per project)
    const overBudgetProjects = data.projects.filter(p => p.budget > 5000000);
    assert(overBudgetProjects.length === 0, 'All project budgets comply with the <= ₹50,00,000 policy limit (0 violations)');

    // 5. Test Audit Logs retrieval
    const auditRes = await fetch(`${API_BASE}/admin/audit-logs`, { headers: authHeaders });
    const auditData = await auditRes.json();
    assert(Array.isArray(auditData) && auditData.length > 0, `Admin can retrieve audit logs (${auditData.length} records in PostgreSQL)`);

    // 6. Test Creating a temporary record and deleting it with Audit Log
    const tempSupplierId = `SUP-TEST-${Date.now().toString().slice(-4)}`;
    const createSupplierRes = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        id: tempSupplierId,
        name: 'Test Admin Hardware Supplies',
        category: 'General Hardware',
        contactPerson: 'Milind Kulkarni',
        mobile: '+91 98220 99887',
        gstin: '27AABCT8899Z1ZX',
        location: 'Kolhapur Depot',
        outstandingBalance: 15000
      })
    });
    assert(createSupplierRes.status === 200, 'Admin can create new record in PostgreSQL');

    // Verify it exists in data
    const verifyRes = await fetch(`${API_BASE}/data`, { headers: authHeaders });
    const verifyData = await verifyRes.json();
    const createdSupplier = verifyData.suppliers.find(s => s.id === tempSupplierId);
    assert(Boolean(createdSupplier), 'Newly created record persists and is readable in PostgreSQL');

    // Delete the record
    const deleteRes = await fetch(`${API_BASE}/suppliers/${tempSupplierId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteRes.status === 200, 'Admin can delete record from PostgreSQL');

    // Verify audit log has the delete entry
    const postAuditRes = await fetch(`${API_BASE}/admin/audit-logs`, { headers: authHeaders });
    const postAuditData = await postAuditRes.json();
    const deleteAudit = postAuditData.find(a => a.details && a.details.includes(tempSupplierId));
    assert(Boolean(deleteAudit), 'Administrative deletion is tracked in PostgreSQL audit logs');

  } catch (err) {
    console.error('Test execution error:', err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`📊 ADMIN VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runAdminVerification();
