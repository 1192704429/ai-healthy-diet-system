import request from '@/utils/request'

export function getNutritionAnalysis(params) {
  return request({
    url: '/client/nutrition-analysis',
    method: 'get',
    params,
    authType: 'client',
    silentError: true
  })
}
