<template>
  <div class="app-layout">
    <!-- 左侧侧边栏 (保持不变) -->
    <aside class="sidebar">
      <!-- ... 这里是之前的 sidebar 代码 ... -->
      <div class="logo-container">
        <h2 class="logo-text">凯行天下 诗意芳华</h2>
      </div>
      <!--删除 unique-opened,关闭所有 tab 页也不收起菜单-->
      <div class="menu-container">
        <el-menu
          :default-active="route.path"
          class="el-menu-vertical"
          background-color="#141414"
          text-color="#E5EAF3"
          active-text-color="#409EFF"
          router
        >
          <!-- 静态系统主页始终保留在最上方 -->
          <el-menu-item index="/placeholder">
            <el-icon>
              <HomeFilled/>
            </el-icon>
            <template #title>
              <span>系统主页</span>
            </template>
          </el-menu-item>

          <!-- 🌟 将繁琐的 v-for 替换为我们刚才写的递归组件 -->
          <!-- 遍历顶层菜单数组，把每个节点扔进递归机器里 -->
          <SidebarItem
            v-for="menu in permissionStore.menus"
            :key="menu.path"
            :menu="menu"
          />

        </el-menu>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="main-content">
      <!-- 🌟 升级版 Header -->
      <header class="app-header">
        <div class="breadcrumb">当前位置：{{ route.meta.title || '系统主页' }}</div>

        <!-- 用户操作下拉菜单 -->
        <div class="header-actions">
          <!-- 🌟 新增：消息预警小铃铛 -->
          <div class="message-bell" @click="openMessageDrawer">
            <el-badge :value="msgStore.unreadCount" :hidden="msgStore.unreadCount === 0" :max="99" class="bell-badge">
              <el-icon :size="20"><Bell/></el-icon>
            </el-badge>
          </div>

          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" :icon="UserFilled" class="user-avatar"/>
              <span class="username">{{ authStore.username || '管理员' }}</span>
              <el-icon class="el-icon--right"><ArrowDown/></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePwd" :icon="Lock">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" :icon="SwitchButton" divided>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 核心路由出口 (保持不变) -->
      <div class="tags-view-container">
        <el-tabs
          v-model="activeTabPath"
          type="card"
          class="custom-tabs"
          @tab-click="handleTabClick"
          @tab-remove="handleTabRemove"
        >
          <el-tab-pane
            v-for="tag in tagsStore.visitedViews"
            :key="tag.path"
            :label="(tag.title as string)"
            :name="tag.path"
            closable
          />
        </el-tabs>
      </div>

      <!-- 核心路由出口 (结合 KeepAlive 缓存实例) -->
      <section class="router-view-container">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <!-- 🌟 史诗级关键：:key="route.path" 强制 Vue 为同一个组件的不同路径创建独立的缓存实例！ -->
            <!-- 🌟 加上 :include="tagsStore.cachedViewNames"，实现受控销毁 -->
            <keep-alive :include="tagsStore.cachedViewNames">
              <component :is="Component" :key="route.path"/>
            </keep-alive>
          </transition>
        </router-view>
      </section>
    </main>

    <!-- 🌟 修改密码对话框 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="修改登录密码"
      width="400px"
      append-to-body
      destroy-on-close
    >
      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-width="80px"
        @keyup.enter="submitChangePwd"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password
                    placeholder="请输入原密码" oncopy="return false" oncut="return false"/>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password
                    placeholder="请输入新密码(不少于6位)" oncopy="return false"
                    oncut="return false"/>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password
                    placeholder="请再次输入新密码" oncopy="return false" oncut="return false"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pwdDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="isSubmitting"
                     @click="submitChangePwd">确认修改</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 🌟 消息中心抽屉 -->
    <el-drawer v-model="msgDrawerVisible" title="消息与预警中心" size="400px" append-to-body>
      <div class="msg-drawer-container" v-loading="msgLoading">
        <div class="msg-header">
          <el-radio-group v-model="msgPage.readStatus" size="small" @change="fetchMessages">
            <el-radio-button :label="undefined">全部</el-radio-button>
            <el-radio-button :label="0">未读</el-radio-button>
            <el-radio-button :label="1">已读</el-radio-button>
          </el-radio-group>
          <el-button type="primary" link size="small" @click="handleReadAll" :disabled="msgStore.unreadCount === 0">
            全部已读
          </el-button>
        </div>

        <div class="msg-list" v-if="msgList.length > 0">
          <div v-for="msg in msgList" :key="msg.id" class="msg-item" :class="{ 'read-status': msg.readStatus === 1 }" @click="handleRead(msg)">
            <div class="msg-item-header">
              <el-tag :type="msg.msgType === 1 ? 'warning' : 'info'" size="small" effect="dark">
                {{ msg.msgType === 1 ? '预警' : '通知' }}
              </el-tag>
              <span class="msg-title">{{ msg.title }}</span>
              <span v-if="msg.readStatus === 0" class="unread-dot"></span>
            </div>
            <div class="msg-content">{{ msg.content }}</div>
            <div class="msg-time">{{ formatTime(msg.createTime) }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无消息记录" :image-size="100" />
      </div>

      <template #footer>
        <el-pagination
          small
          layout="prev, pager, next"
          :total="msgTotal"
          v-model:current-page="msgPage.pageNo"
          :page-size="msgPage.pageSize"
          @current-change="handleMsgPageChange"
          class="msg-pagination"
        />
      </template>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import {reactive, ref, watch, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {
  ArrowDown,
  Lock,
  HomeFilled,
  SwitchButton,
  UserFilled,
  Bell
} from '@element-plus/icons-vue'
import type {FormInstance, FormRules, TabsPaneContext} from 'element-plus'
import {ElMessage, ElMessageBox, type TabPaneName} from 'element-plus'
import {useAuthStore} from '@/arch/auth/store/store'
import {encryptPassword} from '@/arch/request/crypto'
import {useTagsStore} from '@/arch/layout/store'
import SidebarItem from '@/arch/layout/components/SidebarItem.vue'
import {usePermissionStore} from '@/arch/router/dynamic'
import type {ChangePwdReq} from "@/arch/auth/type/changePwdReq.ts";
import {changePasswordApi} from "@/arch/auth/api/api.ts";

// 2. 引入我们刚写的 messageStore 和 API
import { useMessageStore } from '@/arch/message/store/message'
import { pageMessagesApi, markAsReadApi, markAllAsReadApi } from '@/arch/message/api/message'
// 如果没有装 dayjs，可以用原生 Date，这里建议格式化时间
import dayjs from 'dayjs'

const permissionStore = usePermissionStore()


const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tagsStore = useTagsStore()

// 激活的 Tab 路径
const activeTabPath = ref(route.path)

const msgStore = useMessageStore()

// 🌟 新增：消息抽屉状态与分页数据
const msgDrawerVisible = ref(false)
const msgList = ref<any[]>([])
const msgLoading = ref(false)
const msgTotal = ref(0)
const msgPage = reactive({ pageNo: 1, pageSize: 15, readStatus: undefined as number | undefined })


const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 🌟 生命周期接入
onMounted(async () => {
  // 启动消息引擎
  await msgStore.fetchUnreadCount()
  msgStore.connectSse()
})

// 监听路由变化，自动添加 Tab
watch(
  () => route.path,
  () => {
    tagsStore.addView(route)
    activeTabPath.value = route.path
  },
  {immediate: true} // 立即执行一次，把初次访问的页面加进去
)

// 点击 Tab 切换路由
const handleTabClick = (pane: TabsPaneContext) => {
  const targetPath = pane.paneName as string
  if (route.path !== targetPath) {
    router.push({path: targetPath})
  }
}

// 关闭 Tab
const handleTabRemove = (targetPath: TabPaneName) => {
  tagsStore.delView(targetPath)

  // 如果关闭的是当前正在看的 Tab，需要自动跳转到旁边的 Tab
  if (activeTabPath.value === targetPath) {
    const views = tagsStore.visitedViews
    const latestView = views.slice(-1)[0] // 获取最后一个
    if (latestView) {
      router.push({path: latestView.path})
    } else {
      // 如果全关了，跳回默认页
      router.push({path: '/'})
    }
  }
}


// ================= 登出与下拉菜单逻辑 =================
const handleCommand = (command: string) => {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'changePwd') {
    pwdDialogVisible.value = true
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出凯诗+系统吗？', '退出提示', {
    confirmButtonText: '确定退出',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 👈 切断长连接
    msgStore.disconnectSse()
    // 调用 Pinia 中的清理方法
    authStore.clearAuth()
    ElMessage.success('已安全退出')
    // 跳回登录页
    router.push({name: 'Login'})
  }).catch(() => {
  })
}



