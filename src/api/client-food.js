import request from '@/utils/request'

export function getFoodCategories() {
  return request({
    url: '/client/food/categories',
    method: 'get',
    authType: 'client'
  })
}

export function getFoodList(params) {
  return request({
    url: '/client/food/list',
    method: 'get',
    params,
    authType: 'client',
    silentError: true
  })
}

export function getFoodDetail(id) {
  return request({
    url: '/client/food/' + id,
    method: 'get',
    authType: 'client',
    silentError: true
  })
}
