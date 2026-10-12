import request from '@/utils/request'

export function getAdminMealPlanGoals() {
  return request({ url: '/admin/meal-plans/goals', method: 'get' })
}

export function getAdminMealPlanPage(params) {
  return request({ url: '/admin/meal-plans', method: 'get', params })
}

export function getAdminMealPlanDetail(id) {
  return request({ url: `/admin/meal-plans/${id}`, method: 'get' })
}

export function createAdminMealPlan(data) {
  return request({ url: '/admin/meal-plans', method: 'post', data, silentError: true })
}

export function updateAdminMealPlan(id, data) {
  return request({ url: `/admin/meal-plans/${id}`, method: 'put', data, silentError: true })
}

export function deleteAdminMealPlan(id) {
  return request({ url: `/admin/meal-plans/${id}`, method: 'delete', silentError: true })
}

export function onShelfAdminMealPlan(id) {
  return request({ url: `/admin/meal-plans/${id}/on`, method: 'post', silentError: true })
}

export function offShelfAdminMealPlan(id) {
  return request({ url: `/admin/meal-plans/${id}/off`, method: 'post', silentError: true })
}
