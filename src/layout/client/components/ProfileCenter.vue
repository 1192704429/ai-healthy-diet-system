<template>
  <div class="user-info-page">
    <el-card shadow="never" class="user-info-card">
      <div class="page-head">
        <h3 class="section-title">个人中心</h3>
        <p class="section-desc">管理你的账户信息与安全设置</p>
      </div>

      <el-tabs v-model="activeTab" class="cream-tabs">
        <el-tab-pane label="基本信息" name="profile">
          <transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'profile'" class="profile-layout">
              <div class="avatar-area">
                <div class="avatar-box">
                  <img :src="avatarPreview" alt="avatar" class="avatar-img">
                  <div class="avatar-mask">
                    <div class="avatar-upload-inner">
                      <div class="avatar-mask-text">更换头像</div>
                      <img-upload
                        :key="avatarUploadKey"
                        v-model="avatarUploadValue"
                        :limit="1"
                        :file-size="5"
                        :is-show-tip="false"
                        action="/upload/file/url"
                        @input="handleAvatarUploaded"
                      />
                    </div>
                  </div>
                </div>
                <p class="avatar-tip">支持 JPG / PNG，建议 1:1 比例</p>
              </div>

              <el-form
                ref="profileFormRef"
                :model="profileForm"
                :rules="profileRules"
                label-width="95px"
                class="profile-form"
              >
                <el-form-item label="用户ID">
                  <el-input :value="clientId" disabled />
                </el-form-item>
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="profileForm.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="昵称" prop="name">
                  <el-input v-model="profileForm.name" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item>
                  <el-button class="pink-btn" :loading="profileLoading" @click="handleUpdateProfile">保存信息</el-button>
                </el-form-item>
              </el-form>
            </div>
          </transition>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'password'" class="password-panel">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="90px"
                class="password-form"
              >
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" show-password prefix-icon="el-icon-lock" placeholder="请输入原密码" />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" show-password prefix-icon="el-icon-lock" placeholder="请输入新密码" />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" show-password prefix-icon="el-icon-lock" placeholder="请确认新密码" />
                </el-form-item>
                <el-form-item>
                  <el-button class="pink-btn subtle" :loading="passwordLoading" @click="handleUpdatePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </div>
          </transition>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import ImgUpload from '@/components/ImgUpload'

export default {
  name: 'ClientProfile',
  components: {
    ImgUpload
  },
  data() {
    const validateConfirm = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请确认新密码'))
        return
      }
      if (value.length < 6) {
        callback(new Error('密码至少 6 位'))
        return
      }
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的新密码不一致'))
        return
      }
      callback()
    }
    return {
      activeTab: 'profile',
      profileLoading: false,
      passwordLoading: false,
      profileForm: {
        username: '',
        name: '',
        avatar: ''
      },
      avatarUploadValue: '',
      avatarUploadKey: 0,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      profileRules: {
        name: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入旧密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ],
        confirmPassword: [{ validator: validateConfirm, trigger: 'blur' }]
      }
    }
  },
  computed: {
    clientId() {
      return this.$store.getters.clientId
    },
    avatarPreview() {
      return this.profileForm.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },
  created() {
    this.loadInfo()
  },
  methods: {
    async loadInfo() {
      const data = await this.$store.dispatch('clientUser/getInfo')
      this.profileForm.username = data.username || ''
      this.profileForm.name = data.name || ''
      this.profileForm.avatar = data.avatar || ''
      this.avatarUploadValue = ''
      this.avatarUploadKey += 1
    },
    handleAvatarUploaded(val) {
      if (!val) return
      const list = String(val).split(',').filter(Boolean)
      const latest = list[list.length - 1]
      if (latest) {
        this.profileForm.avatar = latest
        this.$message.success('头像已上传，请点击“保存信息”完成更新')
      }
      this.avatarUploadValue = ''
      this.avatarUploadKey += 1
    },
    handleUpdateProfile() {
      this.$refs.profileFormRef.validate(async valid => {
        if (!valid) return
        this.profileLoading = true
        try {
          await this.$store.dispatch('clientUser/updateInfo', this.profileForm)
          this.$message.success('基本信息更新成功')
          await this.loadInfo()
        } finally {
          this.profileLoading = false
        }
      })
    },
    handleUpdatePassword() {
      this.$refs.passwordFormRef.validate(async valid => {
        if (!valid) return
        this.passwordLoading = true
        try {
          await this.$store.dispatch('clientUser/updatePassword', this.passwordForm)
          this.$message.success('密码修改成功，请重新登录')
          await this.$store.dispatch('clientUser/logout')
          this.$router.push('/user/login')
        } finally {
          this.passwordLoading = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../client-theme.scss";

.user-info-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: calc(100vh - 84px);
}

.user-info-card {
  border-radius: 12px;
  border: 1px solid $client-profile-card-border;
  background: $client-profile-card-bg;
  box-shadow: 0 8px 24px $client-profile-card-shadow;
  padding: 4px 10px 12px;
}

.page-head {
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: $client-profile-title;
}

.section-desc {
  margin: 8px 0 0;
  color: $client-profile-subtitle;
  font-size: 14px;
}

.profile-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  padding: 10px 4px 4px;
}

.avatar-area {
  width: 240px;
  text-align: center;
}

.avatar-box {
  width: 176px;
  height: 176px;
  margin: 0 auto;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px solid #d7e3d7;
  box-shadow: 0 6px 18px rgba(46, 125, 50, 0.12);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(46, 125, 50, 0.55);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-box:hover .avatar-mask {
  opacity: 1;
}

.avatar-tip {
  margin-top: 10px;
  color: #ad8795;
  font-size: 12px;
}

.avatar-upload-inner {
  width: 100%;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.avatar-mask-text {
  color: #fff;
  font-size: 14px;
  margin-bottom: 10px;
}

.profile-form {
  width: 100%;
  max-width: 640px;
}

::v-deep .avatar-upload-inner .component-upload-image .el-upload--picture-card {
  width: 66px;
  height: 66px;
  line-height: 66px;
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

::v-deep .avatar-upload-inner .component-upload-image .el-upload-list {
  display: none;
}

.password-panel {
  padding: 12px 0 6px;
  display: flex;
  justify-content: center;
}

.password-form {
  width: 100%;
  max-width: 560px;
}

.pink-btn {
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 26px;
  background: linear-gradient(135deg, $client-pink-btn-start, $client-pink-btn-end);
  box-shadow: 0 8px 18px $client-pink-btn-shadow;
  transition: all 0.2s ease;
}

.pink-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 11px 20px $client-pink-btn-hover-shadow;
}

.pink-btn.subtle {
  background: linear-gradient(135deg, #f29ebf, #f4b9cd);
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.tab-fade-enter,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

::v-deep .cream-tabs .el-tabs__item {
  color: $client-profile-tab;
}

::v-deep .cream-tabs .el-tabs__item.is-active {
  color: $client-profile-tab-active;
  font-weight: 600;
}

::v-deep .cream-tabs .el-tabs__active-bar {
  background-color: $client-profile-tab-bar;
}

::v-deep .el-input__inner {
  border-radius: 10px;
  border-color: $client-profile-input-border;
  transition: all 0.2s ease;
}

::v-deep .el-input__inner:focus {
  border-color: $client-profile-input-focus;
  box-shadow: 0 0 0 3px rgba(246, 166, 197, 0.16);
}

::v-deep .el-form-item {
  margin-bottom: 22px;
}

::v-deep .el-form-item__label {
  color: $client-profile-label;
}

::v-deep .el-form-item__error {
  color: $client-profile-error;
}
</style>
