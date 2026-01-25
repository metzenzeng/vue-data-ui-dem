# Workspace 数据分析功能完整实现 Prompt

本文档包含 `/workspace` 页面所有功能的详细实现说明，可用于在其他项目中重现这些功能。

## 📋 项目概述

创建一个数据工作区管理页面，支持用户上传 CSV/Excel 文件，进行数据分析和可视化，并集成 BigQuery 进行数据存储。

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **路由**: Vue Router 4
- **状态管理**: Pinia (可选)
- **图表库**: vue-data-ui (或类似图表库)
- **构建工具**: Vite
- **样式**: CSS/SCSS

## 📦 依赖项

```json
{
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "vue-data-ui": "^2.10.7",
    "pinia": "^3.0.1"
  }
}
```

## 🎯 核心功能模块

### 模块 1: 工作区管理

#### 功能描述
允许用户创建和管理数据工作区，每个工作区可以包含多个数据文件。

#### 实现要点

**1.1 创建工作区表单**
```vue
<template>
  <form @submit.prevent="createWorkspace">
    <input v-model="workspaceName" type="text" required />
    <textarea v-model="workspaceDescription" />
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? '创建中...' : '创建工作区' }}
    </button>
  </form>
</template>

<script setup>
const workspaceName = ref('')
const workspaceDescription = ref('')
const isLoading = ref(false)

const createWorkspace = async () => {
  isLoading.value = true
  try {
    const response = await createWorkspaceAPI({
      name: workspaceName.value,
      description: workspaceDescription.value
    })
    currentWorkspace.value = response.workspace
  } catch (error) {
    alert('创建失败: ' + error.message)
  } finally {
    isLoading.value = false
  }
}
</script>
```

**1.2 API 接口**
```typescript
// POST /api/workspaces
interface CreateWorkspaceRequest {
  name: string
  description?: string
}

interface CreateWorkspaceResponse {
  workspace: {
    id: string
    name: string
    description?: string
    createdAt: string
  }
}
```

---

### 模块 2: 文件上传

#### 功能描述
支持拖拽和点击上传 CSV/Excel 文件，显示上传进度。

#### 实现要点

**2.1 文件上传 UI**
```vue
<template>
  <div 
    class="upload-area" 
    :class="{ 'drag-over': isDragOver }"
    @drop="handleDrop"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".csv,.xlsx,.xls"
      @change="handleFileSelect"
      class="file-input"
    />
    <div class="upload-content">
      <div class="upload-icon">📁</div>
      <p>拖拽文件到此处或 <span @click="triggerFileInput">点击选择</span></p>
      <p>支持 CSV 和 Excel 文件</p>
    </div>
  </div>
  <div v-if="selectedFile">
    <span>已选择: {{ selectedFile.name }}</span>
    <button @click="uploadFile" :disabled="isUploading">
      {{ isUploading ? '上传中...' : '上传文件' }}
    </button>
  </div>
</template>

<script setup>
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
    selectedFile.value = file
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('workspaceId', currentWorkspace.value.id)
  
  try {
    const response = await uploadFileToBigQuery(formData)
    // 处理响应
  } catch (error) {
    alert('上传失败: ' + error.message)
  } finally {
    isUploading.value = false
  }
}
</script>
```

**2.2 文件解析 (CSV)**
```typescript
// 解析 CSV 文件
const parseCSV = async (file: File): Promise<{ rows: any[][], columns: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length === 0) {
        reject(new Error('文件为空'))
        return
      }
      
      // 解析 CSV 行（处理引号和逗号）
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"'
              i++
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      }
      
      const columns = parseCSVLine(lines[0])
      const rows = lines.slice(1).map(line => parseCSVLine(line))
      
      resolve({ rows, columns })
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'UTF-8')
  })
}
```

---

### 模块 3: 数据质量分析

#### 功能描述
自动检查数据质量，包括完整度、空值、重复行等。

#### 实现要点

**3.1 数据质量检查函数**
```typescript
interface DataQuality {
  totalRows: number
  totalColumns: number
  nullValues: number
  duplicateRows: number
  completeness: number
  issues: string[]
}

function checkDataQuality(
  rows: any[][],
  columns: string[]
): DataQuality {
  const totalRows = rows.length
  const totalColumns = columns.length
  let nullValues = 0
  const rowHashes = new Set<string>()
  let duplicateRows = 0
  
  rows.forEach(row => {
    const hash = JSON.stringify(row)
    if (rowHashes.has(hash)) {
      duplicateRows++
    } else {
      rowHashes.add(hash)
    }
    
    row.forEach(cell => {
      if (cell === null || cell === undefined || cell === '') {
        nullValues++
      }
    })
  })
  
  const totalCells = totalRows * totalColumns
  const completeness = totalCells > 0 
    ? ((totalCells - nullValues) / totalCells) * 100 
    : 0
  
  const issues: string[] = []
  if (nullValues > 0) issues.push(`发现 ${nullValues} 个空值`)
  if (duplicateRows > 0) issues.push(`发现 ${duplicateRows} 行重复数据`)
  if (completeness < 80) issues.push(`数据完整度较低 (${completeness.toFixed(1)}%)`)
  
  return {
    totalRows,
    totalColumns,
    nullValues,
    duplicateRows,
    completeness: Math.round(completeness * 100) / 100,
    issues
  }
}
```

