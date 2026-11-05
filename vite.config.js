import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
export default defineConfig({
  plugins: [
    tailwindcss(),
    basicSsl(),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://be.kidostudent.kidoedu.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },


  
})
