import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is configurable so the same build works at a domain root (Vercel: '/')
// and under a project path on GitHub Pages (e.g. '/curly-adventure/').
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
});
