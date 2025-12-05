import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// HTTPS certificate paths (relative to project root)
const certPath = path.resolve(__dirname, '../../certs/localhost.pem');
const keyPath = path.resolve(__dirname, '../../certs/localhost-key.pem');

// Check if certificates exist
const httpsEnabled = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    host: true, // Listen on all interfaces
    https: httpsEnabled ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    } : undefined,
    proxy: {
      '/api': {
        target: httpsEnabled ? 'https://localhost:3000' : 'http://localhost:3000',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
      },
      '/ws': {
        target: httpsEnabled ? 'wss://localhost:3000' : 'ws://localhost:3000',
        ws: true,
        secure: false, // Accept self-signed certificates
      }
    }
  }
});