**3.2 UI 展示**
```vue
<template>
  <div class="quality-grid">
    <div class="quality-item">
      <div class="quality-label">数据完整度</div>
      <div class="quality-value" :class="getQualityClass(dataQuality.completeness)">
        {{ dataQuality.completeness }}%
      </div>
    </div>
    <div class="quality-item">
      <div class="quality-label">空值数量</div>
      <div class="quality-value">{{ dataQuality.nullValues }}</div>
    </div>
    <div class="quality-item">
      <div class="quality-label">重复行数</div>
      <div class="quality-value">{{ dataQuality.duplicateRows }}</div>
    </div>
  </div>
  <div v-if="dataQuality.issues.length > 0" class="quality-issues">
    <p>⚠️ 发现的问题：</p>
    <ul>
      <li v-for="issue in dataQuality.issues">{{ issue }}</li>
    </ul>
  </div>
</template>

<script setup>
const getQualityClass = (completeness: number) => {
  if (completeness >= 90) return 'quality-excellent'
  if (completeness >= 70) return 'quality-good'
  return 'quality-poor'
}
</script>

<style>
.quality-excellent { color: #10b981; }
.quality-good { color: #f59e0b; }
.quality-poor { color: #ef4444; }
</style>
```

---

### 模块 4: 列统计信息

#### 功能描述
自动检测列类型并计算统计信息（最小值、最大值、平均值、总和等）。

#### 实现要点

**4.1 类型检测和统计**
```typescript
interface ColumnStats {
  name: string
  type: 'number' | 'string' | 'date' | 'boolean'
  nullCount: number
  uniqueCount: number
  stats?: {
    min?: number
    max?: number
    avg?: number
    sum?: number
  }
}

function detectColumnType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonNullValues.length === 0) return 'string'
  
  // 检测数字（80% 以上为数字）
  const numericCount = nonNullValues.filter(v => {
    const num = Number(v)
    return !isNaN(num) && isFinite(num)
  }).length
  
  if (numericCount / nonNullValues.length > 0.8) {
    return 'number'
  }
  
  // 检测日期（70% 以上为有效日期）
  const dateCount = nonNullValues.filter(v => {
    const date = new Date(v)
    return !isNaN(date.getTime())
  }).length
  
  if (dateCount / nonNullValues.length > 0.7) {
    return 'date'
  }
  
  // 检测布尔值
  const boolCount = nonNullValues.filter(v => {
    const str = String(v).toLowerCase()
    return ['true', 'false', '1', '0', 'yes', 'no'].includes(str)
  }).length
  
  if (boolCount / nonNullValues.length > 0.8) {
    return 'boolean'
  }
  
  return 'string'
}

function calculateColumnStats(
  columnName: string,
  columnIndex: number,
  rows: any[][]
): ColumnStats {
  const values = rows.map(row => row[columnIndex])
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
  const type = detectColumnType(values)
  
  const stats: ColumnStats = {
    name: columnName,
    type,
    nullCount: values.length - nonNullValues.length,
    uniqueCount: new Set(nonNullValues).size
  }
  
  if (type === 'number') {
    const numbers = nonNullValues.map(v => Number(v)).filter(n => !isNaN(n) && isFinite(n))
    if (numbers.length > 0) {
      stats.stats = {
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        sum: numbers.reduce((a, b) => a + b, 0)
      }
    }
  }
  
  return stats
}
```

