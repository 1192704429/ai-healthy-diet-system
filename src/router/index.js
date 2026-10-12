import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* 布局组件 */
import Layout from '@/layout'


/**
 * 常量路由
 * 不需要权限的基础页面
 * 所有角色都可以访问
 */
export const constantRoutes = [
  // 用户相关
  {
    path: '/',
    redirect: '/user/home',
    hidden: true
  },
  {
    path: '/user/login',
    component: () => import('@/views/client/login'),
    hidden: true,
    meta: {
      title: '用户登录',
      appType: 'client',
      requiresAuth: false
    }
  },
  {
    path: '/user/register',
    component: () => import('@/views/client/register'),
    hidden: true,
    meta: {
      title: '注册',
      appType: 'client',
      requiresAuth: false
    }
  },
  // 管理员相关
  {
    path: '/login',
    redirect: '/admin/login',
    hidden: true
  },
  {
    path: '/admin/login',
    component: () => import('@/views/login/index'),
    hidden: true,
    meta: { title: '管理员登录', appType: 'admin' }
  },
  {
    // 管理员首页（兼容旧地址，不在侧栏展示）
    path: '/index',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        name: '首页',
        component: () => import('@/views/index/index'),
        meta: { title: '首页', icon: 'dashboard' }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },
]

/**
 * 异步路由
 * 需要根据角色动态添加的路由
 */
const adminPage = () => import('@/views/index/index')

