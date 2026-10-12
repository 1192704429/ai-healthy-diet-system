<template>
  <el-form :model="userForm" ref="userForm" label-width="100px">
    <el-form-item label="登录账号" prop="username">
      <el-input v-model="userForm.username" disabled></el-input>
    </el-form-item>

    <el-form-item label="管理员姓名" prop="realName">
      <el-input v-model="userForm.realName"></el-input>
    </el-form-item>

    <el-form-item label="管理员头像" prop="avatar">
      <img-upload v-model="userForm.avatar" />
    </el-form-item>

    <el-form-item label="手机号码" prop="phone">
      <el-input v-model="userForm.phone"></el-input>
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input v-model="userForm.email"></el-input>
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input
        type="textarea"
        v-model="userForm.remark"></el-input>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitUserInfo">保存修改</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUserInfo, updateUserInfo } from '@/api/user'
import ImgUpload from '@/components/ImgUpload'

export default {
  name: 'UserInfoadmin',
  components: {
    ImgUpload
  },
  data() {
    return {
      userForm: {}
    }
  },
  computed: {
    ...mapGetters(['id'])
  },
  created() {
    this.initUserInfo()
  },
  methods: {
    // 初始化用户信息
    initUserInfo() {
      getUserInfo(this.id).then(res => {
        this.userForm = res.data || {}
      })
    },
    // 重置表单
    reset() {
      if (this.$refs.userForm) {
        this.$refs.userForm.resetFields()
      }
    },
    // 提交用户信息
    submitUserInfo() {
      updateUserInfo(this.userForm).then(response => {
        if (response.code === 200) {
          this.$message.success('保存成功')
          // 更新vuex中的用户信息
          this.$store.commit('user/SET_NAME', this.userForm.realName)
          this.$store.commit('user/SET_AVATAR', this.userForm.avatar)

          this.$emit('updated', this.userForm)
        } else {
          this.$message.error(response.msg || '保存失败')
        }
      }).catch(() => {
        this.$message.error('保存失败')
      })
    }
  }
}
</script>

