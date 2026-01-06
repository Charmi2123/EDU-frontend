import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss()
  ],
  optimizeDeps: {
    exclude: ['talkinghead'], // Exclude CDN-loaded dependencies
    entries: [
      'index.html',
      'src/**/*.{js,jsx,ts,tsx}', // Only scan source files, not public HTML
    ],
  },
})
