<template>
  <div class="tinymce-box">
    <Editor
        v-model="contentValue"
        :init="init"
        :disabled="disabled"
        @onClick="onClick"
    />
  </div>
</template>

<script>
//引入tinymce编辑器
import Editor from "@tinymce/tinymce-vue";

//引入node_modules里的tinymce相关文件文件
import tinymce from "tinymce/tinymce"; //tinymce默认hidden，不引入则不显示编辑器
import "tinymce/themes/silver"; //编辑器主题，不引入则报错
import "tinymce/icons/default"; //引入编辑器图标icon，不引入则不显示对应图标

// 引入编辑器插件（基本免费插件都在这儿了）
import "tinymce/icons/default/icons";
import "tinymce/plugins/advlist"; //高级列表
import "tinymce/plugins/anchor"; //锚点
import "tinymce/plugins/autolink"; //自动链接
import "tinymce/plugins/autoresize"; //编辑器高度自适应,注：plugins里引入此插件时，Init里设置的height将失效
import "tinymce/plugins/autosave"; //自动存稿
import "tinymce/plugins/charmap"; //特殊字符
import "tinymce/plugins/code"; //编辑源码
import "tinymce/plugins/codesample"; //代码示例
import "tinymce/plugins/directionality"; //文字方向
import "tinymce/plugins/emoticons"; //表情
import "tinymce/plugins/fullpage"; //文档属性
// import "tinymce/plugins/fullscreen"; //全屏
import "tinymce/plugins/help"; //帮助
import "tinymce/plugins/hr"; //水平分割线
import "tinymce/plugins/importcss"; //引入css
import "tinymce/plugins/insertdatetime"; //插入日期时间
import "tinymce/plugins/link"; //超链接
import "tinymce/plugins/lists"; //列表插件
import "tinymce/plugins/media"; //插入编辑媒体
import 'tinymce/plugins/image'; // 插入图片
import "tinymce/plugins/nonbreaking"; //插入不间断空格
import "tinymce/plugins/pagebreak"; //插入分页符
import "tinymce/plugins/paste"; //粘贴插件
import "tinymce/plugins/preview"; //预览
import "tinymce/plugins/print"; //打印
import "tinymce/plugins/quickbars"; //快速工具栏
import "tinymce/plugins/save"; //保存
import "tinymce/plugins/searchreplace"; //查找替换
// import 'tinymce/plugins/spellchecker'  //拼写检查，未加入汉化，不建议使用
import "tinymce/plugins/tabfocus"; //切入切出，按tab键切出编辑器，切入页面其他输入框中
import "tinymce/plugins/table"; //表格
import "tinymce/plugins/template"; //内容模板
import "tinymce/plugins/textcolor"; //文字颜色
import "tinymce/plugins/textpattern"; //快速排版
import "tinymce/plugins/toc"; //目录生成器
import "tinymce/plugins/visualblocks"; //显示元素范围
import "tinymce/plugins/visualchars"; //显示不可见字符
import "tinymce/plugins/wordcount"; //字数统计
import axios from "axios";

export default {
  name: "TEditor",
  components: {
    Editor,
  },
  props: {
    value: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    /** 上传文件大小限制(MB)，同 Editor 组件 */
    fileSize: {
      type: Number,
      default: 5,
    },
    plugins: {
      type: [String, Array],
      default:
          "print preview searchreplace autolink directionality visualblocks visualchars fullscreen template code codesample table charmap hr pagebreak nonbreaking anchor insertdatetime advlist lists image media wordcount textpattern autosave autoresize",
    },
    toolbar: {
      type: [String, Array],
      default:
          "undo redo restoredraft | cut copy paste pastetext | forecolor backcolor bold italic underline strikethrough link anchor | alignleft aligncenter alignright alignjustify outdent indent | \
                  styleselect formatselect fontselect fontsizeselect | bullist numlist | lists image table | blockquote subscript superscript removeformat | \
                  table hr pagebreak insertdatetime print preview | code selectall searchreplace visualblocks | indent2em lineheight formatpainter axupimgs",
    },
    /** 固定高度(px)，设置后禁用 autoresize，编辑器内容超出时可滚动 */
    fixedHeight: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      uploadUrl: process.env.VUE_APP_BASE_API + "/upload/file/url",
      contentValue: this.value,
    };
  },
  computed: {
    init() {
      const plugins = this.fixedHeight > 0
        ? String(this.plugins).replace(/\bautoresize\b/g, "").replace(/\s+/g, " ").trim()
        : this.plugins;
      const heightConfig = this.fixedHeight > 0
        ? { min_height: this.fixedHeight, max_height: this.fixedHeight, resize: false }
        : { min_height: 275, max_height: 0, resize: false };
      return {
        language_url: "tinymce/langs/zh_CN.js",
        language: "zh_CN",
        skin_url: "tinymce/skins/ui/oxide",
        plugins,
        toolbar: this.toolbar,
        fontsize_formats:
            "12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 48px 56px 72px",
        font_formats:
            "微软雅黑=Microsoft YaHei,Helvetica Neue,PingFang SC,sans-serif;苹果苹方=PingFang SC,Microsoft YaHei,sans-serif;宋体=simsun,serif;仿宋体=FangSong,serif;黑体=SimHei,sans-serif;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;",
        lineheight_formats: "0.5 0.8 1 1.2 1.5 1.75 2 2.5 3 4 5",
        placeholder: "在这里输入文字",
        branding: false,
        elementpath: false,
        content_style: "img {max-width:100%;}",
        paste_data_images: true,
        ...heightConfig,
        images_upload_handler: (blobInfo, success, failure) => {
          this.uploadImageFile(blobInfo).then(success).catch(() => failure("图片上传失败"));
        },
      };
    },
  },
  watch: {
    value(newValue) {
      this.contentValue = newValue;
    },
    contentValue(newValue) {
      this.$emit("input", newValue);
    },
  },
  methods: {
    /** 图片上传（与 Editor 组件同一接口与逻辑） */
    uploadImageFile(blobInfo) {
      const file = typeof blobInfo.blob === "function" ? blobInfo.blob() : blobInfo;
      const types = ["image/jpeg", "image/jpg", "image/png", "image/svg"];
      if (!types.includes(file.type)) {
        this.$message.error("图片格式错误!");
        return Promise.reject(new Error("图片格式错误"));
      }
      if (this.fileSize && file.size / 1024 / 1024 >= this.fileSize) {
        this.$message.error(`上传文件大小不能超过 ${this.fileSize} MB!`);
        return Promise.reject(new Error("文件过大"));
      }
      const formData = new FormData();
      formData.append("file", file);
      return axios
        .post(this.uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          const data = res.data;
          if (data.code == 200 && data.data) {
            let url = data.data;
            if (typeof url === "string" && url.startsWith("/")) {
              url = process.env.VUE_APP_BASE_API + url;
            }
            return url;
          }
          this.$message.error(data.msg || "图片上传失败");
          return Promise.reject(new Error(data.msg || "上传失败"));
        })
        .catch((err) => {
          this.$message.error("图片上传失败");
          return Promise.reject(err);
        });
    },
    onClick(e) {
      this.$emit("onClick", e, tinymce);
    },
    clear() {
      this.contentValue = "";
    },
  },
};
</script>

<style lang="less">
.tox-notifications-container {
  display: none;
}

.tox-tinymce-aux {
  z-index: 5000 !important;
}
</style>

