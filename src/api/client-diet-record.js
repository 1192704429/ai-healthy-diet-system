import request from '@/utils/request'

export function getDietRecords(params) {
  return request({
    url: '/client/diet-record',
    method: 'get',
    params,
    authType: 'client',
    silentError: true
  })
}

export function addManualDietRecord(data) {
  return request({
    url: '/client/diet-record/manual',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}

export function parseDietRecord(data) {
  return request({
    url: '/client/diet-record/parse',
    method: 'post',
    data,
    authType: 'client',
    silentError: true
  })
}