**4.2 UI 展示**
```vue
<template>
  <div class="stats-container">
    <div v-for="stat in columnStats" :key="stat.name" class="stat-card">
      <div class="stat-header">
        <span class="stat-name">{{ stat.name }}</span>
        <span class="stat-type" :class="'type-' + stat.type">
          {{ getTypeLabel(stat.type) }}
        </span>
      </div>
      <div class="stat-details">
        <div>空值: {{ stat.nullCount }}</div>
        <div>唯一值: {{ stat.uniqueCount }}</div>
        <div v-if="stat.stats" class="stat-numbers">
          <div>最小值: {{ stat.stats.min }}</div>
          <div>最大值: {{ stat.stats.max }}</div>
          <div>平均值: {{ stat.stats.avg?.toFixed(2) }}</div>
          <div>总和: {{ stat.stats.sum }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

### 模块 5: 数据可视化

#### 功能描述
支持折线图、柱状图、饼图等多种图表类型。

#### 实现要点

**5.1 图表数据准备**
```typescript
function prepareChartData(
  rows: any[][],
  columns: string[],
  xColumn: string,
  yColumn: string
): { x: string, y: number }[] {
  const xIndex = columns.indexOf(xColumn)
  const yIndex = columns.indexOf(yColumn)
  
  if (xIndex === -1 || yIndex === -1) return []
  
  return rows
    .filter(row => row[xIndex] && row[yIndex])
    .map(row => ({
      x: String(row[xIndex]),
      y: Number(row[yIndex]) || 0
    }))
    .filter(item => !isNaN(item.y))
}
```

**5.2 图表组件**
```vue
<template>
  <div class="chart-controls">
    <select v-model="selectedXColumn">
      <option value="">选择 X 轴...</option>
      <option v-for="col in availableColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="selectedYColumn">
      <option value="">选择 Y 轴...</option>
      <option v-for="col in numericColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="chartType">
      <option value="line">折线图</option>
      <option value="bar">柱状图</option>
    </select>
  </div>
  <div v-if="selectedXColumn && selectedYColumn">
    <VueUiXy
      v-if="chartType === 'line'"
      :config="lineChartConfig"
      :dataset="preparedChartData"
    />
    <VueUiVerticalBar
      v-if="chartType === 'bar'"
      :config="barChartConfig"
      :dataset="preparedChartData"
    />
  </div>
</template>

<script setup>
const selectedXColumn = ref('')
const selectedYColumn = ref('')
const chartType = ref<'line' | 'bar'>('line')

const preparedChartData = computed(() => {
  if (!selectedXColumn.value || !selectedYColumn.value) return []
  return prepareChartData(rawRows.value, rawColumns.value, 
    selectedXColumn.value, selectedYColumn.value)
})

const lineChartConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: { backgroundColor: '#ffffff', color: '#1f2937' },
    grid: { stroke: '#e5e7eb', strokeWidth: 1 },
    line: { stroke: '#3b82f6', strokeWidth: 3 }
  }
})
</script>
```

---

### 模块 6: 分组统计

#### 功能描述
按指定列分组并计算聚合值（求和、平均值、计数等）。

#### 实现要点

**6.1 分组统计函数**
```typescript
function groupBy(
  rows: any[][],
  columns: string[],
  groupColumn: string,
  valueColumn: string,
  operation: 'sum' | 'avg' | 'count' | 'max' | 'min' = 'sum'
): { name: string, value: number }[] {
  const groupIndex = columns.indexOf(groupColumn)
  const valueIndex = columns.indexOf(valueColumn)
  
  if (groupIndex === -1 || valueIndex === -1) return []
  
  const groups = new Map<string, number[]>()
  
  rows.forEach(row => {
    const groupKey = String(row[groupIndex] || '未知')
    const value = Number(row[valueIndex]) || 0
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(value)
  })
  
  const result: { name: string, value: number }[] = []
  
  groups.forEach((values, name) => {
    let value = 0
    switch (operation) {
      case 'sum':
        value = values.reduce((a, b) => a + b, 0)
        break
      case 'avg':
        value = values.reduce((a, b) => a + b, 0) / values.length
        break
      case 'count':
        value = values.length
        break
      case 'max':
        value = Math.max(...values)
        break
      case 'min':
        value = Math.min(...values)
        break
    }
    result.push({ name, value: Math.round(value * 100) / 100 })
  })
  
  return result.sort((a, b) => b.value - a.value)
}
```

**6.2 UI 展示**
```vue
<template>
  <div class="group-controls">
    <select v-model="groupByColumn">
      <option value="">选择分组列...</option>
      <option v-for="col in availableColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="groupValueColumn">
      <option value="">选择统计列...</option>
      <option v-for="col in numericColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="groupOperation">
      <option value="sum">求和</option>
      <option value="avg">平均值</option>
      <option value="count">计数</option>
      <option value="max">最大值</option>
      <option value="min">最小值</option>
    </select>
  </div>
  <div v-if="groupData.length > 0">
    <VueUiDonut :config="donutConfig" :dataset="groupData" />
    <table>
      <thead>
        <tr>
          <th>{{ groupByColumn }}</th>
          <th>{{ getOperationLabel(groupOperation) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in groupData" :key="item.name">
          <td>{{ item.name }}</td>
          <td>{{ formatNumber(item.value) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

### 模块 7: 数据筛选和搜索

#### 功能描述
支持全局搜索和多条件筛选。

#### 实现要点

**7.1 搜索和筛选函数**
```typescript
function searchData(
  rows: any[][],
  columns: string[],
  searchTerm: string,
  searchColumns?: string[]
): any[][] {
  if (!searchTerm || searchTerm.trim() === '') return rows
  
  const term = searchTerm.toLowerCase()
  const columnsToSearch = searchColumns || columns
  
  return rows.filter(row => {
    return columnsToSearch.some(colName => {
      const colIndex = columns.indexOf(colName)
      if (colIndex === -1) return false
      const cellValue = String(row[colIndex] || '').toLowerCase()
      return cellValue.includes(term)
    })
  })
}

function filterData(
  rows: any[][],
  columns: string[],
  filters: { column: string, operator: string, value: any }[]
): any[][] {
  return rows.filter(row => {
    return filters.every(filter => {
      const columnIndex = columns.indexOf(filter.column)
      if (columnIndex === -1) return true
      
      const cellValue = row[columnIndex]
      const filterValue = filter.value
      
      switch (filter.operator) {
        case 'equals':
          return String(cellValue) === String(filterValue)
        case 'contains':
          return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase())
        case 'greater':
          return Number(cellValue) > Number(filterValue)
        case 'less':
          return Number(cellValue) < Number(filterValue)
        case 'notNull':
          return cellValue !== null && cellValue !== undefined && cellValue !== ''
        default:
          return true
      }
    })
  })
}
```

**7.2 UI 实现**
```vue
<template>
  <div class="filter-section">
    <input
      v-model="searchTerm"
      type="text"
      placeholder="搜索数据..."
      @input="applyFilters"
    />
    <button @click="showFilterDialog = true">➕ 添加筛选条件</button>
    <div v-if="activeFilters.length > 0" class="active-filters">
      <div v-for="(filter, index) in activeFilters" :key="index" class="filter-tag">
        <span>{{ filter.column }} {{ getOperatorLabel(filter.operator) }} {{ filter.value }}</span>
        <button @click="removeFilter(index)">×</button>
      </div>
    </div>
    <p>显示 {{ filteredRows.length }} / {{ rawRows.length }} 行数据</p>
  </div>
  
  <!-- 筛选对话框 -->
  <div v-if="showFilterDialog" class="modal-overlay" @click="showFilterDialog = false">
    <div class="modal-content" @click.stop>
      <h3>添加筛选条件</h3>
      <select v-model="newFilter.column">
        <option value="">选择列...</option>
        <option v-for="col in availableColumns" :value="col">{{ col }}</option>
      </select>
      <select v-model="newFilter.operator">
        <option value="equals">等于</option>
        <option value="contains">包含</option>
        <option value="greater">大于</option>
        <option value="less">小于</option>
        <option value="notNull">非空</option>
      </select>
      <input v-if="newFilter.operator !== 'notNull'" v-model="newFilter.value" />
      <button @click="addFilter">添加</button>
    </div>
  </div>
</template>

<script setup>
const searchTerm = ref('')
const activeFilters = ref<{ column: string, operator: string, value: any }[]>([])
const filteredRows = ref<any[][]>([])

const applyFilters = () => {
  let result = rawRows.value
  
  if (searchTerm.value) {
    result = searchData(result, rawColumns.value, searchTerm.value)
  }
  
  if (activeFilters.value.length > 0) {
    result = filterData(result, rawColumns.value, activeFilters.value)
  }
  
  filteredRows.value = result
  updateDisplayTable()
}

const addFilter = () => {
  if (!newFilter.value.column) return
  activeFilters.value.push({ ...newFilter.value })
  newFilter.value = { column: '', operator: 'equals', value: '' }
  showFilterDialog.value = false
  applyFilters()
}
</script>
```

---

### 模块 8: 数据转换工具

#### 功能描述
支持列类型转换和缺失值填充。

#### 实现要点

**8.1 类型转换函数**
```typescript
function convertColumnType(
  rows: any[][],
  columnIndex: number,
  targetType: 'number' | 'string' | 'date'
): any[][] {
  return rows.map(row => {
    const newRow = [...row]
    const value = newRow[columnIndex]
    
    if (value === null || value === undefined || value === '') {
      newRow[columnIndex] = null
      return newRow
    }
    
    switch (targetType) {
      case 'number':
        const num = Number(value)
        newRow[columnIndex] = isNaN(num) ? null : num
        break
      case 'date':
        const date = new Date(value)
        newRow[columnIndex] = isNaN(date.getTime()) ? null : date.toISOString()
        break
      case 'string':
        newRow[columnIndex] = String(value)
        break
    }
    
    return newRow
  })
}
```

**8.2 缺失值填充函数**
```typescript
function fillMissingValues(
  rows: any[][],
  columnIndex: number,
  strategy: 'mean' | 'median' | 'mode' | 'zero' | 'forward' | 'backward',
  value?: any
): any[][] {
  const columnValues = rows.map(row => row[columnIndex])
    .filter(v => v !== null && v !== undefined && v !== '')
  
  let fillValue: any = value
  
  if (!fillValue) {
    switch (strategy) {
      case 'mean':
        const numbers = columnValues.map(v => Number(v)).filter(n => !isNaN(n))
        fillValue = numbers.length > 0 
          ? numbers.reduce((a, b) => a + b, 0) / numbers.length 
          : 0
        break
      case 'median':
        const nums = columnValues.map(v => Number(v))
          .filter(n => !isNaN(n))
          .sort((a, b) => a - b)
        fillValue = nums.length > 0 
          ? nums[Math.floor(nums.length / 2)] 
          : 0
        break
      case 'mode':
        const counts: Record<string, number> = {}
        columnValues.forEach(v => {
          const key = String(v)
          counts[key] = (counts[key] || 0) + 1
        })
        fillValue = Object.keys(counts).reduce((a, b) => 
          counts[a] > counts[b] ? a : b, 
          columnValues[0] || ''
        )
        break
      case 'zero':
        fillValue = 0
        break
    }
  }
  
  let lastValue = fillValue
  return rows.map((row, index) => {
    const newRow = [...row]
    if (row[columnIndex] === null || row[columnIndex] === undefined || row[columnIndex] === '') {
      if (strategy === 'forward') {
        newRow[columnIndex] = lastValue
      } else if (strategy === 'backward') {
        const nextValue = rows.slice(index).find(r => 
          r[columnIndex] !== null && r[columnIndex] !== undefined && r[columnIndex] !== ''
        )?.[columnIndex]
        newRow[columnIndex] = nextValue || fillValue
      } else {
        newRow[columnIndex] = fillValue
      }
    } else {
      lastValue = row[columnIndex]
    }
    return newRow
  })
}
```

**8.3 UI 实现**
```vue
<template>
  <div class="transform-section">
    <div class="transform-item">
      <h4>列类型转换</h4>
      <select v-model="transformColumn">
        <option value="">选择列...</option>
        <option v-for="col in availableColumns" :value="col">{{ col }}</option>
      </select>
      <select v-model="transformTargetType">
        <option value="number">转换为数字</option>
        <option value="string">转换为文本</option>
        <option value="date">转换为日期</option>
      </select>
      <button @click="applyTransform">应用转换</button>
    </div>
    <div class="transform-item">
      <h4>填充缺失值</h4>
      <select v-model="fillColumn">
        <option value="">选择列...</option>
        <option v-for="col in availableColumns" :value="col">{{ col }}</option>
      </select>
      <select v-model="fillStrategy">
        <option value="mean">平均值</option>
        <option value="median">中位数</option>
        <option value="mode">众数</option>
        <option value="zero">零值</option>
        <option value="forward">前向填充</option>
        <option value="backward">后向填充</option>
      </select>
      <button @click="applyFill">填充缺失值</button>
    </div>
  </div>
</template>
```

---

### 模块 9: 高级可视化（散点图）

#### 功能描述
散点图用于相关性分析，自动计算相关系数。

#### 实现要点

**9.1 相关系数计算**
```typescript
function calculateCorrelation(
  data: { x: number, y: number }[]
): number | null {
  if (data.length < 2) return null
  
  const n = data.length
  const sumX = data.reduce((sum, d) => sum + d.x, 0)
  const sumY = data.reduce((sum, d) => sum + d.y, 0)
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0)
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0)
  const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  )
  
  if (denominator === 0) return null
  
  return numerator / denominator
}

function getCorrelationDesc(corr: number): string {
  const abs = Math.abs(corr)
  if (abs >= 0.9) return '极强相关'
  if (abs >= 0.7) return '强相关'
  if (abs >= 0.5) return '中等相关'
  if (abs >= 0.3) return '弱相关'
  return '几乎不相关'
}
```

**9.2 UI 实现**
```vue
<template>
  <div class="advanced-viz-controls">
    <select v-model="scatterXColumn">
      <option value="">选择 X 轴 (数值)...</option>
      <option v-for="col in numericColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="scatterYColumn">
      <option value="">选择 Y 轴 (数值)...</option>
      <option v-for="col in numericColumns" :value="col">{{ col }}</option>
    </select>
  </div>
  <div v-if="scatterData.length > 0">
    <VueUiXy :config="scatterChartConfig" :dataset="scatterData" />
    <div class="correlation-info" v-if="correlation !== null">
      <p>相关系数: <strong>{{ correlation.toFixed(3) }}</strong></p>
      <p>{{ getCorrelationDesc(correlation) }}</p>
    </div>
  </div>
</template>
```

---

### 模块 10: 数据透视表

#### 功能描述
多维度数据交叉分析。

#### 实现要点

**10.1 透视表计算**
```typescript
function createPivotTable(
  rows: any[][],
  columns: string[],
  rowDimension: string,
  colDimension: string | null,
  valueColumn: string,
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min'
): {
  table: Array<{ rowLabel: string, values: Record<string, number>, total: number }>
  rowLabels: string[]
  colLabels: string[]
} {
  const rowIndex = columns.indexOf(rowDimension)
  const valueIndex = columns.indexOf(valueColumn)
  const colIndex = colDimension ? columns.indexOf(colDimension) : -1
  
  if (rowIndex === -1 || valueIndex === -1) {
    return { table: [], rowLabels: [], colLabels: [] }
  }
  
  const pivot: Record<string, Record<string, number[]>> = {}
  const rowLabels = new Set<string>()
  const colLabels = new Set<string>()
  
  rows.forEach(row => {
    const rowLabel = String(row[rowIndex] || '未知')
    const colLabel = colIndex >= 0 ? String(row[colIndex] || '总计') : '总计'
    const value = Number(row[valueIndex]) || 0
    
    rowLabels.add(rowLabel)
    colLabels.add(colLabel)
    
    if (!pivot[rowLabel]) {
      pivot[rowLabel] = {}
    }
    if (!pivot[rowLabel][colLabel]) {
      pivot[rowLabel][colLabel] = []
    }
    pivot[rowLabel][colLabel].push(value)
  })
  
  const table = Array.from(rowLabels).map(rowLabel => {
    const values: Record<string, number> = {}
    let total = 0
    
    Array.from(colLabels).forEach(colLabel => {
      const nums = pivot[rowLabel]?.[colLabel] || []
      let value = 0
      
      switch (aggregation) {
        case 'sum':
          value = nums.reduce((a, b) => a + b, 0)
          break
        case 'avg':
          value = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
          break
        case 'count':
          value = nums.length
          break
        case 'max':
          value = nums.length > 0 ? Math.max(...nums) : 0
          break
        case 'min':
          value = nums.length > 0 ? Math.min(...nums) : 0
          break
      }
      
      values[colLabel] = value
      total += value
    })
    
    return { rowLabel, values, total }
  })
  
  return {
    table,
    rowLabels: Array.from(rowLabels),
    colLabels: Array.from(colLabels)
  }
}
```

**10.2 UI 实现**
```vue
<template>
  <div class="pivot-controls">
    <select v-model="pivotRow">
      <option value="">选择行维度...</option>
      <option v-for="col in availableColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="pivotCol">
      <option value="">选择列维度...</option>
      <option v-for="col in availableColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="pivotValue">
      <option value="">选择值字段...</option>
      <option v-for="col in numericColumns" :value="col">{{ col }}</option>
    </select>
    <select v-model="pivotAggregation">
      <option value="sum">求和</option>
      <option value="avg">平均值</option>
      <option value="count">计数</option>
      <option value="max">最大值</option>
      <option value="min">最小值</option>
    </select>
  </div>
  <table v-if="pivotTable.length > 0" class="pivot-table">
    <thead>
      <tr>
        <th>{{ pivotRow }}</th>
        <th v-for="col in pivotColumns" :key="col">{{ col }}</th>
        <th>总计</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in pivotTable" :key="row.rowLabel">
        <td class="pivot-row-header">{{ row.rowLabel }}</td>
        <td v-for="col in pivotColumns" :key="col">
          {{ formatNumber(row.values[col] || 0) }}
        </td>
        <td class="pivot-total">{{ formatNumber(row.total) }}</td>
      </tr>
      <tr class="pivot-footer">
        <td class="pivot-row-header">总计</td>
        <td v-for="col in pivotColumns" :key="col" class="pivot-total">
          {{ formatNumber(pivotColumnTotals[col] || 0) }}
        </td>
        <td class="pivot-grand-total">{{ formatNumber(pivotGrandTotal) }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

---

### 模块 11: 数据导出

#### 功能描述
支持导出为 CSV、JSON 等格式。

#### 实现要点

**11.1 导出函数**
```typescript
function exportToCSV(
  rows: any[][],
  columns: string[],
  filename: string = 'export.csv'
): void {
  const csvContent = [
    columns.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const str = String(cell || '')
        // 处理包含逗号或引号的值
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportToJSON(
  rows: any[][],
  columns: string[],
  filename: string = 'export.json'
): void {
  const data = rows.map(row => {
    const obj: any = {}
    columns.forEach((col, index) => {
      obj[col] = row[index]
    })
    return obj
  })
  
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
```

**11.2 UI 实现**
```vue
<template>
  <div class="export-section">
    <div class="export-options">
      <button @click="exportData('csv')">📄 导出为 CSV</button>
      <button @click="exportData('json')">📋 导出为 JSON</button>
      <button @click="exportData('excel')">📊 导出为 Excel</button>
    </div>
    <div class="export-info">
      <p v-if="activeFilters.length > 0 || searchTerm">
        将导出筛选后的数据 ({{ filteredRows.length }} 行)
      </p>
      <p v-else>
        将导出全部数据 ({{ rawRows.length }} 行)
      </p>
    </div>
  </div>
</template>

<script setup>
const exportData = (format: 'csv' | 'json' | 'excel') => {
  const rowsToExport = filteredRows.value.length > 0 
    ? filteredRows.value 
    : rawRows.value
  const filename = `${workspaceName.value || 'data'}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : format}`
  
  if (format === 'csv' || format === 'excel') {
    exportToCSV(rowsToExport, rawColumns.value, filename)
  } else if (format === 'json') {
    exportToJSON(rowsToExport, rawColumns.value, filename)
  }
}
</script>
```

---

### 模块 12: BigQuery 集成

#### 功能描述
上传文件后自动创建 BigQuery 表。

#### 实现要点

**12.1 API 接口**
```typescript
// POST /api/workspaces/upload
// Content-Type: multipart/form-data
// Form Data:
//   - file: File (CSV/Excel)
//   - workspaceId: string

interface UploadResponse {
  data: {
    rows: any[][]
    columns: string[]
    rowCount: number
    columnCount: number
  }
  bigQueryDetails: {
    projectId: string
    datasetId: string
    tableId: string
    rowCount: number
    columnCount: number
    createdAt: string
    queryUrl: string
  }
}
```

**12.2 前端调用**
```typescript
async function uploadFileToBigQuery(formData: FormData): Promise<UploadResponse> {
  const url = `${API_BASE_URL}/workspaces/upload`
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    throw new Error(`上传失败: ${response.status}`)
  }
  
  return await response.json()
}
```

**12.3 UI 展示**
```vue
<template>
  <div class="workspace-card" v-if="bigQueryDetails">
    <h2>✅ BigQuery 表信息</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>项目 ID:</label>
        <span>{{ bigQueryDetails.projectId }}</span>
      </div>
      <div class="info-item">
        <label>数据集:</label>
        <span>{{ bigQueryDetails.datasetId }}</span>
      </div>
      <div class="info-item">
        <label>表名:</label>
        <span>{{ bigQueryDetails.tableId }}</span>
      </div>
      <div class="info-item">
        <label>行数:</label>
        <span>{{ bigQueryDetails.rowCount }}</span>
      </div>
      <div class="info-item">
        <label>列数:</label>
        <span>{{ bigQueryDetails.columnCount }}</span>
      </div>
    </div>
    <a :href="bigQueryDetails.queryUrl" target="_blank" class="btn">
      🔗 在 BigQuery 中查看
    </a>
  </div>
</template>
```

---

## 📁 文件结构

```
src/
├── views/
│   └── WorkspaceView.vue          # 主页面组件
├── services/
│   ├── api.ts                      # API 服务（支持 Mock）
│   └── api-mock.ts                 # Mock API 实现
├── utils/
│   └── dataAnalysis.ts             # 数据分析工具函数
└── router/
    └── index.ts                    # 路由配置
```

---

## 🎨 UI/UX 设计要点

### 布局结构
- **卡片式设计**：每个功能模块使用独立的卡片
- **响应式布局**：支持移动端和桌面端
- **颜色编码**：数据质量用颜色直观显示
- **加载状态**：所有异步操作显示加载动画

### 交互设计
- **拖拽上传**：支持文件拖拽
- **实时搜索**：输入即搜索
- **筛选标签**：可视化显示活动筛选
- **模态对话框**：筛选条件添加使用模态框

### 样式规范
```css
/* 主色调 */
--primary: #3b82f6;
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;

/* 卡片样式 */
.workspace-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
}

/* 按钮样式 */
.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
```

---

## 🔄 数据流

```
用户上传文件
    ↓
解析文件 (CSV/Excel)
    ↓
保存原始数据 (rawRows, rawColumns)
    ↓
执行数据分析
    ├── 数据质量检查
    ├── 列统计计算
    └── 类型检测
    ↓
应用筛选和搜索
    ↓
生成筛选后数据 (filteredRows)
    ↓
更新显示
    ├── 数据表格
    ├── 图表
    ├── 分组统计
    └── 透视表
```

---

## 🧪 Mock 数据支持

### Mock API 实现
```typescript
// 开发环境自动启用 Mock
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV

// Mock 延迟模拟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock 工作区创建
export async function createWorkspace(data: CreateWorkspaceRequest) {
  await delay(800)
  return {
    workspace: {
      id: `workspace_${Date.now()}`,
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString()
    }
  }
}

// Mock 文件上传
export async function uploadFileToBigQuery(formData: FormData) {
  await delay(2000)
  const file = formData.get('file') as File
  
  // 解析 CSV
  const parsedData = await parseCSV(file)
  
  return {
    data: parsedData,
    bigQueryDetails: {
      projectId: 'mock-gcp-project',
      datasetId: 'mock_dataset',
      tableId: `table_${Date.now()}`,
      rowCount: parsedData.rows.length,
      columnCount: parsedData.columns.length,
      createdAt: new Date().toISOString(),
      queryUrl: 'https://console.cloud.google.com/bigquery?...'
    }
  }
}
```

---

## 📝 实现步骤

### 步骤 1: 项目初始化
1. 创建 Vue 3 + TypeScript 项目
2. 安装依赖：vue-router, vue-data-ui (或类似图表库)
3. 配置路由

### 步骤 2: 创建工具函数
1. 创建 `utils/dataAnalysis.ts`
2. 实现所有数据分析函数
3. 导出类型定义

### 步骤 3: 创建 API 服务
1. 创建 `services/api.ts`
2. 创建 `services/api-mock.ts`
3. 实现 Mock 模式切换

### 步骤 4: 创建主页面组件
1. 创建 `views/WorkspaceView.vue`
2. 实现工作区创建表单
3. 实现文件上传功能

### 步骤 5: 实现数据分析功能
1. 数据质量分析
2. 列统计信息
3. 数据可视化
4. 分组统计

### 步骤 6: 实现高级功能
1. 数据筛选和搜索
2. 数据转换工具
3. 高级可视化
4. 数据透视表
5. 数据导出

### 步骤 7: 样式优化
1. 响应式设计
2. 颜色编码
3. 加载状态
4. 错误处理

---

## 🎯 关键实现细节

### 1. 数据状态管理
```typescript
// 原始数据（不变）
const rawRows = ref<any[][]>([])
const rawColumns = ref<string[]>([])

// 筛选后数据（可变）
const filteredRows = ref<any[][]>([])

// 计算属性自动更新
const displayTableData = computed(() => {
  // 基于 filteredRows 生成表格数据
})
```

### 2. 筛选联动
```typescript
// 监听筛选变化，自动更新所有依赖
watch([searchTerm, activeFilters], () => {
  applyFilters()
}, { deep: true })

// 所有图表和分析都使用 filteredRows
const preparedChartData = computed(() => {
  const rowsToUse = filteredRows.value.length > 0 
    ? filteredRows.value 
    : rawRows.value
  return prepareChartData(rowsToUse, ...)
})
```

### 3. 性能优化
```typescript
// 大数据集采样
const MAX_DISPLAY_ROWS = 1000
const displayRows = rows.length > MAX_DISPLAY_ROWS
  ? rows.slice(0, MAX_DISPLAY_ROWS)
  : rows

// 计算属性缓存
const columnStats = computed(() => {
  // 只在 rawRows 变化时重新计算
})
```

---

## 🐛 常见问题处理

### 1. CSV 解析问题
- 处理引号内的逗号
- 处理换行符
- 处理编码问题（UTF-8 BOM）

### 2. 大数据集性能
- 限制显示行数
- 使用虚拟滚动
- 异步计算统计

### 3. 类型检测准确性
- 提高检测阈值
- 支持手动指定类型
- 处理混合类型列

---

## 📚 参考资源

- Vue 3 官方文档: https://vuejs.org/
- vue-data-ui 文档: https://vue-data-ui.com/
- BigQuery API: https://cloud.google.com/bigquery/docs
- CSV 解析规范: RFC 4180

---

## 🎨 完整 Prompt 模板

```
创建一个数据工作区管理页面，包含以下功能：

1. 工作区管理
   - 创建工作区（名称、描述）
   - 工作区列表展示

2. 文件上传
   - 支持拖拽上传
   - 支持 CSV 和 Excel 文件
   - 显示上传进度
   - 文件解析和验证

3. 数据质量分析
   - 自动计算数据完整度
   - 统计空值和重复行
   - 问题提示和建议

4. 列统计信息
   - 自动检测列类型（数字、文本、日期、布尔）
   - 计算统计指标（最小值、最大值、平均值、总和）
   - 显示空值和唯一值数量

5. 数据可视化
   - 折线图（趋势分析）
   - 柱状图（对比分析）
   - 动态列选择
   - 实时图表更新

6. 分组统计
   - 按列分组
   - 支持多种聚合操作（求和、平均值、计数、最大值、最小值）
   - 饼图可视化
   - 统计表格

7. 数据筛选和搜索
   - 全局搜索
   - 多条件筛选（等于、包含、大于、小于、非空）
   - 筛选标签显示
   - 实时更新结果

8. 数据转换工具
   - 列类型转换（数字、文本、日期）
   - 缺失值填充（平均值、中位数、众数、零值、前向、后向）

9. 高级可视化
   - 散点图（相关性分析）
   - 自动计算相关系数
   - 相关性强度提示

10. 数据透视表
    - 行/列/值维度选择
    - 多种聚合方式
    - 自动计算总计
    - 清晰的表格布局

11. 数据导出
    - CSV 格式
    - JSON 格式
    - Excel 格式
    - 智能导出（筛选后数据）

12. BigQuery 集成
    - 自动创建 BigQuery 表
    - 显示表信息
    - 生成查询链接

技术要求：
- Vue 3 + TypeScript
- 响应式设计
- Mock 数据支持（开发环境）
- 性能优化（大数据集处理）
- 错误处理和用户提示

UI 要求：
- 卡片式布局
- 颜色编码（数据质量）
- 加载状态
- 模态对话框
- 响应式设计
```

---

## ✅ 检查清单

实现时请确保：

- [ ] 所有功能模块已实现
- [ ] 类型定义完整
- [ ] 错误处理完善
- [ ] 响应式设计
- [ ] 性能优化
- [ ] Mock 数据支持
- [ ] 代码注释清晰
- [ ] 用户体验良好

---

## 📄 许可证

本文档可用于任何项目，无需授权。

---

**最后更新**: 2026-01-25
