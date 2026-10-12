import request from '@/utils/request'

export function getAdminArticleSummary() {
  return request({
    url: '/admin/articles/summary',
    method: 'get',
    silentError: true
  })
}

export function getAdminArticlePage(params) {
  return request({
    url: '/admin/articles',
    method: 'get',
    params
  })
}

export function getAdminArticleDetail(id) {
  return request({
    url: `/admin/articles/${id}`,
    method: 'get'
  })
}

export function createAdminArticle(data) {
  return request({
    url: '/admin/articles',
    method: 'post',
    data,
    silentError: true
  })
}

export function publishAdminArticle(id) {
  return request({
    url: `/admin/articles/${id}/publish`,
    method: 'post',
    silentError: true
  })
}

export function unpublishAdminArticle(id) {
  return request({
    url: `/admin/articles/${id}/unpublish`,
    method: 'post',
    silentError: true
  })
}

export function updateAdminArticle(id, data) {
  return request({
    url: `/admin/articles/${id}`,
    method: 'put',
    data,
    silentError: true
  })
}

export function deleteAdminArticle(id) {
  return request({
    url: `/admin/articles/${id}`,
    method: 'delete',
    silentError: true
  })
}

export function getAdminArticleStats(id) {
  return request({
    url: `/admin/articles/${id}/stats`,
    method: 'get',
    silentError: true
  })
}
