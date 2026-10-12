<template>
  <div class="upload-file">
    <el-upload
      multiple
      :action="uploadFileUrl"
      :before-upload="handleBeforeUpload"
      :file-list="fileList"
      :data="data"
      :limit="limit"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :show-file-list="false"
      class="upload-file-uploader"
      ref="fileUpload"
      v-if="!disabled"
    >
      <!-- 上传按钮 -->
      <el-button size="mini" type="primary">选取文件</el-button>
      <!-- 上传提示 -->
      <div class="el-upload__tip" slot="tip" v-if="showTip">
        请上传
        <template v-if="fileSize"> 大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b> </template>
        <template v-if="fileType"> 格式为 <b style="color: #f56c6c">{{ fileType.join("/") }}</b> </template>
        的文件
      </div>
    </el-upload>

    <!-- 文件列表 -->
    <transition-group ref="uploadFileList" class="upload-file-list el-upload-list el-upload-list--text" name="el-fade-in-linear" tag="ul">
      <li :key="file.url" class="el-upload-list__item ele-upload-list__item-content" v-for="(file, index) in fileList">
        <el-link :href="`${baseUrl}${file.url}`" :underline="false" target="_blank">
          <span class="el-icon-document"> {{ getFileName(file.name) }} </span>
        </el-link>
        <div class="ele-upload-list__item-content-action">
          <el-link :underline="false" @click="handleDelete(index)" type="danger" v-if="!disabled">删除</el-link>
        </div>
      </li>
    </transition-group>
  </div>
</template>

<script>
import Sortable from 'sortablejs'

export default {
  name: "FileUpload",
  props: {
    // 值
    value: [String, Object, Array],
    // 上传接口地址
    action: {
      type: String,
      default: "/upload/file/name"
    },
    // 上传携带的参数
    data: {
      type: Object
    },
    // 数量限制
    limit: {
      type: Number,
      default: 5
    },
    // 大小限制(MB)
    fileSize: {
      type: Number,
      default: 5
    },
    // 文件类型, 例如['png', 'jpg', 'jpeg']
    fileType: {
      type: Array,
      default: () => ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "pdf"]
    },
    // 是否显示提示
    isShowTip: {
      type: Boolean,
      default: true
    },
    // 禁用组件（仅查看文件）
    disabled: {
      type: Boolean,
      default: false
    },
      // 拖动排序
    drag: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      number: 0,
      uploadList: [],
      baseUrl: process.env.VUE_APP_BASE_API,
      uploadFileUrl: process.env.VUE_APP_BASE_API + this.action, // 上传文件服务器地址
      fileList: []
    }
  },
  mounted() {
    if (this.drag) {
      this.$nextTick(() => {
        const element = this.$refs.uploadFileList?.$el || this.$refs.uploadFileList
        Sortable.create(element, {
          ghostClass: 'file-upload-darg',
          onEnd: (evt) => {
            const movedItem = this.fileList.splice(evt.oldIndex, 1)[0]
            this.fileList.splice(evt.newIndex, 0, movedItem)
            this.$emit("input", this.listToString(this.fileList))
          }
        })
      })
    }
  },
  watch: {
    value: {
      handler(val) {
        if (val) {
          let temp = 1
          // 首先将值转为数组
          let list = []
          if (Array.isArray(val)) {
            list = val
          } else if (typeof val === 'string') {
            list = val.split(',')
          } else if (typeof val === 'object' && val !== null) {
            // 如果是单个对象，转为数组
            list = [val]
          }
          // 然后将数组转为对象数组
          this.fileList = list.map(item => {
            if (typeof item === "string") {
              item = { name: item, url: item }
            }
            item.uid = item.uid || new Date().getTime() + temp++
            return item
          })
        } else {
          this.fileList = []
          return []
        }
      },
      deep: true,
      immediate: true
    }
  },
  computed: {
    // 是否显示提示
    showTip() {
      return this.isShowTip && (this.fileType || this.fileSize)
    },
  },
  methods: {
    // 上传前校检格式和大小
    handleBeforeUpload(file) {
      // 校检文件类型
      if (this.fileType && this.fileType.length > 0) {
        const fileName = file.name.split('.')
        const fileExt = fileName[fileName.length - 1]?.toLowerCase()
        const fileTypeLower = this.fileType.map(type => type.toLowerCase())
        const isTypeOk = fileExt && fileTypeLower.indexOf(fileExt) >= 0
        if (!isTypeOk) {
          this.$modal.msgError(`文件格式不正确，请上传${this.fileType.join("/")}格式文件!`)
          return false
        }
      }
      // 校检文件名是否包含特殊字符
      if (file.name.includes(',')) {
        this.$modal.msgError('文件名不正确，不能包含英文逗号!')
        return false
      }
      // 校检文件大小
      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize
        if (!isLt) {
          this.$modal.msgError(`上传文件大小不能超过 ${this.fileSize} MB!`)
          return false
        }
      }
      this.$modal.loading("正在上传文件，请稍候...")
      this.number++
      return true
    },
    // 文件个数超出
    handleExceed() {
      this.$modal.msgError(`上传文件数量不能超过 ${this.limit} 个!`)
    },
    // 上传失败
    handleUploadError(err) {
      this.number--
      this.$modal.msgError("上传文件失败，请重试")
      this.uploadedSuccessfully()
    },
    // 上传成功回调
    handleUploadSuccess(res, file) {
      this.number-- // 无论成功失败，都要减少计数
      if (res.code === 200) {
        // 处理响应数据，支持字符串或对象格式
        const fileUrl = typeof res.data === 'string' ? res.data : (res.data?.url || res.data?.name || '')
        if (fileUrl) {
          this.uploadList.push({ name: fileUrl, url: fileUrl })
        }
      } else {
        this.$modal.msgError(res.msg || '上传失败')
        // 安全地移除文件
        if (this.$refs.fileUpload && typeof this.$refs.fileUpload.handleRemove === 'function') {
          this.$refs.fileUpload.handleRemove(file)
        }
      }
      this.uploadedSuccessfully()
    },
    // 删除文件
    handleDelete(index) {
      this.fileList.splice(index, 1)
      this.$emit("input", this.listToString(this.fileList))
    },
    // 上传结束处理
    uploadedSuccessfully() {
      // 当所有上传任务完成时（number === 0），处理结果
      if (this.number === 0) {
        // 合并成功上传的文件
        if (this.uploadList.length > 0) {
          this.fileList = this.fileList.concat(this.uploadList)
          this.uploadList = []
          this.$emit("input", this.listToString(this.fileList))
        }
        // 关闭loading
        this.$modal.closeLoading()
      }
    },
    // 获取文件名称
    getFileName(name) {
      // 如果是url那么取最后的名字 如果不是直接返回
      if (name.lastIndexOf("/") > -1) {
        return name.slice(name.lastIndexOf("/") + 1)
      } else {
        return name
      }
    },
    // 对象转成指定字符串分隔
    listToString(list, separator = ',') {
      if (!Array.isArray(list) || list.length === 0) {
        return ''
      }
      return list.map(item => item.url || '').filter(url => url).join(separator)
    }
  }
}
</script>

<style scoped lang="scss">
.file-upload-darg {
  opacity: 0.5;
  background: #c8ebfb;
}
.upload-file-uploader {
  margin-bottom: 5px;
}
.upload-file-list .el-upload-list__item {
  border: 1px solid #e4e7ed;
  line-height: 2;
  margin-bottom: 10px;
  position: relative;
}
.upload-file-list .ele-upload-list__item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
}
.ele-upload-list__item-content-action .el-link {
  margin-right: 10px;
}
</style>
