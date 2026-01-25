// 数据分析工具函数

export interface ColumnStats {
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

export interface DataQuality {
  totalRows: number
  totalColumns: number
  nullValues: number
  duplicateRows: number
  completeness: number
  issues: string[]
}

// 检测列类型
export function detectColumnType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
  if (values.length === 0) return 'string'
  
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonNullValues.length === 0) return 'string'
  
  // 检测数字
  const numericCount = nonNullValues.filter(v => {
    const num = Number(v)
    return !isNaN(num) && isFinite(num)
  }).length
  
  if (numericCount / nonNullValues.length > 0.8) {
    return 'number'
  }
  
  // 检测日期
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
    return str === 'true' || str === 'false' || str === '1' || str === '0' || str === 'yes' || str === 'no'
  }).length
  
  if (boolCount / nonNullValues.length > 0.8) {
    return 'boolean'
  }
  
  return 'string'
}

// 计算列统计信息
export function calculateColumnStats(
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

// 数据质量检查
export function checkDataQuality(
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
  const completeness = totalCells > 0 ? ((totalCells - nullValues) / totalCells) * 100 : 0
  
  const issues: string[] = []
  if (nullValues > 0) {
    issues.push(`发现 ${nullValues} 个空值`)
  }
  if (duplicateRows > 0) {
    issues.push(`发现 ${duplicateRows} 行重复数据`)
  }
  if (completeness < 80) {
    issues.push(`数据完整度较低 (${completeness.toFixed(1)}%)`)
  }
  
  return {
    totalRows,
    totalColumns,
    nullValues,
    duplicateRows,
    completeness: Math.round(completeness * 100) / 100,
    issues
  }
}

// 为图表准备数据
export function prepareChartData(
  rows: any[][],
  columns: string[],
  xColumn: string,
  yColumn: string
): { x: string, y: number }[] {
  const xIndex = columns.indexOf(xColumn)
  const yIndex = columns.indexOf(yColumn)
  
  if (xIndex === -1 || yIndex === -1) {
    return []
  }
  
  return rows
    .filter(row => row[xIndex] && row[yIndex])
    .map(row => ({
      x: String(row[xIndex]),
      y: Number(row[yIndex]) || 0
    }))
    .filter(item => !isNaN(item.y))
}

// 分组统计
export function groupBy(
  rows: any[][],
  columns: string[],
  groupColumn: string,
  valueColumn: string,
  operation: 'sum' | 'avg' | 'count' | 'max' | 'min' = 'sum'
): { name: string, value: number }[] {
  const groupIndex = columns.indexOf(groupColumn)
  const valueIndex = columns.indexOf(valueColumn)
  
  if (groupIndex === -1 || valueIndex === -1) {
    return []
  }
  
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

// 筛选数据
export function filterData(
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

// 搜索数据
export function searchData(
  rows: any[][],
  columns: string[],
  searchTerm: string,
  searchColumns?: string[]
): any[][] {
  if (!searchTerm || searchTerm.trim() === '') {
    return rows
  }
  
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

// 导出为 CSV
export function exportToCSV(
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
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 导出为 JSON
export function exportToJSON(
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

// 转换列类型
export function convertColumnType(
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

// 填充缺失值
export function fillMissingValues(
  rows: any[][],
  columnIndex: number,
  strategy: 'mean' | 'median' | 'mode' | 'zero' | 'forward' | 'backward',
  value?: any
): any[][] {
  const columnValues = rows.map(row => row[columnIndex]).filter(v => v !== null && v !== undefined && v !== '')
  
  let fillValue: any = value
  
  if (!fillValue) {
    switch (strategy) {
      case 'mean':
        const numbers = columnValues.map(v => Number(v)).filter(n => !isNaN(n))
        fillValue = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
        break
      case 'median':
        const nums = columnValues.map(v => Number(v)).filter(n => !isNaN(n)).sort((a, b) => a - b)
        fillValue = nums.length > 0 ? nums[Math.floor(nums.length / 2)] : 0
        break
      case 'mode':
        const counts: Record<string, number> = {}
        columnValues.forEach(v => {
          const key = String(v)
          counts[key] = (counts[key] || 0) + 1
        })
        fillValue = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, columnValues[0] || '')
        break
      case 'zero':
        fillValue = 0
        break
      case 'forward':
      case 'backward':
        // 这些需要特殊处理
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
        // 向后填充需要反向遍历，这里简化处理
        const nextValue = rows.slice(index).find(r => r[columnIndex] !== null && r[columnIndex] !== undefined && r[columnIndex] !== '')?.[columnIndex]
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
