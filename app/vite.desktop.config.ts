import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import { contentSecurityPolicyPlugin } from './vite.csp'

export default defineConfig({
  plugins: [
    contentSecurityPolicyPlugin(),
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
      },
      {
        onstart({ reload }) {
          reload()
        },
        vite: {
          build: {
            rollupOptions: {
              input: 'electron/preload.ts',
              output: {
                format: 'cjs',
                inlineDynamicImports: true,
                entryFileNames: '[name].mjs',
                chunkFileNames: '[name].mjs',
                assetFileNames: '[name].[ext]',
              },
            },
          },
        },
      },
    ]),
  ],
})
