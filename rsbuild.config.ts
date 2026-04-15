import path from 'path';
import { defineConfig, rspack, type Rspack } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { obfuscate, type ObfuscatorOptions } from 'javascript-obfuscator';

const apiTarget = (process.env.PUBLIC_API_BASE_URL ?? 'https://dev.go-ti.shop').trim();
const mlTarget = (process.env.PUBLIC_MOUSE_ML_URL ?? 'https://api.go-ti.shop').replace(/\/$/, '');
const dashboardTarget = (process.env.PUBLIC_MACRO_DASHBOARD_API_URL ?? 'https://go-ti.shop').trim();
const shouldObfuscate = process.env.NODE_ENV === 'production' && process.env.ENABLE_CODE_OBFUSCATION !== 'false';

const obfuscationOptions: ObfuscatorOptions = {
   compact: true,
   controlFlowFlattening: false,
   deadCodeInjection: false,
   identifierNamesGenerator: 'hexadecimal',
   renameGlobals: false,
   rotateStringArray: true,
   selfDefending: true,
   simplify: true,
   splitStrings: true,
   splitStringsChunkLength: 8,
   stringArray: true,
   stringArrayCallsTransform: true,
   stringArrayEncoding: ['base64'],
   stringArrayThreshold: 0.75,
   transformObjectKeys: true,
   unicodeEscapeSequence: false,
};

class JsObfuscationPlugin {
   apply(compiler: Rspack.Compiler): void {
      compiler.hooks.thisCompilation.tap('JsObfuscationPlugin', (compilation) => {
         compilation.hooks.processAssets.tap(
            {
               name: 'JsObfuscationPlugin',
               stage: rspack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            },
            (assets) => {
               for (const [filename, asset] of Object.entries(assets)) {
                  if (!filename.endsWith('.js')) {
                     continue;
                  }

                  const sourceCode = asset.source().toString();
                  const result = obfuscate(sourceCode, {
                     ...obfuscationOptions,
                     sourceMap: false,
                  });

                  compilation.updateAsset(filename, new rspack.sources.RawSource(result.getObfuscatedCode()));
               }
            }
         );
      });
   }
}

// Rsbuild configuration — https://rsbuild.rs/config/
export default defineConfig({
   plugins: [pluginReact()],
   html: {
      title: 'GO-TI',
      favicon: './public/Logo/favicon.ico',
   },
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
      removeConsole: process.env.NODE_ENV === 'production' ? ['log', 'info', 'warn'] : false,
   },
   tools: {
      rspack: shouldObfuscate
         ? (config) => {
              config.plugins.push(new JsObfuscationPlugin());
           }
         : undefined,
   },
   server: {
      proxy: {
         '/api/v1/mouse': {
            target: mlTarget,
            changeOrigin: true,
            secure: true,
         },
         // Go 대시보드 서버 — /api 보다 먼저 선언해야 우선 매칭됨
         // 기본값: go-ti.shop (EKS), .env에서 PUBLIC_MACRO_DASHBOARD_API_URL 오버라이드 가능
         '/api/v1/dashboard': { target: dashboardTarget, changeOrigin: true, secure: true },
         '/api/v1/detections': { target: dashboardTarget, changeOrigin: true, secure: true },
         '/api/v1/stats': { target: dashboardTarget, changeOrigin: true, secure: true },
         '/api/v1/mouse-macro': { target: dashboardTarget, changeOrigin: true, secure: true },
         '/api/v1/interventions': { target: dashboardTarget, changeOrigin: true, secure: true },
         '/api/v1/analysis': { target: dashboardTarget, changeOrigin: true, secure: true },
         '/api/v1/alerts': { target: dashboardTarget, changeOrigin: true, secure: true },
         '/api': {
            target: apiTarget,
            changeOrigin: true,
            secure: true,
         },
      },
   },
});
