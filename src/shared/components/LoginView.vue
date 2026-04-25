<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="always"><!-- 替换原有的 login-header -->
      <div class="login-header">
        <h2 class="title">凯诗+</h2>

        <!-- Slogan 区域 -->
        <div class="slogan-wrapper">
          <span class="slogan-text">凯行天下</span>
          <span class="slogan-dot">·</span>
          <span class="slogan-text">诗意芳华</span>
        </div>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="loginAccount">
          <el-input v-model.trim="loginForm.loginAccount" ref="accountRef" placeholder="账号" clearable/>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" ref="passwordRef" type="password" placeholder="密码" show-password
                    oncopy="return false" oncut="return false"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%; margin-top: 10px;" :loading="isLoading"
                     @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
// 这里的 JS 逻辑保持你原来的不变，无需改动
import {onMounted, reactive, ref, nextTick} from 'vue'
import {useRouter} from 'vue-router'
import type {FormInstance, FormRules} from 'element-plus'
import {ElMessage} from 'element-plus'
import {encryptPassword} from '@/arch/request/crypto'
import {useAuthStore} from '@/arch/auth/store/store'
import type {LoginReq} from "@/arch/auth/type/loginReq.ts";
import {loginApi} from "@/arch/auth/api/api.ts";

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref<FormInstance>()
const isLoading = ref<boolean>(false)

// 🌟 1. 初始化时：尝试从 localStorage 中读取上次成功登录的账号
const lastAccount = localStorage.getItem('kaishi_last_account') || ''
// 将读取到的账号作为响应式表单的初始值
const loginForm = reactive({loginAccount: lastAccount, password: ''})

const loginRules = reactive<FormRules>({
  loginAccount: [{required: true, message: '账号不能为空', trigger: 'blur'}],
  password: [{required: true, message: '密码不能为空', trigger: 'blur'}]
})

const accountRef = ref()
const passwordRef = ref()

onMounted(async () => {
  // 确保 DOM 已经完全稳定
  await nextTick()

  if (loginForm.loginAccount) {
    // 如果账号有值，聚焦到密码框
    // Element Plus 的输入框 focus 需要调用其内部暴露的方法
    passwordRef.value?.focus()
  } else {
    // 否则聚焦到账号框
    accountRef.value?.focus()
  }
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      try {
        const reqData: LoginReq = {
          loginAccount: loginForm.loginAccount,
          encryptedPassword: encryptPassword(loginForm.password)
        }
        const resData = await loginApi(reqData)

        // 🌟 核心：登录成功后，立即将该账号存入持久化偏好设置
        // 这个 key 'kaishi_last_account' 不会被 authStore.clearAuth() 删掉
        localStorage.setItem('kaishi_last_account', loginForm.loginAccount)

        authStore.setAuthInfo(
          resData.token,
          loginForm.loginAccount,
          resData.username,
          resData.permissions || [],
          resData.roleCodes || []
        )

        ElMessage.success('登录成功')
        await router.push({path: '/'})
      } catch (error) {
        console.error(error)
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* src/view/Login.vue 的 style 区域 */

.login-wrapper {
  /* 开启绝对定位，脱离一切父容器的束缚 */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  /* Flex 居中内部的卡片 */
  display: flex;
  justify-content: center;
  align-items: center;

  /* 科技感暗黑渐变背景 */
  background: linear-gradient(135deg, #0f121b 0%, #1a1f2b 100%);
}

/* 下面的 .login-card, .login-header 等保持不变... */
.login-card {
  width: 420px;
  padding: 30px 20px;
  border-radius: 12px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-darker);
}

/* ... (保留你原有的其余样式) */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  margin: 0 0 16px 0;
  font-size: 32px;
  font-weight: 700; /* 加粗字体，增加视觉重量 */
  letter-spacing: 4px;

  /* 1. 更明亮、更有层次的渐变 */
  background: linear-gradient(135deg, #79C2FF 10%, #409EFF 50%, #79C2FF 90%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* 2. 增强的发光效果，模拟霓虹灯光晕 */
  filter: drop-shadow(0 0 10px rgba(64, 158, 255, 0.5));
}

/* Slogan 容器居中对齐 */
.slogan-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px; /* 控制文字和中间圆点的间距 */
}

/* Slogan 核心特效 */
.slogan-text {
  font-size: 15px;
  letter-spacing: 6px; /* 拉大字间距，营造高级感与呼吸感 */
  font-weight: 500;

  /* 科技与诗意融合的青蓝色渐变 (呼应你之前的 darkturquoise) */
  background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; /* 将文字本身变透明，透出背景的渐变色 */

  /* 微弱的发光效果，在暗色背景下非常惊艳 */
  filter: drop-shadow(0px 2px 4px rgba(0, 210, 255, 0.2));
}

/* 中间的装饰点 */
.slogan-dot {
  color: #4c4d4f; /* 弱化标点，不抢主字风头 */
  font-size: 18px;
  font-weight: bold;
}
</style>
