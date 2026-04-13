/**
 * cPanel Node.js Selector startup file with error logging.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

// Log startup attempts
const logFile = '/home/vcubed/transcription_backend/startup.log';
function log(msg) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
  console.log(msg);
}

try {
  log('Starting backend...');
  log(`Node version: ${process.version}`);
  log(`CWD: ${process.cwd()}`);
  
  // Check if tsx is available
  try {
    const tsxPath = require.resolve('tsx');
    log(`tsx found at: ${tsxPath}`);
  } catch (e) {
    log(`ERROR: tsx not found - ${e.message}`);
  }
  
  // Register tsx loader
  log('Registering tsx/esm loader...');
  register('tsx/esm', pathToFileURL('./'));
  log('tsx loader registered successfully');
  
  // Import the main server
  log('Importing index.ts...');
  await import('./index.ts');
  log('Server started successfully!');
  
} catch (error) {
  log(`FATAL ERROR: ${error.message}`);
  log(`Stack: ${error.stack}`);
  process.exit(1);
}
