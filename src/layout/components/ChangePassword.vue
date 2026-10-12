<template>
  <el-form :model="passwordForm" :rules="passwordRules" ref="passwordForm" label-width="100px">
    <el-form-item label="原密码" prop="oldPassword">
      <el-input v-model="passwordForm.oldPassword" type="password" show-password></el-input>
    </el-form-item>

    <el-form-item label="新密码" prop="newPassword">
      <el-input v-model="passwordForm.newPassword" type="password" show-password></el-input>
    </el-form-item>

    <el-form-item label="确认密码" prop="confirmPassword">
      <el-input v-model="passwordForm.confirmPassword" type="password" show-password></el-input>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitPassword">修改密码</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { mapGetters } from 'vuex'
import { changePassword } from '@/api/user'

export default {
  name: 'PersonalCenterChangePassword',
  computed: {
    ...mapGetters([
      'id'
    ])
  },
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    // 重置表单
    reset() {
      if (this.$refs.passwordForm) {
        this.$refs.passwordForm.resetFields()
      }
    },
    // 提交密码修改
    submitPassword() {
      this.$refs.passwordForm.validate(valid => {
        if (valid) {
          const params = {
            oldPassword: this.passwordForm.oldPassword,
            newPassword: this.passwordForm.newPassword,
            id: this.id
          }
          changePassword(params).then(response => {
            if (response.code === 200) {
              this.$message.success('密码修改成功')
              this.$emit('success')
            }
          })
        }
      })
    }
  }
}
</script>

