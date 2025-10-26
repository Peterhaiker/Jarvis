import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'bootstrap-icons/font/bootstrap-icons.css';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'dayjs/locale/zh-cn'
//引入svg组件
import 'virtual:svg-icons-register'
import SvgIcon from './components/SvgIcon.vue';
//引入google inter字体
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
//引入pinia
import { createPinia } from 'pinia'
//引入katex（表格美化css）
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

//创建pinia实例
const pinia = createPinia()

createApp(App).use(pinia).use(ElementPlus, {
  locale: zhCn,
}).component('SvgIcon',SvgIcon).mount('#app')
