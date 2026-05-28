import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { contentSecurityPolicyPlugin } from './vite.csp'

// https://vite.dev/config/
export default defineConfig({
  plugins: [contentSecurityPolicyPlugin(), vue()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
