/// <reference types="vite/client" />
// 扩展 ImportMetaEnv 接口
interface ImportMetaEnv {
    // 在这里添加你在 .env 文件中定义的 VITE_ 开头的变量, 确保类型与你的期望一致 (环境变量通常是字符串)
    readonly VITE_APP_SM4_KEY : string;
    readonly VITE_APP_SM4_IV: string;

    // 如果某个变量可能不存在，可以使用可选类型
    // readonly VITE_OPTIONAL_VAR?: string;
}

// (可选但推荐) 确保 ImportMeta 接口也使用我们扩展后的 ImportMetaEnv
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
