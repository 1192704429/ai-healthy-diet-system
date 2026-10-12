<template>
  <div class="auth-page">
    <div class="orb orb-a" />
    <div class="orb orb-b" />
    <div class="orb orb-c" />

    <div class="auth-card">
      <aside class="visual-panel">
        <div class="visual-top">
          <span class="brand-mark">健</span>
          <span>个性化健康饮食</span>
        </div>
        <p class="visual-kicker">Start your plan</p>
        <h2>开启你的<br>健康饮食计划</h2>
        <p class="visual-desc">注册后即可记录饮食、查看营养分析，并获得贴合目标的个性化建议。</p>

        <div class="scene">
          <div class="plate">
            <div class="plate-ring">
              <strong>三步开始</strong>
              <span>注册 · 完善档案 · 记录饮食</span>
            </div>
          </div>
          <div class="float-card card-a">
            <i class="el-icon-user" />
            <div>
              <b>创建账号</b>
              <small>一分钟完成注册</small>
            </div>
          </div>
          <div class="float-card card-b">
            <i class="el-icon-notebook-2" />
            <div>
              <b>完善档案</b>
              <small>目标更清晰</small>
            </div>
          </div>
          <div class="float-card card-c">
            <i class="el-icon-dish" />
            <div>
              <b>开始记录</b>
              <small>马上获得建议</small>
            </div>
          </div>
        </div>
      </aside>

      <section class="form-panel">
        <div class="form-head">
          <p class="eyebrow">新用户</p>
          <h1>创建账号</h1>
          <p class="form-sub">加入后即可使用饮食记录、营养分析和 AI 问答</p>
        </div>

        <div class="system-tip" role="alert">
          <el-alert
            v-if="errorMessage"
            :title="errorMessage"
            type="error"
            show-icon
            :closable="false"
          />
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="auth-form"
          @submit.native.prevent
          @keyup.enter.native="handleRegister"
        >
          <el-form-item prop="username">
            <label class="field-label">用户名</label>
            <el-input
              v-model="form.username"
              prefix-icon="el-icon-user"
              placeholder="字母、数字或下划线，1-20 位"
              maxlength="20"
              clearable
              autocomplete="username"
              @input="clearError"
            />
          </el-form-item>
          <el-form-item prop="password">
            <label class="field-label">密码</label>
            <el-input
              v-model="form.password"
              prefix-icon="el-icon-lock"
              type="password"
              placeholder="6-20 位，需包含字母和数字"
              maxlength="20"
              show-password
              autocomplete="new-password"
              @input="onPasswordInput"
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <label class="field-label">确认密码</label>
            <el-input
              v-model="form.confirmPassword"
              prefix-icon="el-icon-lock"
              type="password"
              placeholder="请再次输入密码"
              maxlength="20"
              show-password
              autocomplete="new-password"
              @input="clearError"
            />
          </el-form-item>
          <div class="role-note">
            <span>注册角色</span>
            <b>普通用户</b>
          </div>
          <el-form-item>
            <el-button
              class="auth-btn"
              :loading="loading"
              native-type="button"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="auth-footer">
          已有账号？
          <router-link class="auth-link" to="/user/login">返回登录</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClientRegister',
  data() {
    const validateUsername = (rule, value, callback) => {
      const username = (value || '').trim()
      if (!username) {
        callback(new Error('请输入用户名'))
      } else if (!/^[a-zA-Z0-9_]{1,20}$/.test(username)) {
        callback(new Error('用户名仅支持字母、数字和下划线，长度1-20'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 6 || value.length > 20 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
        callback(new Error('密码需包含字母和数字，长度6-20'))
      } else {
        callback()
      }
    }
    const validateConfirm = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.form.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      errorMessage: '',
      form: {
        username: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      },
      rules: {
        username: [{ validator: validateUsername, trigger: ['blur', 'change'] }],
        password: [{ validator: validatePassword, trigger: ['blur', 'change'] }],
        confirmPassword: [{ validator: validateConfirm, trigger: ['blur', 'change'] }]
      }
    }
  },
  methods: {
    clearError() {
      this.errorMessage = ''
    },
    onPasswordInput() {
      this.clearError()
      if (this.form.confirmPassword) {
        this.$refs.formRef.validateField('confirmPassword')
      }
    },
    handleRegister() {
      this.errorMessage = ''
      this.$refs.formRef.validate(async valid => {
        if (!valid) {
          const password = this.form.password
          const confirm = this.form.confirmPassword
          if (password && confirm && password !== confirm) {
            this.errorMessage = '两次输入的密码不一致'
          } else if (password && (password.length < 6 || password.length > 20 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
            this.errorMessage = '密码需包含字母和数字，长度6-20'
          }
          return
        }
        this.loading = true
        try {
          await this.$store.dispatch('clientUser/register', {
            username: (this.form.username || '').trim(),
            password: this.form.password
          })
          this.$message.success('注册成功，请登录')
          setTimeout(() => {
            this.$router.push('/user/login')
          }, 800)
        } catch (error) {
          const message = error && error.message ? error.message : ''
          this.errorMessage = this.mapRegisterError(message)
          this.loading = false
        }
      })
    },
    mapRegisterError(message) {
      if (!message || message === 'Error' || message === 'Network Error' || message.indexOf('timeout') !== -1) {
        return '注册失败，请稍后重试'
      }
      if (message.indexOf('用户名已存在') !== -1 || message.indexOf('重复') !== -1) {
        return '用户名已存在'
      }
      if (message.indexOf('两次输入的密码不一致') !== -1) {
        return '两次输入的密码不一致'
      }
      if (message.indexOf('密码') !== -1) {
        return '密码需包含字母和数字，长度6-20'
      }
      return '注册失败，请稍后重试'
    }
  }
}
</script>

<style lang="scss" scoped>
@import './auth-page.scss';

.auth-card {
  min-height: 620px;
}

.form-panel {
  padding-top: 32px;
  padding-bottom: 24px;
}

.role-note {
  margin-bottom: 14px;
}

.auth-form ::v-deep .el-form-item {
  margin-bottom: 14px;
}
</style>
