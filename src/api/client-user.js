import request from '@/utils/request'

export function clientLogin(data) {
  return request({
    url: '/client/login',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}

export function clientRegister(data) {
  return request({
    url: '/client/register',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}

export function clientGetInfo() {
  return request({
    url: '/client/user/info',
    method: 'get',
    authType: 'client'
  })
}

export function getClientProfile() {
  return request({
    url: '/client/profile',
    method: 'get',
    authType: 'client',
    silentError: true
  })
}

export function updateClientProfile(data) {
  return request({
    url: '/client/profile',
    method: 'put',
    data,
    authType: 'client',
    silentError: true
  })
}

export function clientUpdatePassword(data) {
  return request({
    url: '/client/user/password',
    method: 'post',
    data,
    authType: 'client'
  })
}

export function clientLogout() {
  return request({
    url: '/client/logout',
    method: 'post',
    authType: 'client'
  })
}
