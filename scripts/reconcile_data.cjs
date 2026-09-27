const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'server', 'database.json');
const mockDataPath = path.join(__dirname, '..', 'src', 'data', 'mockData.js');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Build Project Lookup Map by ID and by normalized Name
const projectById = {};
const projectByName = {};

(db.projects || []).forEach(p => {
  projectById[p.id] = p;
  if (p.name) {
    projectByName[p.name.trim().toLowerCase()] = p;
  }
});

function findProject(item) {
  if (item.projectId && projectById[item.projectId]) {
    return projectById[item.projectId];
  }
  const nameCandidate = item.projectName || item.projectAssigned || item.siteAssigned || item.site || item.location;
  if (nameCandidate && projectByName[nameCandidate.trim().toLowerCase()]) {
    return projectByName[nameCandidate.trim().toLowerCase()];
  }
  // Try partial match
  if (nameCandidate) {
    const candidateLower = nameCandidate.trim().toLowerCase();
    for (const p of db.projects || []) {
      if (candidateLower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(candidateLower)) {
        return p;
      }
    }
  }
  return null;
}

// 1. Reconcile Users with Password Hashes
const saltRounds = 10;
(db.users || []).forEach(u => {
  if (!u.passwordHash) {
    const plain = u.password || 'admin123';
    u.passwordHash = bcrypt.hashSync(plain, saltRounds);
  }
  // Ensure default role and partner association
  if (!u.role) u.role = 'PARTNER';
  if (u.role === 'PARTNER' && !u.partnerId) {
    u.partnerId = 'P1';
  }
});

// 2. Reconcile modules with projectId and partnerId
const modules = [
  'otherExpenses',
  'purchaseOrders',
  'purchaseBills',
  'purchasePayments',
  'labourWages',
  'subcontractors',
  'clientPayments',
  'assetsAndDeposits'
];

let enrichedCount = 0;

modules.forEach(mod => {
  const items = db[mod] || [];
  items.forEach(item => {
    const p = findProject(item);
    if (p) {
      if (!item.projectId) item.projectId = p.id;
      if (!item.projectName) item.projectName = p.name;
      if (!item.partnerId) {
        item.partnerId = p.partnerId;
        enrichedCount++;
      }
    } else {
      // Fallback default to P1 if project not found
      if (!item.partnerId) {
        item.partnerId = 'P1';
        enrichedCount++;
      }
    }
  });
});

console.log(`Enriched ${enrichedCount} records with explicit partnerId and projectId.`);

// Write back to database.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log('Saved reconciled database to server/database.json');

// Also update mockData.js with consistent data
const mockDataContent = `export const initialData = ${JSON.stringify(db, null, 2)};\n`;
fs.writeFileSync(mockDataPath, mockDataContent, 'utf-8');
console.log('Saved reconciled initialData to src/data/mockData.js');

console.log('=== DATA RECONCILIATION COMPLETE ===');
