import request from '@/utils/request'

export function getHealthProfile() {
  return request({
    url: '/client/health-profile',
    method: 'get',
    authType: 'client'
  })
}

export function getIndicatorGroup(params) {
  return request({
    url: '/client/health-profile/indicators',
    method: 'get',
    params,
    authType: 'client'
  })
}

export function saveIndicators(data) {
  return request({
    url: '/client/health-profile/indicators',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}

export function saveHealthGoal(data) {
  return request({
    url: '/client/health-profile/goal',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}

export function saveDietPreferences(data) {
  return request({
    url: '/client/health-profile/preferences',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}
