<template>
  <div :class="{'has-logo':showLogo}">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :background-color="variables.menuBg"
          :text-color="variables.menuText"
          :unique-opened="false"
          :active-text-color="variables.menuActiveText"
          :collapse-transition="false"
          mode="vertical"
      >
        <!-- 修改：使用动态路由 -->
        <sidebar-item
            v-for="(route, index) in filteredRoutes"
            :key="`${route.path}-${index}-${filteredRoutes.length}`"
            :item="route"
            :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/styles/variables.scss'

export default {
  components: {SidebarItem, Logo},
  computed: {
    ...mapGetters([
      'sidebar',
      // 新增：获取动态路由
      'dynamicRoutes'
    ]),
    // 获取路由更新时间，用于强制更新
    routeUpdateTime() {
      return this.$store.state.app._routeUpdateTime || 0
    },
    // 过滤出需要显示的路由（排除 hidden: true 的路由）
    filteredRoutes() {
      // 使用 routeUpdateTime 确保响应式更新
      const updateTime = this.routeUpdateTime
      const routes = this.dynamicRoutes || []
      return routes.filter(route => {
        // 排除 hidden 为 true 的路由
        if (route.hidden) {
          return false
        }
        // 只显示有 children 的路由，或者有 meta.title 的路由
        return (route.children && route.children.length > 0) || (route.meta && route.meta.title)
      })
    },
    activeMenu() {
      const route = this.$route
      const {meta, path} = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    }
  },
  watch: {
    // 监听路由更新时间，确保组件更新
    routeUpdateTime() {
      // 当路由更新时间变化时，强制更新组件
      this.$nextTick(() => {
        this.$forceUpdate()
      })
    },
    // 监听动态路由变化，确保组件更新
    dynamicRoutes: {
      handler(newVal, oldVal) {
        // 当路由变化时，强制更新组件
        const newLength = newVal ? newVal.length : 0
        const oldLength = oldVal ? oldVal.length : 0
        if (newLength !== oldLength) {
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
