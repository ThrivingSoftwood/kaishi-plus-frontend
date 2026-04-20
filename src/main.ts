import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css' // 👈 新增：引入暗黑模式变量

import { createApp } from 'vue'
import { createPinia } from 'pinia'


import App from './App.vue'
import router from './router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { hasPerm } from './directives/hasPerm'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(createPinia())
app.use(router)
// 🌟 注册全局自定义指令
app.directive('hasPerm', hasPerm)

app.mount('#app')
