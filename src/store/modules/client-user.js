import { clientLogin, clientLogout, clientGetInfo, clientRegister, updateClientProfile, clientUpdatePassword } from '@/api/client-user'
import { getClientToken, setClientToken, removeClientToken } from '@/utils/client-auth'

const getDefaultState = () => {
  return {
    token: getClientToken(),
    id: '',
    name: '',
    avatar: ''
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: state => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_ID: (state, id) => {
    state.id = id
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  }
}

const actions = {
  login({ commit }, loginForm) {
    return new Promise((resolve, reject) => {
      const payload = {
        username: (loginForm.username || '').trim(),
        password: loginForm.password || ''
      }
      clientLogin(payload).then(response => {
        const data = response && response.data ? response.data : {}
        const token = data.token || ''
        const role = data.role || 'user'
        if (role === 'admin') {
          return reject(new Error('管理员请使用管理端登录入口'))
        }
        commit('SET_TOKEN', token)
        setClientToken(token)
        commit('SET_ID', data.id)
        commit('SET_NAME', data.name)
        commit('SET_AVATAR', data.avatar || '')
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  register(_, registerForm) {
    return new Promise((resolve, reject) => {
      const payload = {
        username: (registerForm.username || '').trim(),
        password: registerForm.password || ''
      }
      clientRegister(payload).then(() => {
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  updateInfo({ commit }, profileForm) {
    return new Promise((resolve, reject) => {
      updateClientProfile({
        nickname: (profileForm.name || '').trim(),
        avatar: (profileForm.avatar || '').trim()
      }).then(() => {
        commit('SET_NAME', (profileForm.name || '').trim())
        commit('SET_AVATAR', (profileForm.avatar || '').trim())
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  updatePassword(_, passwordForm) {
    return new Promise((resolve, reject) => {
      clientUpdatePassword({
        oldPassword: passwordForm.oldPassword || '',
        newPassword: passwordForm.newPassword || ''
      }).then(() => {
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  getInfo({ commit }) {
    return new Promise((resolve, reject) => {
      clientGetInfo().then(response => {
        const { data } = response
        if (!data) {
          return reject('用户端鉴权失败，请重新登录')
        }
        commit('SET_ID', data.id)
        commit('SET_NAME', data.name)
        commit('SET_AVATAR', data.avatar || '')
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  logout({ commit }) {
    return new Promise(resolve => {
      clientLogout().catch(() => {}).finally(() => {
        removeClientToken()
        try {
          sessionStorage.clear()
        } catch (e) {}
        commit('RESET_STATE')
        resolve()
      })
    })
  },

  resetToken({ commit }) {
    return new Promise(resolve => {
      removeClientToken()
      commit('RESET_STATE')
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
