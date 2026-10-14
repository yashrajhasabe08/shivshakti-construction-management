const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'server', 'database.json');
const mockDataPath = path.join(__dirname, '..', 'src', 'data', 'mockData.js');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Pre-hashed bcrypt passwords (passwords: Admin@Shivshakti2026!, Rajesh@Shivshakti2026!, etc.)
const users = [
  {
    id: 'USR-00',
    email: 'admin@shivshakti.com',
    name: 'Super Admin',
    role: 'ADMIN',
    phone: '+91 98220 00000',
    title: 'Chief System Administrator',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordHash: bcrypt.hashSync('Admin@Shivshakti2026!', 10)
  },
  {
    id: 'USR-01',
    email: 'rajesh@shivshakti.com',
    name: 'Rajesh Patel',
    role: 'PARTNER',
    partnerId: 'P1',
    phone: '+91 98220 11223',
    location: 'Pune & Kolhapur',
    title: 'Managing Partner - Commercial & Kolhapur',
    capitalInvested: 45000000,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordHash: bcrypt.hashSync('Rajesh@Shivshakti2026!', 10)
  },
  {
    id: 'USR-02',
    email: 'suresh@shivshakti.com',
    name: 'Suresh Sharma',
    role: 'PARTNER',
    partnerId: 'P2',
    phone: '+91 98220 22334',
    location: 'Mumbai',
    title: 'Partner - Residential & High-Rise',
    capitalInvested: 60000000,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordHash: bcrypt.hashSync('Suresh@Shivshakti2026!', 10)
  },
  {
    id: 'USR-03',
    email: 'vikram@shivshakti.com',
    name: 'Vikram Deshmukh',
    role: 'PARTNER',
    partnerId: 'P3',
    phone: '+91 98220 33445',
    location: 'Nagpur',
    title: 'Partner - Infrastructure & Heavy Earthwork',
    capitalInvested: 35000000,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordHash: bcrypt.hashSync('Vikram@Shivshakti2026!', 10)
  },
  {
    id: 'USR-04',
    email: 'client@apexinfa.com',
    name: 'Anand Verma',
    role: 'CLIENT',
    clientId: 'CL-01',
    phone: '+91 98220 44556',
    title: 'Client - Apex Infrastructures Ltd',
    assignedProject: 'PRJ-001',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordHash: bcrypt.hashSync('Client@Apex2026!', 10)
  },
  {
    id: 'USR-05',
    email: 'driver@shivshakti.com',
    name: 'Dnyaneshwar More',
    role: 'WORKER',
    phone: '+91 98220 55667',
    title: 'Senior Truck Driver & Site Worker',
    driverVehicleNo: 'MH 12 QG 4821',
    assignedProject: 'PRJ-001',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordHash: bcrypt.hashSync('Worker@Shivshakti2026!', 10)
  }
];

db.users = users;

if (!db.auditLogs) {
  db.auditLogs = [
    {
      id: 'LOG-001',
      userId: 'USR-00',
      userName: 'Super Admin',
      userRole: 'ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      module: 'AUTH',
      details: 'Initialized secure ERP environment with bcrypt credentials and RBAC',
      ipAddress: '127.0.0.1',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ];
}

if (!db.notifications) {
  db.notifications = [
    {
      id: 'NOTIF-001',
      userId: 'USR-01',
      role: 'PARTNER',
      title: 'Material Dispatched',
      message: 'Ultratech Cement delivery in-transit to Hinjewadi site (PRJ-001)',
      type: 'INFO',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'NOTIF-002',
      userId: 'USR-00',
      role: 'ADMIN',
      title: 'Security System Active',
      message: 'RBAC and JWT authentication enforced across all endpoints',
      type: 'SUCCESS',
      read: false,
      createdAt: new Date().toISOString()
    }
  ];
}

if (!db.workerTasks) {
  db.workerTasks = [
    {
      id: 'TSK-001',
      workerId: 'USR-05',
      workerName: 'Dnyaneshwar More',
      projectId: 'PRJ-001',
      projectName: 'Shivshakti Commercial Tower',
      title: 'Dispatch Material Cargo to Talegaon Gate',
      description: 'Transport 400 bags OPC 53 Grade cement to Pune Site Gate 2',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    },
    {
      id: 'TSK-002',
      workerId: 'USR-05',
      workerName: 'Dnyaneshwar More',
      projectId: 'PRJ-001',
      projectName: 'Shivshakti Commercial Tower',
      title: 'Check vehicle engine oil and tyre pressure',
      description: 'Complete pre-transit vehicle maintenance check for MH 12 QG 4821',
      priority: 'NORMAL',
      status: 'COMPLETED',
      dueDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    }
  ];
}

if (!db.clientQueries) {
  db.clientQueries = [
    {
      id: 'QRY-001',
      clientId: 'CL-01',
      clientName: 'Apex Infrastructures Ltd',
      projectId: 'PRJ-001',
      projectName: 'Shivshakti Commercial Tower',
      subject: 'Milestone 4 Inspection Schedule',
      message: 'Requesting confirmation for the structural inspection of the 8th slab.',
      status: 'ANSWERED',
      reply: 'Inspection scheduled for Friday at 11:00 AM with Partner Rajesh Patel.',
      createdAt: new Date().toISOString()
    }
  ];
}

if (!db.workerAttendance) {
  db.workerAttendance = [
    {
      id: 'ATT-001',
      workerId: 'USR-05',
      workerName: 'Dnyaneshwar More',
      projectId: 'PRJ-001',
      projectName: 'Shivshakti Commercial Tower',
      date: new Date().toISOString().slice(0, 10),
      punchInTime: '08:30 AM',
      status: 'PRESENT'
    }
  ];
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✓ server/database.json updated with zero plaintext credentials.');

const mockContent = 'export const initialData = ' + JSON.stringify(db, null, 2) + ';\n';
fs.writeFileSync(mockDataPath, mockContent, 'utf8');
console.log('✓ src/data/mockData.js synchronized with zero plaintext credentials.');
