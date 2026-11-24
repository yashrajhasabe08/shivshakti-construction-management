const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

console.log('====================================================');
console.log('🚀 STARTING ALL SHIVSHAKTI CONSTRUCTION ERP SERVICES');
console.log('====================================================\n');

// 1. Backend Server (Port 5001)
const backend = spawn('node', ['server/index.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, PORT: '5001' }
});

// 2. Prisma Studio (Port 5555)
const prismaStudio = spawn('npx', ['prisma', 'studio', '--port', '5555', '--browser', 'none'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CHECKPOINT_DISABLE: '1' }
});

// 3. Frontend Vite Server (Port 3000)
const frontend = spawn('npx', ['vite', '--port', '3000', '--host'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\nShutting down all services...');
  try { backend.kill(); } catch (e) {}
  try { prismaStudio.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
