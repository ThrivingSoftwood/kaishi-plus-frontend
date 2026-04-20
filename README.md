# 📘 前端技术架构与功能说明文档 (Frontend Documentation)

***

#### 📌 修订记录 (Revision History)

| 版本号     | 修订日期   | 修订内容摘要               | 修订人           | 审核人           |
| :--------- | :--------- | :------------------------- | :--------------- | :--------------- |
| **V1.0.0** | 2026-04-11 | 项目初步落成，文档初始化。 | ThrivingSoftwood | ThrivingSoftwood |
|            |            |                            |                  |                  |
|            |            |                            |                  |                  |

---

<!-- 核心引擎 -->
![Vue.js 3.5](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white)
![Vite 8.0](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript 6.0](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)

<!-- UI 与 状态管理 -->
![Element Plus](https://img.shields.io/badge/Element_Plus-2.13.6-409EFF?style=flat-square&logo=element-plus&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3.0.4-FFD600?style=flat-square&logo=pinia&logoColor=black)
![Axios](https://img.shields.io/badge/Axios-1.15.0-5A29E4?style=flat-square&logo=axios&logoColor=white)

<!-- 渲染与构建 -->
![Pnpm](https://img.shields.io/badge/Pnpm-9.0-F69220?style=flat-square&logo=pnpm&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-10.2-4B32C3?style=flat-square&logo=eslint&logoColor=white)

## 1. 技术架构 (Technical Architecture)

前端项目是一个基于现代前端工程化标准的单页应用（SPA），专注于高性能、强类型与优雅的暗黑模式 UI。

*   **核心引擎:** **Vue 3.5.32** (Composition API) + **Vite 8.0.8**。采用 Vite 提供冷启动和 HMR（热更新）体验。
*   **语言规范:** **TypeScript 6.0.2**。提供严格的类型检查与接口契约（如 DTO/VO 的严格定义）。
*   **UI 框架:** **Element Plus 2.13.6**。全局深度定制了**暗黑模式 (Dark Mode)**，并通过覆盖 CSS 变量和深层选择器 (`:deep`) 实现了与系统主题的高度融合。
*   **状态管理:** **Pinia 3.0.4**。摒弃了传统的全局单例列表，采用了 **Map 隔离策略**，以路由的 `routeKey` 为维度缓存数据，完美支持多 Tab 页的数据独立。
*   **路由管理:** **Vue Router 5.0.4**。结合 `<keep-alive>` 与自定义的 TagsView（标签页），实现页面级缓存。
*   **安全加密:** **sm-crypto**。前端在网络传输前，使用国密 **SM4 (CBC模式)** 对用户密码进行对称加密，避免明文传输。

## 2. 核心功能实现 (Functional Implementation)

### 2.1 布局与多标签管理 (Layout & TagsView)

*   **动态侧边栏与面包屑:** 左侧基于 `el-menu` 构建树形导航，右侧 Header 包含面包屑与用户操作下拉框。
*   **TagsView (多标签页):** 借助 `useTagsStore` 记录用户访问的历史路由，在顶部生成可关闭的 Tab。
*   **状态保持 (KeepAlive):** 核心代码 `<component :is="Component" :key="route.path"/>`，强制 Vue 为相同的组件（但不同参数/路径）实例化不同的缓存，彻底解决复用组件导致的数据污染问题。

### 2.2 认证与安全机制 (Auth & Security)

*   **路由守卫:** 在 `router.beforeEach` 中严格校验登录状态。未登录者强制打回 `/login`；已登录者拦截二次访问 `/login`。
*   **密码加密与修改:** 登录与修改密码时，均通过 `encryptPassword` 工具函数（SM4 算法）加密密码。
*   **Token 失效处理:** Axios 响应拦截器中，一旦捕获到 `401` 状态码，会调用 `authStore.clearAuth()` 彻底清空 Pinia 和 LocalStorage，防范“僵尸 Token”引发的越权漏洞。

### 2.3 采购订单追踪模块 (Purchase Order Trace)

*   **列表页 (`IndexView.vue`):**
    *   包含复杂的多条件检索（单据号、订单号、时间范围等）。
    *   **状态隔离设计:** 使用 `traceStore.initModuleState(routeKey, ...)`。无论用户是打开“已完成采购单”还是“其他采购单”，虽然用的是同一个组件，但查询参数、列表数据、分页总数都在 Pinia 中按 `routeKey` 被隔离存储，互不干扰。
*   **详情页 (`DetailView.vue`):**
    *   接收 URL 参数 `vchcode` 和 `dlyorder`，向后端请求出入库明细记录。
    *   **乐观 UI 更新:** 实现了“置为完成”功能。用户点击后，调用 API，并在前一毫秒内通过 `removeRecordOptimistically` 在前端内存中直接移除该条数据，提供极致的丝滑体验。

## 3. 接口交互文档 (API Interaction)

前端所有的 API 请求都通过 axios 封装，自动在 Header 注入 `Authorization: Bearer {token}`，并自动解包后端的 `Result<T>` 结构。

### 3.1 认证模块 (`auth.ts`)

*   **登录 (Login):**
    *   `POST /kaishi/auth/login`
    *   **Req:** `LoginReq` (loginAccount, encryptedPassword)
    *   **Resp:** `LoginResp` (token, username)
*   **修改密码 (Change Password):**
    *   `POST /kaishi/auth/changePassword`
    *   **Req:** `ChangePwdReq` (loginAccount, oldPasswordEnc, newPasswordEnc)

### 3.2 采购追踪模块 (`trace.ts`)

*   **获取追踪列表 (List Info):**
    *   `POST /kaishi/purchase/trace/list/info`
    *   **Req:** `PurchaseOrderTraceDTO` (包含排序 `sortInfo`、分页 `pageNo`/`pageSize`、及各种检索条件)
    *   **Resp:** `DlyBuyVO[]` (包含前端计算所需的采购数量 `buyQty`、已入库数量 `stockedQty`、缺交数量 `owedQty` 及状态标签)
*   **获取详情 (Detail):**
    *   `POST /kaishi/purchase/trace/list/detail`
    *   **Req:** `PurchaseOrderTraceDTO` (主要使用 `vchcode` 和 `dlyorder`)
    *   **Resp:** `PurchaseTraceVO[]` (A表采购计划 + B表入库实绩的对撞数据)
*   **手动置为完成 (Manual Finish):**
    *   `POST /kaishi/purchase/trace/manual/finish`
    *   **Req:** `ManualFinishReq` (vchType, vchCode, dlyOrder, extInfo)



```bash
    
    # 先列出所有变更文件，然后用grep过滤掉不想看的文件
    git diff HEAD --name-only | \
    grep -v 'package-lock.json' | \
    grep -v 'mybatis' | \
    grep -v 'spring' | \
    grep -v '\.properties$' > files_to_diff.txt
    
    # 将想要查看的文件中已更改内容导出到 diff.txt
    git diff HEAD -- $(cat files_to_diff.txt) > diff.txt

    # 显示项目结构
   tree -I "target|node_modules|.git|out|*.iml|logs|package-info.java|mvnw*|*.md|.git*" --dirsfirst
   
   # 输出所有文件内容(排除 .env 文件)
   find . -type f \
  -not -path "./dist/*" \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -name ".git*" \
  -not -name "*.md" \
  -not -name "pnpm-lock.yaml" \
  -not -name ".env*" \
  -not -name "*.ico" \
  -not -path "*/.idea/*" \
  -not -name ".DS_Store" \
  -not -name "*.svg" | while read -r file; do
    ext="${file##*.}"
    
    echo "\nFile: $file"
    echo "\`\`\`$ext"
    cat "$file"
    echo "\`\`\`"
done
```