import request from '@/utils/request'

export function checkAdminHealthGoalName(params) {
  return request({ url: '/admin/health-goals/name-available', method: 'get', params, silentError: true })
}

export function getAdminHealthGoalPage(params) {
  return request({ url: '/admin/health-goals', method: 'get', params })
}

export function getAdminHealthGoalDetail(id) {
  return request({ url: `/admin/health-goals/${id}`, method: 'get' })
}

export function createAdminHealthGoal(data) {
  return request({ url: '/admin/health-goals', method: 'post', data, silentError: true })
}

export function updateAdminHealthGoal(id, data) {
  return request({ url: `/admin/health-goals/${id}`, method: 'put', data, silentError: true })
}

export function updateAdminHealthGoalStatus(id, status) {
  return request({ url: `/admin/health-goals/${id}/status`, method: 'put', params: { status }, silentError: true })
}

export function deleteAdminHealthGoal(id) {
  return request({ url: `/admin/health-goals/${id}`, method: 'delete', silentError: true })
}
