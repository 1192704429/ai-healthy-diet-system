import request from '@/utils/request'

export function getAdminStatOverview(params) {
  return request({ url: '/admin/statistics/overview', method: 'get', params, silentError: true })
}

export function getAdminStatUserTrend(params) {
  return request({ url: '/admin/statistics/user-trend', method: 'get', params, silentError: true })
}

export function getAdminStatDietTrend(params) {
  return request({ url: '/admin/statistics/diet-trend', method: 'get', params, silentError: true })
}

export function getAdminStatContentDist(params) {
  return request({ url: '/admin/statistics/content-dist', method: 'get', params, silentError: true })
}
