const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🚀 Запуск DeviceMaster...');


const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function spawnNpm(args, cwd) {
  const opts = { cwd, stdio: 'inherit' };
  if (isWindows) {
    return spawn('cmd.exe', ['/c', npmCmd, ...args], opts);
  }
  return spawn(npmCmd, args, opts);
}


console.log('📡 Запуск backend сервера...');
const backend = spawnNpm(['start'], path.join(__dirname, 'backend'));


setTimeout(() => {
  console.log('🎨 Запуск frontend сервера...');
  const frontend = spawnNpm(['run', 'dev'], path.join(__dirname, 'frontend'));


  frontend.on('close', (code) => {
    console.log(`Frontend завершен с кодом ${code}`);
    backend.kill();
  });
}, 3000);

backend.on('close', (code) => {
  console.log(`Backend завершен с кодом ${code}`);
});


process.on('SIGINT', () => {
  console.log('\n🛑 Остановка серверов...');
  backend.kill();
  process.exit();
});