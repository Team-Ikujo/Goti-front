import path from 'path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const apiTarget = (process.env.PUBLIC_API_BASE_URL ?? 'https://dev.go-ti.shop').trim();

// Rsbuild configuration — https://rsbuild.rs/config/
export default defineConfig({
   plugins: [pluginReact()],
   source: {
      alias: {
         '@': path.resolve(__dirname, 'src'),
      },
   },
   output: {
      sourceMap: {
         js: false,
         css: false,
      },
   },
   performance: {
      removeConsole: ['log', 'info', 'warn'],
   },
   server: {
      proxy: {
         '/api': {
            target: apiTarget,
            changeOrigin: true,
            secure: true,
         },
      },
   },
});
