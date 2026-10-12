const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  role: state => state.user.role,
  id: state => state.user.id,
  dynamicRoutes: state => state.app.dynamicRoutes,
  clientToken: state => state.clientUser.token,
  clientName: state => state.clientUser.name,
  clientId: state => state.clientUser.id,
  clientAvatar: state => state.clientUser.avatar
}
export default getters
