import request from '@/utils/request'

export function getAdminFoodSummary() {
  return request({ url: '/admin/foods/summary', method: 'get', silentError: true })
}

export function getAdminFoodCategories() {
  return request({ url: '/admin/foods/categories', method: 'get' })
}

export function checkAdminFoodName(params) {
  return request({ url: '/admin/foods/name-available', method: 'get', params, silentError: true })
}

export function getAdminFoodPage(params) {
  return request({ url: '/admin/foods', method: 'get', params })
}

export function getAdminFoodDetail(id) {
  return request({ url: `/admin/foods/${id}`, method: 'get' })
}

export function createAdminFood(data) {
  return request({ url: '/admin/foods', method: 'post', data, silentError: true })
}

export function updateAdminFood(id, data) {
  return request({ url: `/admin/foods/${id}`, method: 'put', data, silentError: true })
}

export function deleteAdminFood(id) {
  return request({ url: `/admin/foods/${id}`, method: 'delete', silentError: true })
}

export function onShelfAdminFood(id) {
  return request({ url: `/admin/foods/${id}/on`, method: 'post', silentError: true })
}

export function offShelfAdminFood(id) {
  return request({ url: `/admin/foods/${id}/off`, method: 'post', silentError: true })
}
