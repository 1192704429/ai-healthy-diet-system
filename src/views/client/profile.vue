<template>
  <div class="profile-page">
    <div class="page-head">
      <h2>个人中心</h2>
    </div>

    <div v-if="pageError" class="state-box">
      <p>{{ pageError }}</p>
      <el-button class="primary-btn" @click="load">重试</el-button>
    </div>
    <el-skeleton v-else-if="loading" class="panel" :rows="8" animated />

    <template v-else-if="profile">
      <section class="panel avatar-card">
        <div class="avatar-wrap">
          <img :src="profile.avatar || defaultAvatar" alt="头像">
          <el-upload
            v-if="editing"
            class="avatar-upload"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="onAvatarSuccess"
            :before-upload="beforeAvatar"
            name="file"
          >
            <span>更换头像</span>
          </el-upload>
        </div>
        <div>
          <h3>{{ profile.username }}</h3>
          <p class="muted">角色：{{ profile.role || '用户' }}</p>
          <p class="muted">注册时间：{{ profile.createTime || '-' }}</p>
        </div>
      </section>

      <section class="stats">
        <article class="stat-card">
          <strong>{{ profile.indicatorCount || 0 }}</strong>
          <span>健康档案指标</span>
        </article>
        <article class="stat-card">
          <strong>{{ profile.dietRecordCount || 0 }}</strong>
          <span>饮食记录</span>
        </article>
        <article class="stat-card">
          <strong>{{ profile.collectCount || 0 }}</strong>
          <span>收藏文章</span>
        </article>
        <article class="stat-card">
          <strong>{{ profile.likeCount || 0 }}</strong>
          <span>点赞文章</span>
        </article>
      </section>

      <section class="panel">
        <div class="form-head">
          <h3>基本信息</h3>
          <div v-if="!editing">
            <el-button class="primary-btn" size="small" @click="startEdit">编辑</el-button>
          </div>
          <div v-else>
            <el-button size="small" @click="cancelEdit">取消</el-button>
            <el-button class="primary-btn" size="small" :loading="saving" @click="save">保存</el-button>
          </div>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="profile-form">
          <el-form-item label="用户名">
            <el-input :value="profile.username" disabled />
          </el-form-item>
          <el-form-item label="角色">
            <el-input :value="profile.role || '用户'" disabled />
          </el-form-item>
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" maxlength="20" :disabled="!editing" />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-select v-model="form.gender" :disabled="!editing" style="width: 100%">
              <el-option label="未知" :value="0" />
              <el-option label="男" :value="1" />
              <el-option label="女" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="生日" prop="birthday">
            <el-date-picker
              v-model="form.birthday"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="选择日期"
              :disabled="!editing"
              :picker-options="birthdayOptions"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" maxlength="11" :disabled="!editing" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" :disabled="!editing" />
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="form.address" :disabled="!editing" />
          </el-form-item>
        </el-form>
      </section>

      <div class="logout-row">
        <el-button type="danger" plain @click="logout">退出登录</el-button>
      </div>
    </template>
  </div>
</template>

<script>
import { getClientProfile, updateClientProfile } from '@/api/client-user'
import { getClientToken } from '@/utils/client-auth'

