const { exec } = require('child_process');
const os = require('os');

const killPort = (port) => {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      // Windows
      command = `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`;
    } else {
      // macOS/Linux
      command = `lsof -ti:${port} | xargs kill -9`;
    }

    exec(command, (error) => {
      if (error) {
        console.log(`Порт ${port} уже свободен или процесс не найден`);
      } else {
        console.log(`✅ Порт ${port} освобожден`);
      }
      resolve();
    });
  });
};

const killPorts = async () => {
  console.log('🔄 Освобождение портов 3000 и 3002...');
  
  await killPort(3000);
  await killPort(3002);
  
  console.log('✅ Все порты освобождены!');
  console.log('Теперь можно запускать серверы:');
  console.log('1. cd backend && npm start');
  console.log('2. cd frontend && npm run dev');
};

killPorts();