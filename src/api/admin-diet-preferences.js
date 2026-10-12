import request from '@/utils/request'

export function checkAdminDietPreferenceName(params) {
  return request({ url: '/admin/diet-preferences/name-available', method: 'get', params, silentError: true })
}

export function getAdminDietPreferencePage(params) {
  return request({ url: '/admin/diet-preferences', method: 'get', params })
}

export function getAdminDietPreferenceDetail(id) {
  return request({ url: `/admin/diet-preferences/${id}`, method: 'get' })
}

export function createAdminDietPreference(data) {
  return request({ url: '/admin/diet-preferences', method: 'post', data, silentError: true })
}

export function updateAdminDietPreference(id, data) {
  return request({ url: `/admin/diet-preferences/${id}`, method: 'put', data, silentError: true })
}

export function updateAdminDietPreferenceStatus(id, status) {
  return request({ url: `/admin/diet-preferences/${id}/status`, method: 'put', params: { status }, silentError: true })
}

export function deleteAdminDietPreference(id) {
  return request({ url: `/admin/diet-preferences/${id}`, method: 'delete', silentError: true })
}
