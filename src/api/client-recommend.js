import request from '@/utils/request'

export function getHomeRecommend() {
  return request({
    url: '/client/recommend',
    method: 'get',
    authType: 'client'
  })
}

export function recordRecommendClick(data) {
  return request({
    url: '/client/recommend/click',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}
