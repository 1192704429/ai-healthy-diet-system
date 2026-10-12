import request from '@/utils/request'

export function getDailyPlan(params) {
  return request({
    url: '/client/daily-plan',
    method: 'get',
    params,
    authType: 'client',
    silentError: true
  })
}

export function generateDailyPlan(data) {
  return request({
    url: '/client/daily-plan/generate',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}

export function saveDailyPlan(data) {
  return request({
    url: '/client/daily-plan/save',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}
