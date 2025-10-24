import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//导入自定义svg组件插件
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    createSvgIconsPlugin({
      // 指定存放 SVG 图标的文件夹路径
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      // symbolId 的命名格式，会决定你在前端怎么引用
      symbolId: 'icon-[name]',
    }),
  ],
  resolve: {
    alias: {
        '@': path.resolve(__dirname, 'src'),
    },
  },
})
