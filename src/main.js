import Vue from 'vue' // 导入vue

import ElementUI from 'element-ui' // 导入element-ui
import 'element-ui/lib/theme-chalk/index.css' // 导入element-ui的样式

import '@/styles/index.scss' // 自定义css样式

import App from './App' // 根组件
import store from './store' // 状态管理
import router from './router' // 具体路由项
import plugins from './plugins' // plugins插件

import '@/icons' // icon小图标
import '@/permission' // 路由权限守卫
import * as echarts from 'echarts'; // 导入echarts  
Vue.prototype.$echarts = echarts; // 挂载到vue原型上
   
// 使用element-ui
Vue.use(ElementUI)
Vue.use(plugins)
Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
