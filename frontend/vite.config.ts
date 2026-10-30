import { defineConfig } from 'vite';

// O Phaser sozinho tem cerca de 1,4 MB minificado e não pode ser dividido. Com ele em um chunk
// próprio, o navegador o mantém em cache entre versões do jogo, e o limite de aviso acomoda seu tamanho.
const PHASER_CHUNK_SIZE_LIMIT_KB = 1600;

export default defineConfig({
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: PHASER_CHUNK_SIZE_LIMIT_KB,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    // Em desenvolvimento o Vite roda em outra porta; o proxy faz /api parecer da mesma origem,
    // igual à produção, onde o Express serve o front-end e a API juntos.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
