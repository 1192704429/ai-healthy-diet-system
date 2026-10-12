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
        <p class="visual-kicker">Eat well, live well</p>
        <h2>吃得明白，<br>管得轻松</h2>
        <p class="visual-desc">记录每一餐，看清营养结构，让 AI 帮你把健康目标落到具体吃法上。</p>

        <div class="scene">
          <div class="plate">
            <div class="plate-ring">
              <strong>今日建议</strong>
              <span>蔬菜一半 · 优质蛋白 · 少油少糖</span>
            </div>
          </div>
          <div class="float-card card-a">
            <i class="el-icon-dish" />
            <div>
              <b>饮食记录</b>
              <small>随时记下三餐</small>
            </div>
          </div>
          <div class="float-card card-b">
            <i class="el-icon-data-line" />
            <div>
              <b>营养分析</b>
              <small>热量与宏量一目了然</small>
            </div>
          </div>
          <div class="float-card card-c">
            <i class="el-icon-chat-dot-round" />
            <div>
              <b>AI 助手</b>
              <small>个性化饮食建议</small>
            </div>
          </div>
        </div>
      </aside>

      <section class="form-panel">
        <div class="form-head">
          <p class="eyebrow">欢迎回来</p>
          <h1>登录账号</h1>
          <p class="form-sub">继续你的健康饮食计划</p>
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
          @keyup.enter.native="handleLogin"
        >
          <el-form-item prop="username">
            <label class="field-label">用户名</label>
            <el-input
              v-model="form.username"
              prefix-icon="el-icon-user"
              placeholder="请输入用户名"
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
              placeholder="请输入密码"
              maxlength="20"
              show-password
              autocomplete="current-password"
              @input="clearError"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              class="auth-btn"
              :loading="loading"
              native-type="button"
              @click="handleLogin"
            >
              进入系统
            </el-button>
          </el-form-item>
        </el-form>

        <div class="auth-footer">
          还没有账号？
          <router-link class="auth-link" to="/user/register">立即注册</router-link>
        </div>
        <button type="button" class="admin-text-btn" @click="$router.push('/admin/login')">
          去管理后台登录
        </button>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClientLogin',
  data() {
    const validateUsername = (rule, value, callback) => {
      const username = (value || '').trim()
      if (!username) {
        callback(new Error('请输入用户名'))
      } else if (username.length > 20) {
        callback(new Error('用户名长度为1-20个字符'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 6 || value.length > 20) {
        callback(new Error('密码长度为6-20个字符'))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      errorMessage: '',
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [{ validator: validateUsername, trigger: ['blur', 'change'] }],
        password: [{ validator: validatePassword, trigger: ['blur', 'change'] }]
      }
    }
  },
  methods: {
    clearError() {
      this.errorMessage = ''
    },
    handleLogin() {
      this.errorMessage = ''
      this.$refs.formRef.validate(async valid => {
        if (!valid) {
          return
        }
        this.loading = true
        try {
          await this.$store.dispatch('clientUser/login', {
            username: (this.form.username || '').trim(),
            password: this.form.password
          })
          this.$message.success('登录成功')
          const redirect = this.$route.query.redirect || '/user/home'
          this.$router.push(redirect)
        } catch (error) {
          const message = error && error.message ? error.message : ''
          this.errorMessage = this.mapLoginError(message)
          this.loading = false
        }
      })
    },
    mapLoginError(message) {
      if (!message || message === 'Error' || message === 'Network Error' || message.indexOf('timeout') !== -1) {
        return '登录失败，请稍后重试'
      }
      if (message.indexOf('管理员') !== -1) {
        return '管理员请前往管理端登录'
      }
      if (message.indexOf('禁用') !== -1) {
        return '该账号已被禁用，请联系管理员'
      }
      if (message.indexOf('用户名或密码错误') !== -1) {
        return '用户名或密码错误'
      }
      return message || '登录失败，请稍后重试'
    }
  }
}
</script>

<style lang="scss" scoped>
@import './auth-page.scss';
</style>