// 🌟 打开抽屉并加载数据
const openMessageDrawer = () => {
  msgDrawerVisible.value = true
  fetchMessages()
}

const fetchMessages = async () => {
  msgLoading.value = true
  try {
    const res = await pageMessagesApi(msgPage)
    msgList.value = res.records ||[]
    msgTotal.value = res.total || 0
  } finally {
    msgLoading.value = false
  }
}

// 🌟 标记已读交互
const handleRead = async (row: any) => {
  if (row.readStatus === 1) return
  await markAsReadApi(row.id)
  row.readStatus = 1
  msgStore.unreadCount = Math.max(0, msgStore.unreadCount - 1)
}

const handleReadAll = async () => {
  if (msgStore.unreadCount === 0) return
  await markAllAsReadApi()
  msgStore.unreadCount = 0
  ElMessage.success('全部标记已读')
  fetchMessages()
}

const handleMsgPageChange = (val: number) => {
  msgPage.pageNo = val
  fetchMessages()
}

// ================= 修改密码逻辑 =================
const pwdDialogVisible = ref(false)
const isSubmitting = ref(false)
const pwdFormRef = ref<FormInstance>()

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 自定义校验：确认密码必须与新密码一致
const validateConfirmPwd = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的新密码不一致!'))
  } else {
    callback()
  }
}

