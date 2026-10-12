import request from '@/utils/request'

export function getHealthTrend(params) {
  return request({
    url: '/client/health-trend',
    method: 'get',
    params,
    authType: 'client',
    silentError: true
  })
}
