import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'
import { contentSecurityPolicyPlugin } from './vite.csp'

export default defineConfig({
  plugins: [
    contentSecurityPolicyPlugin(),
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
      },
    }),
  ],
})
