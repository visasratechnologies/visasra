const { execSync } = require('child_process');
[4860, 4904, 6392, 27948].forEach(pid => {
  try {
    const cmd = execSync(`powershell "(Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}').CommandLine"`, { encoding: 'utf8' });
    console.log(`PID ${pid}:`, cmd.trim().slice(0, 140));
  } catch (e) {
    console.log(`PID ${pid}: error`);
  }
});
