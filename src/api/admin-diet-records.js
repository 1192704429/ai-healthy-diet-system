import request from '@/utils/request'

export function getAdminDietRecordSummary(params) {
  return request({ url: '/admin/diet-records/summary', method: 'get', params, silentError: true })
}

export function getAdminDietRecordPage(params) {
  return request({ url: '/admin/diet-records', method: 'get', params })
}

export function getAdminDietRecordDetail(id) {
  return request({ url: `/admin/diet-records/${id}`, method: 'get', silentError: true })
}

export function deleteAdminDietRecord(id) {
  return request({ url: `/admin/diet-records/${id}`, method: 'delete', silentError: true })
}
