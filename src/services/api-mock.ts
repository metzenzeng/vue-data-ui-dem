// Mock API 服务文件
// 用于前端开发和测试，模拟后端响应

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

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 生成随机 ID
const generateId = () => `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 生成随机表 ID
const generateTableId = () => `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 创建工作区 (Mock)
export async function createWorkspace(
  data: CreateWorkspaceRequest
): Promise<CreateWorkspaceResponse> {
  await delay(800) // 模拟网络延迟

  const workspace: Workspace = {
    id: generateId(),
    name: data.name,
    description: data.description,
    createdAt: new Date().toISOString()
  }

  console.log('✅ Mock: 工作区创建成功', workspace)
  return { workspace }
}

// 简单的 CSV 解析函数（处理基本格式）
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的双引号
        current += '"'
        i++
      } else {
        // 切换引号状态
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // 添加最后一个字段
  result.push(current.trim())
  
  return result
}

// 解析 CSV 文件
const parseCSV = async (file: File): Promise<{ rows: any[][], columns: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        
        if (!text || text.trim().length === 0) {
          reject(new Error('文件为空'))
          return
        }

        // 处理不同操作系统的换行符
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
        
        if (lines.length === 0) {
          reject(new Error('文件为空'))
          return
        }

        // 第一行作为列名
        const columns = parseCSVLine(lines[0])
        const rows: any[][] = []

        // 解析数据行
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          // 确保每行的列数与表头一致
          while (values.length < columns.length) {
            values.push('')
          }
          rows.push(values.slice(0, columns.length))
        }

        resolve({ rows, columns })
      } catch (error) {
        reject(new Error('CSV 解析失败: ' + (error instanceof Error ? error.message : '未知错误')))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'UTF-8')
  })
}

// 解析 Excel 文件 (简化版，实际应该使用 xlsx 库)
const parseExcel = async (file: File): Promise<{ rows: any[][], columns: string[] }> => {
  // 这里简化处理，实际应该使用 xlsx 库
  // 为了演示，我们返回模拟数据
  await delay(500)
  
  // 生成模拟 Excel 数据
  const columns = ['产品名称', '销售额', '数量', '日期', '地区']
  const rows: any[][] = []
  
  const products = ['产品A', '产品B', '产品C', '产品D', '产品E']
  const regions = ['北京', '上海', '广州', '深圳', '杭州']
  
  for (let i = 0; i < 20; i++) {
    rows.push([
      products[Math.floor(Math.random() * products.length)],
      (Math.random() * 100000).toFixed(2),
      Math.floor(Math.random() * 1000),
      new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('zh-CN'),
      regions[Math.floor(Math.random() * regions.length)]
    ])
  }
  
  return { rows, columns }
}

// 上传文件到 BigQuery (Mock)
export async function uploadFileToBigQuery(
  formData: FormData
): Promise<UploadResponse> {
  await delay(2000) // 模拟处理延迟

  const file = formData.get('file') as File
  const workspaceId = formData.get('workspaceId') as string

  if (!file) {
    throw new Error('未选择文件')
  }

  console.log('📤 Mock: 开始处理文件', file.name)

  // 根据文件类型解析
  let parsedData: { rows: any[][], columns: string[] }
  
  if (file.name.endsWith('.csv')) {
    parsedData = await parseCSV(file)
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    parsedData = await parseExcel(file)
  } else {
    throw new Error('不支持的文件格式')
  }

  // 生成 BigQuery 详情
  const tableId = generateTableId()
  const projectId = 'mock-gcp-project'
  const datasetId = 'mock_dataset'

  const bigQueryDetails: BigQueryDetails = {
    projectId,
    datasetId,
    tableId,
    rowCount: parsedData.rows.length,
    columnCount: parsedData.columns.length,
    createdAt: new Date().toISOString(),
    queryUrl: `https://console.cloud.google.com/bigquery?project=${projectId}&ws=!1m5!1m4!4m3!1s${projectId}!2s${datasetId}!3s${tableId}`
  }

  const response: UploadResponse = {
    data: {
      rows: parsedData.rows,
      columns: parsedData.columns,
      rowCount: parsedData.rows.length,
      columnCount: parsedData.columns.length
    },
    bigQueryDetails
  }

  console.log('✅ Mock: 文件处理成功', response)
  return response
}

// 获取工作区列表 (Mock)
export async function getWorkspaces(): Promise<{ workspaces: Workspace[] }> {
  await delay(500)
  
  return {
    workspaces: [
      {
        id: 'workspace_1',
        name: '示例工作区 1',
        description: '这是一个示例工作区',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'workspace_2',
        name: '示例工作区 2',
        description: '另一个示例工作区',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  }
}

// 获取工作区详情 (Mock)
export async function getWorkspace(workspaceId: string): Promise<{ workspace: Workspace }> {
  await delay(300)
  
  return {
    workspace: {
      id: workspaceId,
      name: '示例工作区',
      description: '这是一个示例工作区',
      createdAt: new Date().toISOString()
    }
  }
}
