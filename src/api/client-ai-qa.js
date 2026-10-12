import request from '@/utils/request'

export function getAiQaHistory(params) {
  return request({
    url: '/client/ai-qa',
    method: 'get',
    params,
    authType: 'client',
    silentError: true,
    timeout: 20000
  })
}

export function askAiQa(data) {
  return request({
    url: '/client/ai-qa',
    method: 'post',
    data,
    authType: 'client',
    silentError: true,
    timeout: 45000
  })
}

export function createAiQaSession() {
  return request({
    url: '/client/ai-qa/session',
    method: 'post',
    authType: 'client',
    silentError: true,
    timeout: 20000
  })
}
