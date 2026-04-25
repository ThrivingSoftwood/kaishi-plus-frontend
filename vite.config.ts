import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      // 自动导入 Vue 和 Vue-Router 的 API，无需手动 import ref, reactive 等
      imports:['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts' // 为 TS 生成声明文件
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts' // 为 TS 生成声明文件
    }),
  ],
  /* // 增加下面这段 define 配置,可以在生产环境使用 devtool
  define: {
    __VUE_PROD_DEVTOOLS__: true, // 强制在生产环境中启用 devtools
  },*/
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@arch': fileURLToPath(new URL('./src/arch', import.meta.url)),
      '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:6160', // 你的后端地址
        changeOrigin: true,
        // 可选：如果你的后端 context-path 是 /dev 或 /prod
        rewrite: (path) => path.replace(/^\/api/, '/dev'),
        // rewrite: (path) => path.replace(/^\/api/, '/prod'),
      }
    }
  },
  /* // 测试阶段启用
  build: {
    // 🌟 1. 禁用代码压缩混淆
    // 设置为 false 后，打包出的 JS 将保留原始的变量名、空格和缩进
    minify: false,

    // 🌟 2. 开启 SourceMap (源码映射)
    // 这会在 dist 目录下生成 .js.map 文件。
    // 浏览器 F12 调试时，能直接定位到你原始的 .ts 源码行数，而不是打包后的一团乱麻
    sourcemap: true,

    // 🌟 3. (可选) 禁用 CSS 代码压缩
    cssMinify: false,

    // 🌟 4. 防止将小的静态资源内联为 base64
    // 这样你能清晰地看到静态资源的请求路径
    assetsInlineLimit: 0,
  } */
})
