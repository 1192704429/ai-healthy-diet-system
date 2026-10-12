import request from '@/utils/request'

export function getMealPlanList(params) {
  return request({
    url: '/client/meal-plan/list',
    method: 'get',
    params,
    paramsSerializer(query) {
      const search = []
      Object.keys(query || {}).forEach(key => {
        const value = query[key]
        if (value === undefined || value === null || value === '') {
          return
        }
        if (Array.isArray(value)) {
          value.forEach(item => {
            search.push(encodeURIComponent(key) + '=' + encodeURIComponent(item))
          })
          return
        }
        search.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
      })
      return search.join('&')
    },
    authType: 'client',
    silentError: true
  })
}

export function getMealPlanDetail(id) {
  return request({
    url: '/client/meal-plan/' + id,
    method: 'get',
    authType: 'client',
    silentError: true
  })
}
