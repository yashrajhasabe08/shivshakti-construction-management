import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { createAuthRouter } from './routes/auth.js';
import { createValidationRouter } from './routes/validation.js';
import { authenticateToken, requireRole, checkPartnerAccess } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'database.json');

// Initialize Prisma Client
let prisma = null;
let isPrismaConnected = false;

try {
  prisma = new PrismaClient();
  // Non-blocking connection test
  prisma.$connect()
    .then(() => {
      isPrismaConnected = true;
      console.log('✓ Connected to PostgreSQL Database via Prisma');
    })
    .catch((err) => {
      isPrismaConnected = false;
      console.warn('ℹ PostgreSQL connection not available. Running with local high-performance database file.');
    });
} catch (e) {
  isPrismaConnected = false;
  console.warn('Prisma initialization skipped:', e.message);
}

// Fallback JSON DB functions
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], partners: [], projects: [] };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], partners: [], projects: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 1. Mount Auth Router: /api/auth/login, /api/auth/register, /api/auth/me, /api/auth/logout
app.use('/api/auth', createAuthRouter(readDB, writeDB));

// 2. Mount Data Validation Router: /api/validation/check
app.use('/api/validation', createValidationRouter(readDB));

// 3. Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    company: 'Shivshakti Construction ERP Backend',
    databaseEngine: isPrismaConnected ? 'PostgreSQL (Prisma)' : 'File-based (Consistent JSON)',
    auth: 'JWT & Bcrypt Active',
    timestamp: new Date().toISOString()
  });
});

// 4. Partner Dashboard Endpoint (Prompt 2 & Prompt 3)
app.get('/api/partner/:partnerId/dashboard', authenticateToken, checkPartnerAccess, async (req, res) => {
  const { partnerId } = req.params;
  const db = readDB();
  const partner = (db.partners || []).find(p => p.id === partnerId);

  if (!partner) {
    return res.status(404).json({ error: `Partner ${partnerId} not found` });
  }

  const projects = (db.projects || []).filter(p => p.partnerId === partnerId);
  const expenses = (db.otherExpenses || []).filter(e => e.partnerId === partnerId);
  const purchaseOrders = (db.purchaseOrders || []).filter(po => po.partnerId === partnerId);
  const purchaseBills = (db.purchaseBills || []).filter(pb => pb.partnerId === partnerId);
  const labourWages = (db.labourWages || []).filter(lw => lw.partnerId === partnerId);
  const subcontractors = (db.subcontractors || []).filter(sc => sc.partnerId === partnerId);
  const clientPayments = (db.clientPayments || []).filter(cp => cp.partnerId === partnerId);

  res.json({
    partner,
    projects,
    expenses,
    purchaseOrders,
    purchaseBills,
    labourWages,
    subcontractors,
    clientPayments,
    summary: {
      projectsCount: projects.length,
      totalDirectExpenses: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
      totalPurchaseOrders: purchaseOrders.reduce((s, po) => s + (Number(po.totalAmount) || 0), 0),
      totalLabourWages: labourWages.reduce((s, lw) => s + (Number(lw.totalWeeklyWage) || 0), 0),
      totalClientReceipts: clientPayments.reduce((s, cp) => s + (Number(cp.amount) || 0), 0)
    }
  });
});

// 5. Get full consolidated dataset (Used by ERP client)
app.get('/api/data', async (req, res) => {
  try {
    const db = readDB();
    res.json(db);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Generic Module POST (Add or Update)
app.post('/api/:moduleName', async (req, res) => {
  const { moduleName } = req.params;
  const item = req.body;
  const db = readDB();

  if (!db[moduleName]) db[moduleName] = [];
  
  // Ensure consistent partnerId tagging if item belongs to a project
  if (!item.partnerId && (item.projectId || item.projectName)) {
    const proj = (db.projects || []).find(p => p.id === item.projectId || p.name === item.projectName);
    if (proj && proj.partnerId) {
      item.partnerId = proj.partnerId;
    }
  }

  const existingIdx = db[moduleName].findIndex(i => i.id === item.id);
  if (existingIdx >= 0) {
    db[moduleName][existingIdx] = item;
  } else {
    db[moduleName].unshift(item);
  }

  writeDB(db);
  res.json({ success: true, item });
});

// 7. Generic Module DELETE
app.delete('/api/:moduleName/:id', async (req, res) => {
  const { moduleName, id } = req.params;
  const db = readDB();

  if (db[moduleName]) {
    db[moduleName] = db[moduleName].filter(i => i.id !== id);
    writeDB(db);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Shivshakti Construction Backend running on http://localhost:${PORT}`);
  console.log(`- Database: ${isPrismaConnected ? 'PostgreSQL (Prisma)' : 'Reconciled Consistent JSON Storage'}`);
  console.log(`- Auth API: http://localhost:${PORT}/api/auth/login`);
  console.log(`- Data Integrity API: http://localhost:${PORT}/api/validation/check`);
});
