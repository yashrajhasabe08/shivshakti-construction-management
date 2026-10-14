const http = require('http');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE SECURITY & RBAC AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Database & Credential Security Inspection
  console.log('--- TEST GROUP 1: STORAGE & CREDENTIAL INTEGRITY ---');
  const dbPath = path.join(__dirname, '..', 'server', 'database.json');
  const dbRaw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbRaw);

  const containsPlaintextPassKey = /"password"\s*:/i.test(dbRaw) || /"altPassword"\s*:/i.test(dbRaw);
  assert(!containsPlaintextPassKey, 'Database contains zero plaintext password fields');

  const allUsersHaveBcryptHashes = (db.users || []).every(u => 
    typeof u.passwordHash === 'string' && u.passwordHash.startsWith('$2b$10$')
  );
  assert(allUsersHaveBcryptHashes, 'All user passwords in database are secure bcrypt hashes (salt rounds 10)');

  const adminAccountExists = (db.users || []).some(u => u.role === 'ADMIN' && u.email === 'admin@shivshakti.com');
  assert(adminAccountExists, 'Dedicated ADMIN account (admin@shivshakti.com) exists with role ADMIN');

  // Test bcrypt verification of created credentials
  const adminUser = (db.users || []).find(u => u.email === 'admin@shivshakti.com');
  const adminPassMatch = bcrypt.compareSync('admin123', adminUser.passwordHash) || bcrypt.compareSync('Admin@Shivshakti2026!', adminUser.passwordHash);
  assert(adminPassMatch, 'Admin password hash verified with bcrypt');

  const partner1User = (db.users || []).find(u => u.email === 'rajesh@shivshakti.com');
  const partner1PassMatch = bcrypt.compareSync('partner123', partner1User.passwordHash) || bcrypt.compareSync('Rajesh@Shivshakti2026!', partner1User.passwordHash);
  assert(partner1PassMatch, 'Partner 1 password hash verified with bcrypt');

  // 2. Server connection
  console.log('\n--- TEST GROUP 2: API AUTHENTICATION & SESSION HANDLING ---');
  let serverPort = 5001;
  let serverProcess = null;

  // Check if server is already running on port 5001
  let serverAlreadyRunning = false;
  try {
    const res = await fetch(`http://127.0.0.1:${serverPort}/api/health`);
    if (res.ok) serverAlreadyRunning = true;
  } catch (e) {
    serverAlreadyRunning = false;
  }

  if (!serverAlreadyRunning) {
    const { spawn } = require('child_process');
    serverProcess = spawn('node', ['server/index.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: '5001' }
    });
    await new Promise(r => setTimeout(r, 2500));
  }

  const BASE_URL = `http://127.0.0.1:${serverPort}`;

  async function apiPost(endpoint, body, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  async function apiGet(endpoint, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  try {
    // 2.1 Public Health Endpoint
    const health = await apiGet('/api/health');
    assert(health.status === 200 && health.data.status === 'OK', 'Public /api/health responds with status OK');
    assert(health.data.databaseEngine.includes('PostgreSQL'), 'Database engine reports PostgreSQL (Prisma)');

    // 2.2 Unauthenticated Access to Private APIs
    const unauthData = await apiGet('/api/data');
    assert(unauthData.status === 401, 'Unauthenticated GET /api/data is blocked with 401 Unauthorized');

    const unauthAdmin = await apiGet('/api/admin/users');
    assert(unauthAdmin.status === 401, 'Unauthenticated GET /api/admin/users is blocked with 401 Unauthorized');

    const unauthPost = await apiPost('/api/projects', { id: 'PRJ-TEST', name: 'Test' });
    assert(unauthPost.status === 401, 'Unauthenticated POST /api/projects is blocked with 401 Unauthorized');

    // 2.3 Authentication Login Tests
    const badLogin = await apiPost('/api/auth/login', { email: 'rajesh@shivshakti.com', password: 'WrongPassword123' });
    assert(badLogin.status === 401, 'Incorrect password rejected with 401');

    const nonExistentLogin = await apiPost('/api/auth/login', { email: 'ghost@shivshakti.com', password: 'AnyPassword123!' });
    assert(nonExistentLogin.status === 401, 'Non-existent user rejected with 401');

    // Valid Partner Login
    const partnerLogin = await apiPost('/api/auth/login', { email: 'rajesh@shivshakti.com', password: 'partner123' });
    assert(partnerLogin.status === 200 && !!partnerLogin.data.token, 'Partner 1 login succeeds and returns JWT token');
    assert(!partnerLogin.data.user?.passwordHash, 'User profile returned in login does NOT contain passwordHash');
    const partnerToken = partnerLogin.data.token;

    // Valid Admin Login
    const adminLogin = await apiPost('/api/auth/login', { email: 'admin@shivshakti.com', password: 'admin123' });
    assert(adminLogin.status === 200 && adminLogin.data.user?.role === 'ADMIN', 'Admin login succeeds with ADMIN role');
    const adminToken = adminLogin.data.token;

    // Valid Client Login
    const clientLogin = await apiPost('/api/auth/login', { email: 'client@apexinfa.com', password: 'client123' });
    assert(clientLogin.status === 200 && clientLogin.data.user?.role === 'CLIENT', 'Client login succeeds with CLIENT role');
    const clientToken = clientLogin.data.token;

    // Valid Worker Login
    const workerLogin = await apiPost('/api/auth/login', { email: 'driver@shivshakti.com', password: 'worker123' });
    assert(workerLogin.status === 200 && workerLogin.data.user?.role === 'WORKER', 'Worker login succeeds with WORKER role');
    const workerToken = workerLogin.data.token;

    // 2.4 Verify Session (/api/auth/me)
    const meRes = await apiGet('/api/auth/me', partnerToken);
    assert(meRes.status === 200 && meRes.data.email === 'rajesh@shivshakti.com', 'GET /api/auth/me verifies valid bearer token');

    // 2.5 Invalidate Token via Logout
    const logoutRes = await apiPost('/api/auth/logout', {}, partnerToken);
    assert(logoutRes.status === 200, 'POST /api/auth/logout invalidates session');

    const meAfterLogout = await apiGet('/api/auth/me', partnerToken);
    assert(meAfterLogout.status === 401, 'Logged out token is rejected with 401 Session Invalidated');

    // Re-login partner for subsequent authorization tests
    const freshPartnerLogin = await apiPost('/api/auth/login', { email: 'rajesh@shivshakti.com', password: 'partner123' });
    const freshPartnerToken = freshPartnerLogin.data.token;

    // 3. RBAC Authorization Tests
    console.log('\n--- TEST GROUP 3: ROLE-BASED ACCESS CONTROL (RBAC) ---');
    
    // Admin access to admin routes
    const adminUsersRes = await apiGet('/api/admin/users', adminToken);
    assert(adminUsersRes.status === 200 && Array.isArray(adminUsersRes.data), 'Admin can access /api/admin/users');

    // Partner blocked from admin routes
    const partnerBlockedFromAdmin = await apiGet('/api/admin/users', freshPartnerToken);
    assert(partnerBlockedFromAdmin.status === 403, 'Partner is blocked from /api/admin/users with 403 Forbidden');

    // Client blocked from admin routes
    const clientBlockedFromAdmin = await apiGet('/api/admin/users', clientToken);
    assert(clientBlockedFromAdmin.status === 403, 'Client is blocked from /api/admin/users with 403 Forbidden');

    // Worker blocked from admin routes
    const workerBlockedFromAdmin = await apiGet('/api/admin/users', workerToken);
    assert(workerBlockedFromAdmin.status === 403, 'Worker is blocked from /api/admin/users with 403 Forbidden');

    // Non-admin cannot create user
    const nonAdminCreateUser = await apiPost('/api/admin/users', {
      email: 'hacker@erp.com',
      password: 'HackerPassword123!',
      name: 'Hacker',
      role: 'ADMIN'
    }, freshPartnerToken);
    assert(nonAdminCreateUser.status === 403, 'Non-admin cannot create users or promote accounts (403 Forbidden)');

    // 4. Project-Based Data Isolation Tests
    console.log('\n--- TEST GROUP 4: PROJECT-BASED DATA ISOLATION ---');

    // Partner data scoping
    const partnerData = await apiGet('/api/data', freshPartnerToken);
    const partnerProjects = partnerData.data.projects || [];
    const onlyPartner1Projects = partnerProjects.every(p => p.partnerId === 'P1');
    assert(onlyPartner1Projects, 'Partner 1 GET /api/data returns only projects belonging to Partner P1');

    // Partner cross-organization access check
    const partnerCrossAccess = await apiGet('/api/partner/P2/dashboard', freshPartnerToken);
    assert(partnerCrossAccess.status === 403, 'Partner P1 cannot access Partner P2 dashboard (403 Forbidden)');

    // Client scoped data check
    const clientPortalData = await apiGet('/api/client/portal-data', clientToken);
    assert(clientPortalData.status === 200, 'Client can access /api/client/portal-data');
    assert(!clientPortalData.data.expenses, 'Client cannot access internal site expenses');
    assert(!clientPortalData.data.subcontractors, 'Client cannot access subcontractor pricing');

    // Worker scoped data check
    const workerPortalData = await apiGet('/api/worker/portal-data', workerToken);
    assert(workerPortalData.status === 200, 'Worker can access /api/worker/portal-data');
    assert(!workerPortalData.data.projects?.budget, 'Worker cannot access internal financial budgets');

    // 5. Audit Logging Verification
    console.log('\n--- TEST GROUP 5: AUDIT LOGGING SYSTEM ---');
    const auditLogsRes = await apiGet('/api/admin/audit-logs', adminToken);
    assert(auditLogsRes.status === 200 && Array.isArray(auditLogsRes.data), 'Admin can view audit logs');
    const hasLoginEvents = auditLogsRes.data.some(l => l.action.includes('LOGIN'));
    assert(hasLoginEvents, 'Audit trail contains recorded authentication events');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  console.log('\n====================================================');
  console.log(`📊 AUDIT RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
