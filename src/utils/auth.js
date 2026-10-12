import Cookies from 'js-cookie'

// 存储token的key
const TokenKey = 'personal_health_diet'

export function getToken() {
  return localStorage.getItem(TokenKey) || Cookies.get(TokenKey)
}

export function setToken(token) {
  localStorage.setItem(TokenKey, token)
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  localStorage.removeItem(TokenKey)
  return Cookies.remove(TokenKey)
}