const pwdRules = reactive<FormRules>({
  oldPassword: [{required: true, message: '请输入原密码', trigger: 'blur'}],
  newPassword: [
    {required: true, message: '请输入新密码', trigger: 'blur'},
    {min: 6, message: '密码长度不能少于6位', trigger: 'blur'}
  ],
  confirmPassword: [{required: true, validator: validateConfirmPwd, trigger: 'blur'}]
})

const submitChangePwd = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true
      try {
        // 构建加密后的 DTO
        const reqData: ChangePwdReq = {
          loginAccount: authStore.loginAccount,
          oldPasswordEnc: encryptPassword(pwdForm.oldPassword),
          newPasswordEnc: encryptPassword(pwdForm.newPassword)
        }

        await changePasswordApi(reqData)

        ElMessage.success('密码修改成功，请使用新密码重新登录')
        pwdDialogVisible.value = false

        // 密码修改成功后，强制清空状态并跳回登录页 (安全最佳实践)
        authStore.clearAuth()
        await router.push({name: 'Login'})

      } catch (error) {
        console.error('修改密码失败:', error)
      } finally {
        isSubmitting.value = false
      }
    }
  })
}
</script>

<style scoped>
/* ====== 保留之前的布局样式 ====== */
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background-color: #141414;
  border-right: 1px solid #262727;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #262727;
  flex-shrink: 0;
}

.logo-text {
  color: #409EFF;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 2px;
}

.menu-container {
  flex: 1;
  overflow-y: auto;
}

.el-menu-vertical {
  border-right: none;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1d1e1f;
  overflow: hidden;
}

/* ====== 升级 Header 样式 ====== */
.app-header {
  height: 60px;
  background-color: #141414;
  border-bottom: 1px solid #262727;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 两端对齐：左边面包屑，右边操作区 */
  padding: 0 20px;
  flex-shrink: 0;
}

.breadcrumb {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

/* 用户下拉菜单样式 */
.header-actions {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: color 0.3s;
}

.user-dropdown:hover {
  color: var(--el-color-primary);
}

.user-avatar {
  background-color: #2b2f3a;
  margin-right: 10px;
}

.username {
  font-size: 14px;
  font-weight: 500;
}

/* ====== 路由及滚动条样式保持不变 ====== */
.router-view-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.fade-transform-leave-active, .fade-transform-enter-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #4c4d4f;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #606266;
}

.tags-view-container {
  background-color: #141414;
  padding: 6px 20px 0 20px;
  border-bottom: 1px solid #262727;
}

/* 深度定制 Element Plus 的 Tabs 样式，使其完美融入暗黑主题 */
:deep(.custom-tabs .el-tabs__header) {
  margin: 0;
  border-bottom: none;
}

:deep(.custom-tabs .el-tabs__nav) {
  border: none !important;
}

:deep(.custom-tabs .el-tabs__item) {
  color: var(--el-text-color-secondary);
  border: 1px solid #262727 !important;
  border-bottom: none !important;
  border-radius: 6px 6px 0 0;
  margin-right: 4px;
  background-color: #1d1e1f;
  transition: all 0.3s;
  height: 34px;
  line-height: 34px;
}

:deep(.custom-tabs .el-tabs__item.is-active) {
  color: #409EFF;
  background-color: #2b2f3a; /* 激活的 Tab 稍微亮一点 */
  border-bottom-color: #2b2f3a !important;
}

:deep(.custom-tabs .el-tabs__item:hover) {
  color: #409EFF;
}
/* ====== 消息小铃铛样式 ====== */
.message-bell {
  margin-right: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--el-text-color-regular);
  transition: color 0.3s;
}

.message-bell:hover {
  color: var(--el-color-primary);
}

:deep(.bell-badge .el-badge__content.is-fixed) {
  top: 0;
  right: 6px;
}

/* ====== 消息抽屉样式 ====== */
.msg-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.msg-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.msg-item {
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-darker);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.msg-item:hover {
  border-color: var(--el-color-primary);
}

.msg-item.read-status {
  opacity: 0.6; /* 已读变暗 */
}

.msg-item-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
}

.msg-title {
  font-weight: bold;
  margin-left: 8px;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.unread-dot {
  position: absolute;
  right: 0;
  width: 8px;
  height: 8px;
  background-color: var(--el-color-danger);
  border-radius: 50%;
}

.msg-content {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  margin-bottom: 8px;
}

.msg-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}

.msg-pagination {
  justify-content: center;
}
</style>
