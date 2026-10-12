import request from '@/utils/request'

export function getAdminHealthProfileSummary() {
  return request({ url: '/admin/health-profiles/summary', method: 'get', silentError: true })
}

export function getAdminHealthProfilePage(params) {
  return request({ url: '/admin/health-profiles', method: 'get', params })
}

export function getAdminHealthProfileDetail(userId) {
  return request({ url: `/admin/health-profiles/${userId}`, method: 'get', silentError: true })
}

export function getAdminHealthProfileAnalysis(userId) {
  return request({ url: `/admin/health-profiles/${userId}/analysis`, method: 'get', silentError: true })
}