export default {
  name: 'ClientProfile',
  data() {
    const checkNickname = (rule, value, callback) => {
      const text = (value || '').trim()
      if (!text) {
        callback()
      } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{1,20}$/.test(text)) {
        callback(new Error('昵称长度为1-20字符，不可包含特殊字符'))
      } else {
        callback()
      }
    }
    const checkPhone = (rule, value, callback) => {
      const text = (value || '').trim()
      if (!text) {
        callback()
      } else if (!/^1\d{10}$/.test(text)) {
        callback(new Error('手机号必须为11位数字，以1开头'))
      } else {
        callback()
      }
    }
    const checkEmail = (rule, value, callback) => {
      const text = (value || '').trim()
      if (!text) {
        callback()
      } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(text)) {
        callback(new Error('邮箱必须符合标准邮箱格式'))
      } else {
        callback()
      }
    }
    const checkBirthday = (rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      const picked = new Date(value + 'T00:00:00')
      const min = new Date('1900-01-01T00:00:00')
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (picked < min || picked > today) {
        callback(new Error('出生日期不能在将来'))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      saving: false,
      editing: false,
      pageError: '',
      profile: null,
      snapshot: null,
      defaultAvatar: 'https://code-graden-server-dev.oss-cn-beijing.aliyuncs.com/2022-05-20/1ef4592a-ff86-424a-845a-260a58a550a4_logo.jpg',
      form: {
        nickname: '',
        gender: 0,
        birthday: '',
        phone: '',
        email: '',
        address: '',
        avatar: ''
      },
      rules: {
        nickname: [{ validator: checkNickname, trigger: 'blur' }],
        phone: [{ validator: checkPhone, trigger: 'blur' }],
        email: [{ validator: checkEmail, trigger: 'blur' }],
        birthday: [{ validator: checkBirthday, trigger: 'change' }]
      },
      birthdayOptions: {
        disabledDate(date) {
          return date.getTime() > Date.now() || date.getTime() < new Date('1900-01-01').getTime()
        }
      }
    }
  },
  computed: {
    uploadUrl() {
      return (process.env.VUE_APP_BASE_API || '') + '/upload/file/url'
    },
    uploadHeaders() {
      return { Authorization: getClientToken() || '' }
    }
  },
  created() {
    this.load()
  },
  methods: {
    fillForm(data) {
      this.form = {
        nickname: data.nickname || '',
        gender: data.gender == null ? 0 : data.gender,
        birthday: data.birthday || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        avatar: data.avatar || ''
      }
    },
    async load() {
      this.loading = true
      this.pageError = ''
      this.editing = false
      try {
        const res = await getClientProfile()
        this.profile = (res && res.data) || null
        if (!this.profile) {
          this.pageError = '加载失败，请稍后重试'
          return
        }
        this.fillForm(this.profile)
      } catch (error) {
        this.profile = null
        this.pageError = '加载失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    startEdit() {
      this.snapshot = JSON.parse(JSON.stringify(this.form))
      this.editing = true
    },
    cancelEdit() {
      if (this.snapshot) {
        this.form = JSON.parse(JSON.stringify(this.snapshot))
      }
      this.editing = false
      if (this.$refs.formRef) {
        this.$refs.formRef.clearValidate()
      }
    },
    beforeAvatar(file) {
      const okType = file.type === 'image/jpeg' || file.type === 'image/png'
      const okSize = file.size / 1024 / 1024 < 2
      if (!okType) {
        this.$message.error('请上传 jpg 或 png 图片')
        return false
      }
      if (!okSize) {
        this.$message.error('图片大小不超过2MB')
        return false
      }
      return true
    },
    onAvatarSuccess(res) {
      if (res && res.code === 200 && res.data) {
        this.form.avatar = res.data
        if (this.profile) {
          this.profile.avatar = res.data
        }
      } else {
        this.$message.error('头像上传失败')
      }
    },
    save() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) {
          return
        }
        this.saving = true
        try {
          const res = await updateClientProfile(this.form)
          this.profile = (res && res.data) || this.profile
          this.fillForm(this.profile)
          this.editing = false
          this.$store.commit('clientUser/SET_NAME', this.profile.nickname || this.profile.username)
          this.$store.commit('clientUser/SET_AVATAR', this.profile.avatar || '')
          this.$message.success('信息已更新')
        } catch (error) {
          const message = error && error.message ? error.message : ''
          this.$message.error(message && message !== 'Error' ? message : '更新失败，请重试')
        } finally {
          this.saving = false
        }
      })
    },
    logout() {
      this.$confirm('确认退出登录？', '提示', { type: 'warning' }).then(async() => {
        await this.$store.dispatch('clientUser/logout')
        this.$router.replace('/user/login')
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.page-head h2 {
  margin: 0 0 16px;
  color: #1f3d24;
}

.panel {
  padding: 20px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.avatar-card {
  display: flex;
  gap: 16px;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  width: 88px;
  height: 88px;
}

.avatar-wrap img {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  background: #e8f5e9;
}

.avatar-upload {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: center;
  background: rgba(46, 125, 50, 0.85);
  color: #fff;
  font-size: 12px;
  border-radius: 0 0 44px 44px;
  cursor: pointer;
}

.avatar-card h3 {
  margin: 0 0 6px;
  color: #1f3d24;
}

.muted {
  margin: 4px 0 0;
  color: #6b7c6e;
  font-size: 13px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 16px 0;
}

.stat-card {
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}

.stat-card strong {
  display: block;
  font-size: 22px;
  color: #2e7d32;
}

.stat-card span {
  color: #6b7c6e;
  font-size: 12px;
}

.form-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.form-head h3 {
  margin: 0;
  color: #1f3d24;
}

.logout-row {
  margin-top: 20px;
  text-align: right;
}

.state-box {
  padding: 36px 12px;
  text-align: center;
  color: #6b7c6e;
}

.primary-btn {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}

.primary-btn:hover,
.primary-btn:focus {
  background: #256628;
  border-color: #256628;
  color: #fff;
}

@media (max-width: 720px) {
  .stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
