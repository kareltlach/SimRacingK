#!/usr/bin/env node
/**
 * kill-prev.cjs
 * Runs as "predev" script to kill any leftover ApexTelemetry Studio / Electron
 * processes and remove the Electron single-instance lockfile before starting a
 * new dev session. Prevents the "Lock file can not be created!" error.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const APP_NAME = 'apex-telemetry-studio';
const isWindows = process.platform === 'win32';

function tryKillByName(name) {
  try {
    if (isWindows) {
      execSync(`taskkill /F /IM "${name}.exe" /T 2>nul`, { stdio: 'ignore' });
    } else {
      execSync(`pkill -f "${name}" 2>/dev/null`, { stdio: 'ignore' });
    }
  } catch {
    // Process may not exist — that's fine
  }
}

function removeLockfile() {
  let lockDir;
  if (isWindows) {
    lockDir = path.join(process.env.APPDATA || '', APP_NAME);
  } else if (process.platform === 'darwin') {
    lockDir = path.join(os.homedir(), 'Library', 'Application Support', APP_NAME);
  } else {
    lockDir = path.join(os.homedir(), '.config', APP_NAME);
  }

  const lockfile = path.join(lockDir, 'lockfile');
  if (fs.existsSync(lockfile)) {
    try {
      fs.unlinkSync(lockfile);
      console.log('[predev] Removed stale lockfile:', lockfile);
    } catch (e) {
      console.warn('[predev] Could not remove lockfile (process may still be alive):', e.message);
    }
  }
}

// 1. Kill previous instances of the app by process name
console.log('[predev] Cleaning up previous ApexTelemetry Studio processes...');
tryKillByName('ApexTelemetry Studio');
tryKillByName('electron');

// Give the OS a moment to release file handles
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(800);

  // 2. Remove the Electron single-instance lockfile
  removeLockfile();

  console.log('[predev] Cleanup done. Starting dev server...');
})();
