import request from '@/utils/request'

export function getArticleList(params) {
  return request({
    url: '/client/articles',
    method: 'get',
    params,
    authType: 'client',
    silentError: true
  })
}

export function getArticleDetail(id) {
  return request({
    url: '/client/articles/' + id,
    method: 'get',
    authType: 'client',
    silentError: true
  })
}

export function likeArticle(id) {
  return request({
    url: '/client/articles/' + id + '/like',
    method: 'post',
    authType: 'client',
    silentError: true
  })
}

export function unlikeArticle(id) {
  return request({
    url: '/client/articles/' + id + '/like',
    method: 'delete',
    authType: 'client',
    silentError: true
  })
}

export function collectArticle(id) {
  return request({
    url: '/client/articles/' + id + '/collect',
    method: 'post',
    authType: 'client',
    silentError: true
  })
}

export function uncollectArticle(id) {
  return request({
    url: '/client/articles/' + id + '/collect',
    method: 'delete',
    authType: 'client',
    silentError: true
  })
}

