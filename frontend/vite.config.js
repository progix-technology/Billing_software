import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Use root base '/' for Vercel web hosting to prevent 404 on refresh, and './' for Electron file:// protocol
const isVercel = Boolean(process.env.VERCEL);
const isElectron = !isVercel;

export default defineConfig({
  base: isElectron ? './' : '/',
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0', // Allows access from local network (mobile phones)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
