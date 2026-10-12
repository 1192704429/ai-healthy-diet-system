<template>
  <header class="client-header">
    <div class="header-inner">
      <div class="brand" @click="goHome">
        <img
          v-if="clientHeaderLogo"
          :src="clientHeaderLogo"
          alt="logo"
          class="logo-image"
        >
        <div v-else class="logo-placeholder">健</div>
        <span class="title">{{ clientHeaderTitle }}</span>
      </div>

      <el-menu
        mode="horizontal"
        :default-active="activeMenu"
        class="nav-menu"
        @select="handleMenuSelect"
      >
        <template v-for="item in navItems">
          <el-submenu
            v-if="item.children && item.children.length"
            :key="item.index"
            :index="item.index"
            popper-class="client-nav-submenu"
          >
            <template slot="title">{{ item.title }}</template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              {{ child.title }}
            </el-menu-item>
          </el-submenu>
          <el-menu-item
            v-else
            :key="item.path"
            :index="item.path"
            class="nav-item"
          >
            {{ item.title }}
          </el-menu-item>
        </template>
      </el-menu>

      <div class="user-area">
        <template v-if="isLoggedIn">
          <el-dropdown trigger="hover" @command="handleCommand">
            <div class="user-trigger">
              <img v-if="clientAvatar" :src="clientAvatar" alt="avatar" class="avatar-img">
              <div v-else class="avatar">{{ avatarText }}</div>
              <span class="username">{{ clientName || '用户' }}</span>
              <i class="el-icon-arrow-down el-icon--right" />
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="/user/profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="/user/health-profile">健康档案</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
        <template v-else>
          <button class="entry-btn login-btn" @click="$router.push('/user/login')">登录</button>
          <button class="entry-btn register-btn" @click="$router.push('/user/register')">注册</button>
        </template>
      </div>
    </div>
  </header>
</template>

<script>
import { clientAsyncRoutes } from '@/router'
import defaultSettings from '@/settings'

export default {
  name: 'ClientHeader',
  computed: {
    clientHeaderTitle() {
      return defaultSettings.clientTitle || '个性化健康饮食'
    },
    clientHeaderLogo() {
      return defaultSettings.clientLogo || ''
    },
    clientName() {
      return this.$store.getters.clientName
    },
    clientAvatar() {
      return this.$store.getters.clientAvatar
    },
    isLoggedIn() {
      return Boolean(this.$store.getters.clientToken)
    },
    activeMenu() {
      return this.$route.path
    },
    menuRoutes() {
      const staticUserRoot = clientAsyncRoutes.find(route => route.path === '/user')
      const optionsRoutes = this.$router.options.routes || []
      const runtimeUserRoot = optionsRoutes.find(route => route.path === '/user')
      const userRoot = staticUserRoot || runtimeUserRoot
      const children = (userRoot && userRoot.children) || []
      return children
        .map(route => ({
          ...route,
          path: route.path.startsWith('/user/') ? route.path : `/user/${route.path}`
        }))
        .filter(route => {
          const meta = route.meta || {}
          if (!meta.showInHeader) return false
          if (meta.requiresAuth && !this.isLoggedIn) return false
          return true
        })
    },
    navItems() {
      const groupOrder = ['diet', 'health', 'ai']
      const groups = {}
      const items = []
      this.menuRoutes.forEach(route => {
        const meta = route.meta || {}
        const title = meta.navTitle || meta.title || route.name
        if (meta.navGroup) {
          if (!groups[meta.navGroup]) {
            groups[meta.navGroup] = {
              index: `group-${meta.navGroup}`,
              title: meta.navGroupTitle || title,
              children: []
            }
          }
          groups[meta.navGroup].children.push({
            path: route.path,
            title
          })
          return
        }
        items.push({
          path: route.path,
          title
        })
      })
      const grouped = groupOrder
        .filter(key => groups[key] && groups[key].children.length)
        .map(key => groups[key])
      const home = items.find(item => item.path === '/user/home')
      const rest = items.filter(item => item.path !== '/user/home')
      return [home, ...grouped, ...rest].filter(Boolean)
    },
    avatarText() {
      if (!this.clientName) return 'U'
      return this.clientName.slice(0, 1).toUpperCase()
    }
  },
  methods: {
    handleMenuSelect(path) {
      if (path !== this.$route.path) {
        this.$router.push(path)
      }
    },
    async handleCommand(command) {
      if (command === 'logout') {
        await this.$store.dispatch('clientUser/logout')
        this.$router.replace('/user/login')
        return
      }
      this.$router.push(command)
    },
    goHome() {
      this.$router.push('/user/home')
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../client-theme.scss";

.client-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 60px;
  background: linear-gradient(90deg, $client-header-bg-start 0%, $client-header-bg-end 100%);
  box-shadow: 0 4px 14px $client-header-shadow;
}

.header-inner {
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.logo-image,
.logo-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #c8e6c9 0%, #a5d6a7 100%);
  color: #2e7d32;
  font-weight: 600;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: $client-header-title;
  letter-spacing: 1px;
}

.nav-menu.el-menu--horizontal {
  border-bottom: none;
  background-color: transparent;
}

.nav-menu ::v-deep .el-menu-item {
  position: relative;
  height: 60px;
  line-height: 60px;
  color: $client-header-menu;
  background-color: transparent;
  border-bottom: none !important;
  transition: color 0.25s ease, transform 0.25s ease;
}

.nav-menu ::v-deep .el-menu-item:hover {
  color: $client-header-menu-hover !important;
  transform: translateY(-1px);
}

.nav-menu ::v-deep .el-menu-item::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 8px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, $client-header-menu-line-start, $client-header-menu-line-end);
  transform: scaleX(0);
  transition: transform 0.25s ease;
}

.nav-menu ::v-deep .el-menu-item:hover::after,
.nav-menu ::v-deep .el-menu-item.is-active::after {
  transform: scaleX(1);
}

.nav-menu ::v-deep .el-menu-item.is-active {
  color: $client-header-menu-active !important;
}

.nav-menu ::v-deep .el-submenu__title {
  height: 60px;
  line-height: 60px;
  color: $client-header-menu;
  background-color: transparent !important;
  border-bottom: none !important;
}

.nav-menu ::v-deep .el-submenu__title:hover,
.nav-menu ::v-deep .el-submenu.is-active > .el-submenu__title {
  color: $client-header-menu-active !important;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 20px;
  transition: background-color 0.25s ease;
}

.user-trigger:hover {
  background-color: rgba(232, 245, 233, 0.9);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(120deg, #c8e6c9 0%, #a5d6a7 100%);
  color: #2e7d32;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 6px rgba(197, 139, 152, 0.25);
}

.username {
  color: #3f6b44;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-btn {
  border: none;
  outline: none;
  border-radius: 20px;
  padding: 7px 16px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.25s ease;
}

.login-btn {
  background: #ffffff;
  color: #2e7d32;
}

.login-btn:hover {
  background: #e8f5e9;
}

.register-btn {
  color: #ffffff;
  background: linear-gradient(90deg, #2e7d32 0%, #66bb6a 100%);
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(46, 125, 50, 0.28);
}
</style>
