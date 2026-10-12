import request from '@/utils/request'

export function getAdminAiKnowledgePage(params) {
  return request({ url: '/admin/ai-knowledge', method: 'get', params })
}

export function getAdminAiKnowledgeDetail(id) {
  return request({ url: `/admin/ai-knowledge/${id}`, method: 'get' })
}

export function createAdminAiKnowledge(data) {
  return request({ url: '/admin/ai-knowledge', method: 'post', data, silentError: true })
}

export function updateAdminAiKnowledge(id, data) {
  return request({ url: `/admin/ai-knowledge/${id}`, method: 'put', data, silentError: true })
}

export function updateAdminAiKnowledgeStatus(id, status) {
  return request({ url: `/admin/ai-knowledge/${id}/status`, method: 'put', params: { status }, silentError: true })
}

export function deleteAdminAiKnowledge(id) {
  return request({ url: `/admin/ai-knowledge/${id}`, method: 'delete', silentError: true })
}
