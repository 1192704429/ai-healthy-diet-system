import Cookies from 'js-cookie'

const state = {
  sidebar: {
    opened: Cookies.get('sidebarStatus') ? !!+Cookies.get('sidebarStatus') : true,
    withoutAnimation: false
  },
  device: 'desktop',
  // 新增：存储动态路由
  dynamicRoutes: [],
  // 新增：存储当前路由对应的角色，用于检测角色变化
  currentRouteRole: ''
}

const mutations = {
  TOGGLE_SIDEBAR: state => {
    state.sidebar.opened = !state.sidebar.opened
    state.sidebar.withoutAnimation = false
    if (state.sidebar.opened) {
      Cookies.set('sidebarStatus', 1)
    } else {
      Cookies.set('sidebarStatus', 0)
    }
  },
  CLOSE_SIDEBAR: (state, withoutAnimation) => {
    Cookies.set('sidebarStatus', 0)
    state.sidebar.opened = false
    state.sidebar.withoutAnimation = withoutAnimation
  },
  TOGGLE_DEVICE: (state, device) => {
    state.device = device
  },
  // 新增：设置动态路由
  SET_DYNAMIC_ROUTES: (state, routes) => {
    // 使用新数组确保响应式更新
    state.dynamicRoutes = routes ? [...routes] : []
    // 添加时间戳确保 Vue 能检测到变化
    state._routeUpdateTime = Date.now()
  },
  // 新增：设置当前路由对应的角色
  SET_CURRENT_ROUTE_ROLE: (state, role) => {
    state.currentRouteRole = role
  }
}

const actions = {
  toggleSideBar({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },
  closeSideBar({ commit }, { withoutAnimation }) {
    commit('CLOSE_SIDEBAR', withoutAnimation)
  },
  toggleDevice({ commit }, device) {
    commit('TOGGLE_DEVICE', device)
  },
  // 新增：设置动态路由的 action
  setDynamicRoutes({ commit }, routes) {
    commit('SET_DYNAMIC_ROUTES', routes)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
