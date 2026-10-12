import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import { getClientToken } from '@/utils/client-auth'
import getPageTitle from '@/utils/get-page-title'
import { addRoutesByRoles, constantRoutes } from './router'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const adminWhiteList = ['/login', '/admin/login']
const clientWhiteList = ['/user/login', '/user/register']

router.beforeEach(async(to, from, next) => {
  // 开始加载进度条
  NProgress.start()

  // 页签标题
  document.title = getPageTitle(to.meta.title)

  const isClientApp = to.matched.some(
      routeRecord => routeRecord.meta && routeRecord.meta.appType === 'client'
  )

  if (isClientApp) {
    const requiresClientAuth = to.matched.some(
        routeRecord => routeRecord.meta && routeRecord.meta.requiresAuth === true
    )
    const hasClientToken = getClientToken()

    // 不需要鉴权的用户端页面直接放行，requiresAuth 字段在这里生效
    if (!requiresClientAuth || clientWhiteList.indexOf(to.path) !== -1) {
      if (to.path === '/user/login' && hasClientToken) {
        next({ path: '/user/home' })
        NProgress.done()
      } else {
        next()
      }
      return
    }

    if (hasClientToken) {
      const hasClientInfo = store.getters.clientName
      if (hasClientInfo) {
        next()
      } else {
        try {
          await store.dispatch('clientUser/getInfo')
          next({ ...to, replace: true })
        } catch (error) {
          await store.dispatch('clientUser/resetToken')
          Message.error('用户端登录状态失效，请重新登录')
          next(`/user/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    } else {
      next(`/user/login?redirect=${to.path}`)
      NProgress.done()
    }
    return
  }

  const hasAdminToken = getToken()
  if (hasAdminToken) {
    if (to.path === '/login' || to.path === '/admin/login') {
      next({ path: '/admin-data-statistics' })
      NProgress.done()
    } else {
      const hasGetUserInfo = store.getters.name
      if (hasGetUserInfo) {
        next()
      } else {
        try {
          await store.dispatch('user/getInfo')
          const role = store.getters.role
          const dynamicRoutes = addRoutesByRoles([role])
          const allRoutes = [...constantRoutes, ...dynamicRoutes]
          await store.dispatch('app/setDynamicRoutes', allRoutes)
          next({ ...to, replace: true })
        } catch (error) {
          await store.dispatch('user/resetToken')
          next('/admin/login')
          NProgress.done()
        }
      }
    }
  } else {
    if (adminWhiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next('/admin/login')
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // 关闭进度条
  NProgress.done()
})