export const asyncRoutes = [
  {
    path: '/admin-data-statistics',
    component: Layout,
    meta: { title: '数据统计分析', icon: 'dashboard', roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'AdminDataStatistics',
        component: () => import('@/views/admin/data-statistics'),
        meta: { title: '数据统计分析', icon: 'dashboard', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/admin-article-list',
    component: Layout,
    meta: { title: '文章', icon: 'form', roles: ['admin'] },
    children: [{ path: '', name: 'AdminArticleList', component: () => import('@/views/admin/article-list'), meta: { title: '文章', roles: ['admin'] } }]
  },
  {
    path: '/admin-food-list',
    component: Layout,
    meta: { title: '食物', icon: 'table', roles: ['admin'] },
    children: [{ path: '', name: 'AdminFoodList', component: () => import('@/views/admin/food-list'), meta: { title: '食物', roles: ['admin'] } }]
  },
  {
    path: '/admin-meal-plan-list',
    component: Layout,
    meta: { title: '饮食方案', icon: 'form', roles: ['admin'] },
    children: [{ path: '', name: 'AdminMealPlanList', component: () => import('@/views/admin/meal-plan-list'), meta: { title: '饮食方案', roles: ['admin'] } }]
  },
  {
    path: '/admin-diet-record-list',
    component: Layout,
    meta: { title: '饮食记录', icon: 'nested', roles: ['admin'] },
    children: [{ path: '', name: 'AdminDietRecordList', component: () => import('@/views/admin/diet-record-list'), meta: { title: '饮食记录', roles: ['admin'] } }]
  },
  {
    path: '/admin-health-goal-list',
    component: Layout,
    meta: { title: '健康目标', icon: 'example', roles: ['admin'] },
    children: [{ path: '', name: 'AdminHealthGoalList', component: () => import('@/views/admin/health-goal-list'), meta: { title: '健康目标', roles: ['admin'] } }]
  },
  {
    path: '/admin-health-profile-list',
    component: Layout,
    meta: { title: '健康档案', icon: 'user', roles: ['admin'] },
    children: [{ path: '', name: 'AdminHealthProfileList', component: () => import('@/views/admin/health-profile-list'), meta: { title: '健康档案', roles: ['admin'] } }]
  },
  {
    path: '/admin-diet-preference-list',
    component: Layout,
    meta: { title: '饮食偏好', icon: 'nested', roles: ['admin'] },
    children: [{ path: '', name: 'AdminDietPreferenceList', component: () => import('@/views/admin/diet-preference-list'), meta: { title: '饮食偏好', roles: ['admin'] } }]
  },
  {
    path: '/admin-ai-knowledge-list',
    component: Layout,
    meta: { title: 'AI知识库', icon: 'link', roles: ['admin'] },
    children: [{ path: '', name: 'AdminAiKnowledgeList', component: () => import('@/views/admin/ai-knowledge-list'), meta: { title: 'AI知识库', roles: ['admin'] } }]
  },
]

/**
 * 用户端路由
 * 统一挂在用户端布局 @/layout/client 下，meta.appType 固定为 'client'，
 * 由 permission.js 按 appType 走独立的用户端鉴权流程。
 * meta.requiresAuth 控制是否需要登录后才能访问。
 */
export const clientAsyncRoutes = [
  {
    path: '/user',
    component: () => import('@/layout/client'),
    redirect: '/user/home',
    hidden: true,
    meta: { appType: 'client' },
    children: [
      {
        path: 'home',
        name: 'ClientHome',
        component: () => import('@/views/client/home'),
        meta: { title: '首页', appType: 'client', requiresAuth: true, showInHeader: true }
      },
      {
        path: 'food-library',
        name: 'ClientFoodLibrary',
        component: () => import('@/views/client/food-library'),
        meta: { title: '食物库', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'diet', navGroupTitle: '饮食管理' }
      },
      {
        path: 'food-detail',
        name: 'ClientFoodDetail',
        component: () => import('@/views/client/food-detail'),
        meta: { title: '食物详情', appType: 'client', requiresAuth: true }
      },
      {
        path: 'diet-record',
        name: 'ClientDietRecord',
        component: () => import('@/views/client/diet-record'),
        meta: { title: '饮食记录', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'diet', navGroupTitle: '饮食管理' }
      },
      {
        path: 'meal-plan',
        name: 'ClientMealPlan',
        component: () => import('@/views/client/meal-plan'),
        meta: { title: '饮食方案', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'diet', navGroupTitle: '饮食管理' }
      },
      {
        path: 'diet-plan-generate',
        name: 'ClientDietPlanGenerate',
        component: () => import('@/views/client/diet-plan-generate'),
        meta: { title: 'AI生成饮食计划', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'ai', navGroupTitle: 'AI助手' }
      },
      {
        path: 'nutrition-analysis',
        name: 'ClientNutritionAnalysis',
        component: () => import('@/views/client/nutrition-analysis'),
        meta: { title: '营养分析', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'health', navGroupTitle: '健康分析' }
      },
      {
        path: 'health-trend',
        name: 'ClientHealthTrend',
        component: () => import('@/views/client/health-trend'),
        meta: { title: '健康趋势', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'health', navGroupTitle: '健康分析' }
      },
      {
        path: 'ai-qa',
        name: 'ClientAiQa',
        component: () => import('@/views/client/ai-qa'),
        meta: { title: 'AI问答', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'ai', navGroupTitle: 'AI助手' }
      },
      {
        path: 'articles',
        name: 'ClientArticles',
        component: () => import('@/views/client/articles'),
        meta: { title: '健康资讯', appType: 'client', requiresAuth: true, showInHeader: true }
      },
      {
        path: 'article-detail',
        name: 'ClientArticleDetail',
        component: () => import('@/views/client/article-detail'),
        meta: { title: '资讯详情', appType: 'client', requiresAuth: true }
      },
      {
        path: 'health-profile',
        name: 'ClientHealthProfile',
        component: () => import('@/views/client/health-profile'),
        meta: { title: '健康档案', appType: 'client', requiresAuth: true, showInHeader: true, navGroup: 'health', navGroupTitle: '健康分析' }
      },
      {
        path: 'profile',
        name: 'ClientProfile',
        component: () => import('@/views/client/profile'),
        meta: { title: '个人中心', appType: 'client', requiresAuth: true }
      }
    ]
  }
]

const createRouter = () => new Router({
  mode: 'history',
  scrollBehavior: () => ({ y: 0 }),
  routes: [...constantRoutes, ...clientAsyncRoutes]
})

const router = createRouter()

export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}


/**
 * 根据角色添加路由
 * @param {Array} roles - 用户角色数组
 * @returns {Array} - 符合用户角色的可访问路由数组
 */
export function addRoutesByRoles(roles) {
  // 不能用 JSON 深拷贝，会把 component 的函数丢失，导致页面渲染失败
  function cloneRoutes(routes) {
    return routes.map(route => {
      const clonedRoute = {
        ...route,
        meta: route.meta ? { ...route.meta } : undefined
      }
      if (route.children) {
        clonedRoute.children = cloneRoutes(route.children)
      }
      return clonedRoute
    })
  }
  const routePool = cloneRoutes(asyncRoutes)
  // 递归过滤子路由
  function filterChildRoutes(children) {
    if (!children) return [];
    return children.filter(child => {
      let hasAccess = false;
      // 检查当前路由是否有可访问的角色
      if (child.meta && child.meta.roles) {
        hasAccess = roles.some(role => child.meta.roles.includes(role));
      } else {
        hasAccess = true;
      }

      // 递归处理子路由
      if (child.children) {
        const filteredChildren = filterChildRoutes(child.children);
        child.children = filteredChildren;
        // 如果当前路由没有直接访问权限，但子路由有，则认为该路由可访问
        hasAccess = hasAccess || filteredChildren.length > 0;
      }
      return hasAccess;
    });
  }
  const accessedRoutes = routePool.filter(route => {
    const filteredChildren = filterChildRoutes(route.children);
    route.children = filteredChildren;
    // 如果父路由有子路由，或者父路由自身有匹配的角色，则保留该父路由
    const hasRouteAccess = filteredChildren.length > 0;
    return hasRouteAccess;
  });
  // 动态添加可访问的路由到路由实例中
  router.addRoutes(accessedRoutes);
  // 返回符合用户角色的可访问路由数组
  return accessedRoutes;
}

export default router

