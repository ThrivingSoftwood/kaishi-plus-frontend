import request from '@/arch/request'

/**
 * 通用文件上传 API
 * @param file 原生 File 对象
 * @returns 文件的虚拟访问路径 (例如: /api/kaishi/file/preview/xxx.jpg)
 */
export const uploadFileApi = (file: File) => {
  const formData = new FormData()
  formData.append('file', file) // 这里的 'file' 必须和后端 Controller 的 @RequestParam("file") 保持一致

  // 使用我们封装好的 request 实例，自动带上 Token 和拦截器逻辑
  return request.post<any, string>('/kaishi/file/upload', formData, {
    headers: {
      // 必须显式声明这是一个 multipart 表单
      'Content-Type': 'multipart/form-data'
    }
  })
}
