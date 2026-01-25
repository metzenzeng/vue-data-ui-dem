// API 服务文件
// 处理与后端的通信

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
}

interface CreateWorkspaceRequest {
  name: string
  description?: string
}

interface CreateWorkspaceResponse {
  workspace: Workspace
}

interface BigQueryDetails {
  projectId: string
  datasetId: string
  tableId: string
  rowCount: number
  columnCount: number
  createdAt: string
  queryUrl: string
}

interface UploadResponse {
  data: {
    rows: any[][]
    columns: string[]
    rowCount: number
    columnCount: number
  }
  bigQueryDetails: BigQueryDetails
}

// 创建 HTTP 请求的辅助函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('网络请求失败')
  }
}

// 创建工作区
export async function createWorkspace(
  data: CreateWorkspaceRequest
): Promise<CreateWorkspaceResponse> {
  return request<CreateWorkspaceResponse>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// 上传文件到 BigQuery
export async function uploadFileToBigQuery(
  formData: FormData
): Promise<UploadResponse> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const url = `${API_BASE_URL}/workspaces/upload`

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // 不要设置 Content-Type，让浏览器自动设置（包含 boundary）
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('文件上传失败')
  }
}

// 获取工作区列表
export async function getWorkspaces(): Promise<{ workspaces: Workspace[] }> {
  return request<{ workspaces: Workspace[] }>('/workspaces')
}

// 获取工作区详情
export async function getWorkspace(workspaceId: string): Promise<{ workspace: Workspace }> {
  return request<{ workspace: Workspace }>(`/workspaces/${workspaceId}`)
}
