import request from '@/utils/request'

/**
 * 后台登录接口
 * @param data
 * @returns {*}
 */
export function login(data) {
  return request({
    url: '/admin_user/login',
    method: 'post',
    data,
    silentError: true
  })
}

/**
 * 获取用户信息接口
 * @param token
 * @returns {*}
 */
export function getInfo(token) {
  return request({
    url: '/admin_user/login/info',
    method: 'get',
    params: { token }
  })
}

/**
 * 退出登录接口
 * @returns {*}
 */
export function logout() {
  return request({
    url: '/admin_user/login/logout',
    method: 'get'
  })
}


/**
 * 获取验证码接口
 * @param cacheKey
 * @returns {*}
 */
export function getCaptcha(cacheKey) {
  return request({
    url: `/captcha/getCaptcha/${cacheKey}`,
    method: 'get',
    responseType: 'blob' // 验证码通常图片，需要设置为 blob
  })
}

/**
 * 获取用户信息
 * @param id
 * @returns {*}
 */
export function getUserInfo(id) {
  return request({
    url: '/admin_user/login/getUserInfoById?id=' + id,
    method: 'get'
  })
}

/**
 * 更新用户信息
 * @param data
 * @returns {*}
 */
export function updateUserInfo(data) {
  return request({
    url: '/admin_user/login/updateUserInfo',
    method: 'post',
    data
  })
}

/**
 * 修改密码
 * @param data
 * @returns {*}
 */
export function changePassword(data) {
  return request({
    url: '/admin_user/login/updatePassword',
    method: 'post',
    data
  })
}
