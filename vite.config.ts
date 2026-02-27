import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Vite config for React + TypeScript app
export default defineConfig({
  plugins: [react()],
})

