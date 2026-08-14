import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Dùng đường dẫn tương đối để chạy chuẩn trên mọi URL của GitHub Pages
  build: {
    target: 'esnext'
  }
});
