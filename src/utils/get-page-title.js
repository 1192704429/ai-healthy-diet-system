import defaultSettings from '@/settings'

const title = defaultSettings.title || 'Vue Admin Template'

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - 个性化健康饮食管理平台`
  }
  return `个性化健康饮食管理平台`
}
