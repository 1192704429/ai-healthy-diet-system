<!-- 面包屑导航组件 -->
<template>
  <!-- 元素 UI 面包屑导航组件，类名为 app-breadcrumb，分隔符为 / -->
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <!-- 过渡组，名称为 breadcrumb -->
    <transition-group name="breadcrumb">
      <!-- 循环遍历 levelList 数组，生成面包屑导航项 -->
      <el-breadcrumb-item v-for="(item,index) in levelList" :key="item.path">
        <!-- 如果路由重定向为 noRedirect 或者是最后一项，则显示不可点击的文本 -->
        <span v-if="item.redirect==='noRedirect'||index==levelList.length-1" class="no-redirect">{{ item.meta.title }}</span>
        <!-- 否则显示可点击的链接 -->
        <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script>
// 导入 path-to-regexp 库，用于处理路径正则表达式
import pathToRegexp from 'path-to-regexp'
// 导入项目设置文件
import settings from '@/settings'

export default {
  // 组件数据
  data() {
    return {
      // 存储面包屑导航项的数组
      levelList: null
    }
  },
  // 监听路由变化
  watch: {
    $route() {
      // 路由变化时重新获取面包屑导航项
      this.getBreadcrumb()
    }
  },
  // 组件创建时执行
  created() {
    // 初始化时获取面包屑导航项
    this.getBreadcrumb()
  },
  // 组件方法
  methods: {
    // 获取面包屑导航项
    getBreadcrumb() {
      // 过滤出具有 meta.title 的路由匹配项
      let matched = this.$route.matched.filter(item => item.meta && item.meta.title)
      // 获取第一个匹配项
      const first = matched[0]

      // 如果第一个匹配项不是仪表盘页面，则添加仪表盘项
      if (!this.isDashboard(first)) {
        // 检查 matched 中是否已经包含 /index 路径，避免重复添加
        const hasIndexPath = matched.some(item => item.path === '/index' || item.path === '/index/')
        if (!hasIndexPath) {
          matched = [{ path: '/index', meta: { title: settings.headerTitle }}].concat(matched)
        }
      }

      // 过滤出需要显示的面包屑导航项
      this.levelList = matched.filter(item => item.meta && item.meta.title && item.meta.breadcrumb !== false)
    },
    // 判断是否为仪表盘页面
    isDashboard(route) {
      if (!route) {
        return false
      }
      // 获取路由名称和路径
      const name = route.name
      const path = route.path
      // 检查路由名称是否为 index（忽略大小写）
      if (name) {
        const nameLower = name.trim().toLocaleLowerCase()
        if (nameLower === 'index'.toLocaleLowerCase()) {
          return true
        }
      }
      // 检查路径是否为 /index
      if (path === '/index' || path === '/index/') {
        return true
      }
      return false
    },
    // 编译路径，解决路径参数问题
    pathCompile(path) {
      // 参考问题：https://github.com/PanJiaChen/vue-element-admin/issues/561
      // 获取当前路由的参数
      const { params } = this.$route
      // 编译路径
      var toPath = pathToRegexp.compile(path)
      // 返回编译后的路径
      return toPath(params)
    },
    // 处理面包屑导航项的点击事件
    handleLink(item) {
      // 获取路由的重定向路径和原始路径
      const { redirect, path } = item
      // 如果有重定向路径，则跳转到重定向路径
      if (redirect) {
        this.$router.push(redirect)
        return
      }
      // 否则跳转到编译后的路径
      this.$router.push(this.pathCompile(path))
    }
  }
}
</script>

<style lang="scss" scoped>
/* 面包屑导航样式 */
.app-breadcrumb.el-breadcrumb {
  // 内联块级元素显示
  display: inline-block;
  // 字体大小为 14px
  font-size: 14px;
  // 行高为 50px
  line-height: 50px;
  // 左边距为 8px
  margin-left: 8px;

  // 不可点击的面包屑导航项样式
  .no-redirect {
    // 文字颜色为 #97a8be
    color: #97a8be;
    // 鼠标指针为文本样式
    cursor: text;
  }
}
</style>