import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/management-score-pad/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5005,
    strictPort: true,
  },
});
