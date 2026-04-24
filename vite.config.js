import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { build as esbuildBuild } from 'esbuild';

/**
 * 自定义 Vite 插件：使用 esbuild 构建 Background 和 Content Script
 * 在 Vite 主构建完成后，将 background/index.js 和 content/index.js
 * 打包成独立的 IIFE 脚本，输出到 dist/ 目录
 */
function extensionScriptsPlugin() {
  return {
    name: 'extension-scripts-build',
    async closeBundle() {
      // 构建 Background Service Worker
      await esbuildBuild({
        entryPoints: [resolve(__dirname, 'src/background/index.js')],
        bundle: true,
        outfile: resolve(__dirname, 'dist/background.js'),
        format: 'iife',
        target: 'chrome120',
        minify: false,
      });

      // 构建 Content Script
      await esbuildBuild({
        entryPoints: [resolve(__dirname, 'src/content/index.js')],
        bundle: true,
        outfile: resolve(__dirname, 'dist/content.js'),
        format: 'iife',
        target: 'chrome120',
        minify: false,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), extensionScriptsPlugin()],
  base: './', // 浏览器扩展必须使用相对路径，不能用绝对路径
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidebar: resolve(__dirname, 'src/sidebar/index.html'),
      },
      output: {
        // 将侧边栏的 JS 输出到 sidebar/ 子目录，避免与其他文件冲突
        entryFileNames: 'sidebar/[name].js',
        chunkFileNames: 'sidebar/chunks/[name].[hash].js',
        assetFileNames: 'sidebar/assets/[name].[ext]',
      },
    },
  },
});
