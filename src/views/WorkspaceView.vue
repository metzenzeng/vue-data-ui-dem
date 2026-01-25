<template>
  <div class="workspace-container">
    <div class="workspace-header">
      <h1>📊 数据工作区管理</h1>
      <p>创建新的工作区并上传数据文件进行分析</p>
    </div>

    <!-- 创建新工作区 -->
    <div class="workspace-card" v-if="!currentWorkspace">
      <h2>创建新工作区</h2>
      <form @submit.prevent="createWorkspace" class="workspace-form">
        <div class="form-group">
          <label for="workspaceName">工作区名称</label>
          <input
            id="workspaceName"
            v-model="workspaceName"
            type="text"
            placeholder="输入工作区名称"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="workspaceDescription">描述（可选）</label>
          <textarea
            id="workspaceDescription"
            v-model="workspaceDescription"
            placeholder="输入工作区描述"
            rows="3"
            class="form-input"
          ></textarea>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? '创建中...' : '创建工作区' }}
        </button>
      </form>
    </div>

    <!-- 文件上传区域 -->
    <div class="workspace-card" v-if="currentWorkspace && !uploadedData">
      <h2>上传数据文件</h2>
      
      <!-- 示例文件下载 -->
      <div class="sample-files">
        <p class="sample-files-title">📥 下载示例文件进行测试：</p>
        <div class="sample-files-list">
          <a href="/sample-data.csv" download class="sample-file-link">
            📊 产品销售数据 (CSV)
          </a>
          <a href="/sample-sales-data.csv" download class="sample-file-link">
            📈 月度销售数据 (CSV)
          </a>
          <a href="/sample-user-data.csv" download class="sample-file-link">
            👥 用户数据 (CSV)
          </a>
        </div>
      </div>

      <div class="upload-area" :class="{ 'drag-over': isDragOver }" @drop="handleDrop" @dragover.prevent="isDragOver = true" @dragleave="isDragOver = false">
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.xlsx,.xls"
          @change="handleFileSelect"
          class="file-input"
        />
        <div class="upload-content">
          <div class="upload-icon">📁</div>
          <p>拖拽文件到此处或 <span class="upload-link" @click="triggerFileInput">点击选择文件</span></p>
          <p class="upload-hint">支持 CSV 和 Excel 文件 (.csv, .xlsx, .xls)</p>
        </div>
      </div>
      <div v-if="selectedFile" class="selected-file">
        <span>已选择: {{ selectedFile.name }}</span>
        <button @click="uploadFile" class="btn btn-upload" :disabled="isUploading">
          {{ isUploading ? '上传中...' : '上传文件' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isProcessing" class="workspace-card">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>正在处理数据并创建 BigQuery 表...</p>
      </div>
    </div>

    <!-- 结果显示 -->
    <div v-if="uploadedData && bigQueryDetails" class="results-container">
      <!-- BigQuery 详情 -->
      <div class="workspace-card">
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
          <div class="info-item">
            <label>创建时间:</label>
            <span>{{ formatDate(bigQueryDetails.createdAt) }}</span>
          </div>
        </div>
        <div class="query-link">
          <a :href="bigQueryDetails.queryUrl" target="_blank" class="btn btn-link">
            🔗 在 BigQuery 中查看
          </a>
        </div>
      </div>

      <!-- 数据质量检查 -->
      <div class="workspace-card" v-if="dataQuality">
        <h2>🔍 数据质量分析</h2>
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
          <p class="issues-title">⚠️ 发现的问题：</p>
          <ul class="issues-list">
            <li v-for="(issue, index) in dataQuality.issues" :key="index">{{ issue }}</li>
          </ul>
        </div>
      </div>

      <!-- 列统计信息 -->
      <div class="workspace-card" v-if="columnStats.length > 0">
        <h2>📊 列统计信息</h2>
        <div class="stats-container">
          <div v-for="stat in columnStats" :key="stat.name" class="stat-card">
            <div class="stat-header">
              <span class="stat-name">{{ stat.name }}</span>
              <span class="stat-type" :class="'type-' + stat.type">{{ getTypeLabel(stat.type) }}</span>
            </div>
            <div class="stat-details">
              <div class="stat-detail">
                <span>空值:</span>
                <span>{{ stat.nullCount }}</span>
              </div>
              <div class="stat-detail">
                <span>唯一值:</span>
                <span>{{ stat.uniqueCount }}</span>
              </div>
              <div v-if="stat.stats" class="stat-numbers">
                <div v-if="stat.stats.min !== undefined" class="stat-number">
                  <span class="number-label">最小值:</span>
                  <span class="number-value">{{ formatNumber(stat.stats.min) }}</span>
                </div>
                <div v-if="stat.stats.max !== undefined" class="stat-number">
                  <span class="number-label">最大值:</span>
                  <span class="number-value">{{ formatNumber(stat.stats.max) }}</span>
                </div>
                <div v-if="stat.stats.avg !== undefined" class="stat-number">
                  <span class="number-label">平均值:</span>
                  <span class="number-value">{{ formatNumber(stat.stats.avg) }}</span>
                </div>
                <div v-if="stat.stats.sum !== undefined" class="stat-number">
                  <span class="number-label">总和:</span>
                  <span class="number-value">{{ formatNumber(stat.stats.sum) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据可视化 -->
      <div class="workspace-card" v-if="uploadedData">
        <h2>📈 数据可视化</h2>
        <div class="chart-controls">
          <div class="chart-selector">
            <label>X 轴:</label>
            <select v-model="selectedXColumn" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="chart-selector">
            <label>Y 轴:</label>
            <select v-model="selectedYColumn" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="chart-selector">
            <label>图表类型:</label>
            <select v-model="chartType" class="chart-select">
              <option value="line">折线图</option>
              <option value="bar">柱状图</option>
            </select>
          </div>
        </div>
        <div v-if="selectedXColumn && selectedYColumn" class="chart-container">
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
        <div v-else class="chart-placeholder">
          <p>请选择 X 轴和 Y 轴列来生成图表</p>
        </div>
      </div>

      <!-- 分组统计 -->
      <div class="workspace-card" v-if="uploadedData">
        <h2>📊 分组统计</h2>
        <div class="group-controls">
          <div class="group-selector">
            <label>分组列:</label>
            <select v-model="groupByColumn" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="group-selector">
            <label>统计列:</label>
            <select v-model="groupValueColumn" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="group-selector">
            <label>操作:</label>
            <select v-model="groupOperation" class="chart-select">
              <option value="sum">求和</option>
              <option value="avg">平均值</option>
              <option value="count">计数</option>
              <option value="max">最大值</option>
              <option value="min">最小值</option>
            </select>
          </div>
        </div>
        <div v-if="groupByColumn && groupValueColumn && groupData.length > 0" class="group-results">
          <div class="group-chart">
            <VueUiDonut
              :config="donutChartConfig"
              :dataset="groupData"
            />
          </div>
          <div class="group-table">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>{{ groupByColumn }}</th>
                  <th>{{ groupOperation === 'sum' ? '总和' : groupOperation === 'avg' ? '平均值' : groupOperation === 'count' ? '数量' : groupOperation === 'max' ? '最大值' : '最小值' }}</th>
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
        </div>
        <div v-else class="chart-placeholder">
          <p>请选择分组列和统计列来查看分组统计</p>
        </div>
      </div>

      <!-- 数据筛选和搜索 -->
      <div class="workspace-card" v-if="uploadedData">
        <h2>🔍 数据筛选和搜索</h2>
        <div class="filter-section">
          <div class="search-box">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="搜索数据..."
              class="search-input"
              @input="applyFilters"
            />
            <span class="search-icon">🔎</span>
          </div>
          <div class="filter-controls">
            <button @click="showFilterDialog = true" class="btn btn-filter">
              ➕ 添加筛选条件
            </button>
            <button v-if="activeFilters.length > 0" @click="clearFilters" class="btn btn-clear">
              🗑️ 清除筛选 ({{ activeFilters.length }})
            </button>
          </div>
          <div v-if="activeFilters.length > 0" class="active-filters">
            <div v-for="(filter, index) in activeFilters" :key="index" class="filter-tag">
              <span>{{ filter.column }} {{ getOperatorLabel(filter.operator) }} {{ filter.value }}</span>
              <button @click="removeFilter(index)" class="filter-remove">×</button>
            </div>
          </div>
          <div class="filter-info">
            <p>显示 {{ filteredRows.length }} / {{ rawRows.length }} 行数据</p>
          </div>
        </div>
      </div>

      <!-- 筛选对话框 -->
      <div v-if="showFilterDialog" class="modal-overlay" @click="showFilterDialog = false">
        <div class="modal-content" @click.stop>
          <h3>添加筛选条件</h3>
          <div class="filter-form">
            <div class="form-group">
              <label>列名</label>
              <select v-model="newFilter.column" class="form-input">
                <option value="">选择列...</option>
                <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>操作符</label>
              <select v-model="newFilter.operator" class="form-input">
                <option value="equals">等于</option>
                <option value="contains">包含</option>
                <option value="greater">大于</option>
                <option value="less">小于</option>
                <option value="notNull">非空</option>
              </select>
            </div>
            <div class="form-group" v-if="newFilter.operator !== 'notNull'">
              <label>值</label>
              <input v-model="newFilter.value" type="text" class="form-input" placeholder="输入筛选值" />
            </div>
            <div class="modal-actions">
              <button @click="addFilter" class="btn btn-primary">添加</button>
              <button @click="showFilterDialog = false" class="btn btn-secondary">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据转换工具 -->
      <div class="workspace-card" v-if="uploadedData">
        <h2>🔧 数据转换工具</h2>
        <div class="transform-section">
          <div class="transform-item">
            <h4>列类型转换</h4>
            <div class="transform-controls">
              <select v-model="transformColumn" class="form-input">
                <option value="">选择列...</option>
                <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
              </select>
              <select v-model="transformTargetType" class="form-input">
                <option value="number">转换为数字</option>
                <option value="string">转换为文本</option>
                <option value="date">转换为日期</option>
              </select>
              <button @click="applyTransform" class="btn btn-primary" :disabled="!transformColumn">
                应用转换
              </button>
            </div>
          </div>
          <div class="transform-item">
            <h4>填充缺失值</h4>
            <div class="transform-controls">
              <select v-model="fillColumn" class="form-input">
                <option value="">选择列...</option>
                <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
              </select>
              <select v-model="fillStrategy" class="form-input">
                <option value="mean">平均值</option>
                <option value="median">中位数</option>
                <option value="mode">众数</option>
                <option value="zero">零值</option>
                <option value="forward">前向填充</option>
                <option value="backward">后向填充</option>
              </select>
              <button @click="applyFill" class="btn btn-primary" :disabled="!fillColumn">
                填充缺失值
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 高级可视化 -->
      <div class="workspace-card" v-if="uploadedData && numericColumns.length >= 2">
        <h2>📊 高级可视化</h2>
        <div class="advanced-viz-controls">
          <div class="viz-selector">
            <label>X 轴 (数值):</label>
            <select v-model="scatterXColumn" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="viz-selector">
            <label>Y 轴 (数值):</label>
            <select v-model="scatterYColumn" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="viz-selector">
            <label>颜色分组 (可选):</label>
            <select v-model="scatterColorColumn" class="chart-select">
              <option value="">无分组</option>
              <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
        </div>
        <div v-if="scatterXColumn && scatterYColumn && scatterData.length > 0" class="scatter-container">
          <VueUiXy
            :config="scatterChartConfig"
            :dataset="scatterData"
          />
          <div class="correlation-info" v-if="correlation !== null">
            <p>相关系数: <strong>{{ correlation.toFixed(3) }}</strong></p>
            <p class="correlation-desc">{{ getCorrelationDesc(correlation) }}</p>
          </div>
        </div>
        <div v-else class="chart-placeholder">
          <p>选择两个数值列来生成散点图（相关性分析）</p>
        </div>
      </div>

      <!-- 数据透视表 -->
      <div class="workspace-card" v-if="uploadedData">
        <h2>📑 数据透视表</h2>
        <div class="pivot-controls">
          <div class="pivot-selector">
            <label>行维度:</label>
            <select v-model="pivotRow" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="pivot-selector">
            <label>列维度:</label>
            <select v-model="pivotCol" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in availableColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="pivot-selector">
            <label>值字段:</label>
            <select v-model="pivotValue" class="chart-select">
              <option value="">选择列...</option>
              <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="pivot-selector">
            <label>聚合方式:</label>
            <select v-model="pivotAggregation" class="chart-select">
              <option value="sum">求和</option>
              <option value="avg">平均值</option>
              <option value="count">计数</option>
              <option value="max">最大值</option>
              <option value="min">最小值</option>
            </select>
          </div>
        </div>
        <div v-if="pivotTable.length > 0" class="pivot-table-container">
          <table class="pivot-table">
            <thead>
              <tr>
                <th>{{ pivotRow || '行' }}</th>
                <th v-for="col in pivotColumns" :key="col">{{ col }}</th>
                <th>总计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in pivotTable" :key="rowIndex">
                <td class="pivot-row-header">{{ row.rowLabel }}</td>
                <td v-for="col in pivotColumns" :key="col" class="pivot-cell">
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
        </div>
        <div v-else class="chart-placeholder">
          <p>选择行维度、列维度和值字段来创建数据透视表</p>
        </div>
      </div>

      <!-- 数据导出 -->
      <div class="workspace-card" v-if="uploadedData">
        <h2>💾 数据导出</h2>
        <div class="export-section">
          <div class="export-options">
            <button @click="exportData('csv')" class="btn btn-export">
              📄 导出为 CSV
            </button>
            <button @click="exportData('json')" class="btn btn-export">
              📋 导出为 JSON
            </button>
            <button @click="exportData('excel')" class="btn btn-export">
              📊 导出为 Excel (建议)
            </button>
            <button @click="exportChart" class="btn btn-export" :disabled="!selectedXColumn || !selectedYColumn">
              🖼️ 导出当前图表
            </button>
          </div>
          <div class="export-info">
            <p v-if="activeFilters.length > 0 || searchTerm">
              ⚠️ 将导出筛选后的数据 ({{ filteredRows.length }} 行)
            </p>
            <p v-else>
              📊 将导出全部数据 ({{ rawRows.length }} 行)
            </p>
          </div>
        </div>
      </div>

      <!-- 数据预览 -->
      <div class="workspace-card">
        <h2>📋 数据预览</h2>
        <div class="data-preview">
          <VueUiTable
            v-if="displayTableData"
            :config="tableConfig"
            :dataset="displayTableData"
          />
        </div>
        <div class="data-info">
          <p>显示 {{ filteredRows.length }} / {{ rawRows.length }} 行数据 | 总列数: {{ uploadedData.columnCount }}</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="currentWorkspace" class="action-buttons">
      <button @click="resetWorkspace" class="btn btn-secondary">
        🔄 创建新工作区
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { uploadFileToBigQuery, createWorkspace as createWorkspaceAPI } from '../services/api'
import {
  calculateColumnStats,
  checkDataQuality,
  prepareChartData,
  groupBy,
  filterData,
  searchData,
  exportToCSV,
  exportToJSON,
  convertColumnType,
  fillMissingValues,
  type ColumnStats,
  type DataQuality
} from '../utils/dataAnalysis'

// 工作区状态
const currentWorkspace = ref<any>(null)
const workspaceName = ref('')
const workspaceDescription = ref('')

// 文件上传状态
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const isProcessing = ref(false)
const isLoading = ref(false)

// 数据状态
const uploadedData = ref<any>(null)
const bigQueryDetails = ref<any>(null)
const tableData = ref<any>(null)
const rawRows = ref<any[][]>([])
const rawColumns = ref<string[]>([])

// 数据分析状态
const dataQuality = ref<DataQuality | null>(null)
const columnStats = ref<ColumnStats[]>([])
const selectedXColumn = ref('')
const selectedYColumn = ref('')
const chartType = ref<'line' | 'bar'>('line')
const groupByColumn = ref('')
const groupValueColumn = ref('')
const groupOperation = ref<'sum' | 'avg' | 'count' | 'max' | 'min'>('sum')

// 筛选和搜索状态
const searchTerm = ref('')
const activeFilters = ref<{ column: string, operator: string, value: any }[]>([])
const showFilterDialog = ref(false)
const newFilter = ref({ column: '', operator: 'equals', value: '' })
const filteredRows = ref<any[][]>([])

// 数据转换状态
const transformColumn = ref('')
const transformTargetType = ref<'number' | 'string' | 'date'>('number')
const fillColumn = ref('')
const fillStrategy = ref<'mean' | 'median' | 'mode' | 'zero' | 'forward' | 'backward'>('mean')

// 高级可视化状态
const scatterXColumn = ref('')
const scatterYColumn = ref('')
const scatterColorColumn = ref('')

// 数据透视表状态
const pivotRow = ref('')
const pivotCol = ref('')
const pivotValue = ref('')
const pivotAggregation = ref<'sum' | 'avg' | 'count' | 'max' | 'min'>('sum')

// 表格配置
const tableConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    th: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    td: {
      fontSize: '14px',
      color: '#1f2937'
    },
    table: {
      th: {
        backgroundColor: '#f9fafb',
        color: '#374151',
        borderColor: '#e5e7eb'
      },
      td: {
        backgroundColor: '#ffffff',
        color: '#1f2937',
        borderColor: '#e5e7eb'
      }
    }
  },
  responsiveBreakpoint: 768,
  userOptions: {
    show: true,
    buttons: {
      pdf: true,
      csv: true,
      img: true,
      fullscreen: true
    }
  }
})

// 创建工作区
const createWorkspace = async () => {
  isLoading.value = true
  try {
    const response = await createWorkspaceAPI({
      name: workspaceName.value,
      description: workspaceDescription.value
    })
    currentWorkspace.value = response.workspace
    console.log('工作区创建成功:', response.workspace)
  } catch (error: any) {
    console.error('创建工作区失败:', error)
    alert('创建工作区失败: ' + (error.message || '未知错误'))
  } finally {
    isLoading.value = false
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
  }
}

// 处理拖拽
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    selectedFile.value = file
  } else {
    alert('请上传 CSV 或 Excel 文件')
  }
}

// 上传文件
const uploadFile = async () => {
  if (!selectedFile.value || !currentWorkspace.value) return

  isUploading.value = true
  isProcessing.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('workspaceId', currentWorkspace.value.id)

    const response = await uploadFileToBigQuery(formData)
    
    uploadedData.value = response.data
    bigQueryDetails.value = response.bigQueryDetails
    
    // 准备表格数据
    if (response.data && response.data.rows) {
      const rows = response.data.rows
      const columns = response.data.columns || []
      
      // 保存原始数据
      rawRows.value = rows
      rawColumns.value = columns
      
      tableData.value = {
        head: columns.map((col: string, index: number) => ({
          name: col || `column_${index}`,
          label: col || `列 ${index + 1}`
        })),
        body: rows.map((row: any[]) => {
          const rowObj: any = {}
          columns.forEach((col: string, colIndex: number) => {
            rowObj[col || `column_${colIndex}`] = row[colIndex] ?? ''
          })
          return rowObj
        })
      }
      
      // 执行数据分析
      analyzeData(rows, columns)
      
      // 初始化筛选数据
      filteredRows.value = rows
    }

    console.log('文件上传成功:', response)
  } catch (error: any) {
    console.error('文件上传失败:', error)
    alert('文件上传失败: ' + (error.message || '未知错误'))
  } finally {
    isUploading.value = false
    isProcessing.value = false
  }
}

// 重置工作区
const resetWorkspace = () => {
  currentWorkspace.value = null
  workspaceName.value = ''
  workspaceDescription.value = ''
  selectedFile.value = null
  uploadedData.value = null
  bigQueryDetails.value = null
  tableData.value = null
  rawRows.value = []
  rawColumns.value = []
  dataQuality.value = null
  columnStats.value = []
  selectedXColumn.value = ''
  selectedYColumn.value = ''
  groupByColumn.value = ''
  groupValueColumn.value = ''
  searchTerm.value = ''
  activeFilters.value = []
  filteredRows.value = []
  transformColumn.value = ''
  fillColumn.value = ''
  scatterXColumn.value = ''
  scatterYColumn.value = ''
  scatterColorColumn.value = ''
  pivotRow.value = ''
  pivotCol.value = ''
  pivotValue.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 执行数据分析
const analyzeData = (rows: any[][], columns: string[]) => {
  // 数据质量检查
  dataQuality.value = checkDataQuality(rows, columns)
  
  // 列统计
  columnStats.value = columns.map((col, index) => 
    calculateColumnStats(col, index, rows)
  )
  
  // 自动选择第一个数值列作为 Y 轴
  const firstNumericColumn = columnStats.value.find(s => s.type === 'number')
  if (firstNumericColumn && !selectedYColumn.value) {
    selectedYColumn.value = firstNumericColumn.name
  }
  
  // 自动选择第一个非数值列作为 X 轴
  const firstStringColumn = columnStats.value.find(s => s.type === 'string')
  if (firstStringColumn && !selectedXColumn.value) {
    selectedXColumn.value = firstStringColumn.name
  }
}

// 可用列
const availableColumns = computed(() => rawColumns.value)

// 数值列
const numericColumns = computed(() => 
  columnStats.value
    .filter(s => s.type === 'number')
    .map(s => s.name)
)

// 图表数据
const preparedChartData = computed(() => {
  const rowsToUse = filteredRows.value.length > 0 ? filteredRows.value : rawRows.value
  if (!selectedXColumn.value || !selectedYColumn.value || rowsToUse.length === 0) {
    return []
  }
  return prepareChartData(rowsToUse, rawColumns.value, selectedXColumn.value, selectedYColumn.value)
})

// 分组数据
const groupData = computed(() => {
  const rowsToUse = filteredRows.value.length > 0 ? filteredRows.value : rawRows.value
  if (!groupByColumn.value || !groupValueColumn.value || rowsToUse.length === 0) {
    return []
  }
  return groupBy(rowsToUse, rawColumns.value, groupByColumn.value, groupValueColumn.value, groupOperation.value)
})

// 图表配置
const lineChartConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: {
      backgroundColor: '#ffffff',
      color: '#1f2937'
    },
    grid: {
      stroke: '#e5e7eb',
      strokeWidth: 1
    },
    line: {
      stroke: '#3b82f6',
      strokeWidth: 3
    }
  },
  userOptions: {
    show: true
  }
})

const barChartConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: {
      backgroundColor: '#ffffff',
      color: '#1f2937'
    },
    bars: {
      borderRadius: 4,
      stroke: '#3b82f6',
      strokeWidth: 1
    }
  },
  userOptions: {
    show: true
  }
})

const donutChartConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: {
      backgroundColor: '#ffffff',
      color: '#1f2937'
    }
  },
  userOptions: {
    show: true
  }
})

// 工具函数
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    number: '数字',
    string: '文本',
    date: '日期',
    boolean: '布尔'
  }
  return labels[type] || type
}

const getQualityClass = (completeness: number) => {
  if (completeness >= 90) return 'quality-excellent'
  if (completeness >= 70) return 'quality-good'
  return 'quality-poor'
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toFixed(2)
}

// 筛选和搜索功能
const applyFilters = () => {
  let result = rawRows.value
  
  // 应用搜索
  if (searchTerm.value) {
    result = searchData(result, rawColumns.value, searchTerm.value)
  }
  
  // 应用筛选条件
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

const removeFilter = (index: number) => {
  activeFilters.value.splice(index, 1)
  applyFilters()
}

const clearFilters = () => {
  activeFilters.value = []
  searchTerm.value = ''
  applyFilters()
}

const getOperatorLabel = (operator: string) => {
  const labels: Record<string, string> = {
    equals: '等于',
    contains: '包含',
    greater: '大于',
    less: '小于',
    notNull: '非空'
  }
  return labels[operator] || operator
}

// 更新显示表格
const updateDisplayTable = () => {
  if (!rawColumns.value.length || !filteredRows.value.length) {
    tableData.value = null
    return
  }
  
  tableData.value = {
    head: rawColumns.value.map((col: string, index: number) => ({
      name: col || `column_${index}`,
      label: col || `列 ${index + 1}`
    })),
    body: filteredRows.value.map((row: any[]) => {
      const rowObj: any = {}
      rawColumns.value.forEach((col: string, colIndex: number) => {
        rowObj[col || `column_${colIndex}`] = row[colIndex] ?? ''
      })
      return rowObj
    })
  }
}

// 显示表格数据
const displayTableData = computed(() => {
  if (!tableData.value) return null
  return tableData.value
})

// 数据转换功能
const applyTransform = () => {
  if (!transformColumn.value) return
  
  const columnIndex = rawColumns.value.indexOf(transformColumn.value)
  if (columnIndex === -1) return
  
  rawRows.value = convertColumnType(rawRows.value, columnIndex, transformTargetType.value)
  filteredRows.value = convertColumnType(filteredRows.value, columnIndex, transformTargetType.value)
  
  // 重新分析数据
  analyzeData(rawRows.value, rawColumns.value)
  updateDisplayTable()
  
  alert('列类型转换完成！')
}

const applyFill = () => {
  if (!fillColumn.value) return
  
  const columnIndex = rawColumns.value.indexOf(fillColumn.value)
  if (columnIndex === -1) return
  
  rawRows.value = fillMissingValues(rawRows.value, columnIndex, fillStrategy.value)
  filteredRows.value = fillMissingValues(filteredRows.value, columnIndex, fillStrategy.value)
  
  // 重新分析数据
  analyzeData(rawRows.value, rawColumns.value)
  updateDisplayTable()
  
  alert('缺失值填充完成！')
}

// 散点图数据
const scatterData = computed(() => {
  const rowsToUse = filteredRows.value.length > 0 ? filteredRows.value : rawRows.value
  if (!scatterXColumn.value || !scatterYColumn.value || rowsToUse.length === 0) {
    return []
  }
  
  const xIndex = rawColumns.value.indexOf(scatterXColumn.value)
  const yIndex = rawColumns.value.indexOf(scatterYColumn.value)
  
  if (xIndex === -1 || yIndex === -1) return []
  
  return rowsToUse
    .filter(row => row[xIndex] && row[yIndex])
    .map(row => ({
      x: Number(row[xIndex]) || 0,
      y: Number(row[yIndex]) || 0
    }))
    .filter(item => !isNaN(item.x) && !isNaN(item.y))
})

// 相关系数计算
const correlation = computed(() => {
  if (scatterData.value.length < 2) return null
  
  const data = scatterData.value
  const n = data.length
  const sumX = data.reduce((sum, d) => sum + d.x, 0)
  const sumY = data.reduce((sum, d) => sum + d.y, 0)
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0)
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0)
  const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  if (denominator === 0) return null
  
  return numerator / denominator
})

const getCorrelationDesc = (corr: number) => {
  const abs = Math.abs(corr)
  if (abs >= 0.9) return '极强相关'
  if (abs >= 0.7) return '强相关'
  if (abs >= 0.5) return '中等相关'
  if (abs >= 0.3) return '弱相关'
  return '几乎不相关'
}

const scatterChartConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: {
      backgroundColor: '#ffffff',
      color: '#1f2937'
    },
    grid: {
      stroke: '#e5e7eb',
      strokeWidth: 1
    },
    plot: {
      stroke: '#3b82f6',
      strokeWidth: 3,
      radius: 4
    }
  },
  userOptions: {
    show: true
  }
})

// 数据透视表
const pivotTable = computed(() => {
  const rowsToUse = filteredRows.value.length > 0 ? filteredRows.value : rawRows.value
  if (!pivotRow.value || !pivotValue.value || rowsToUse.length === 0) {
    return []
  }
  
  const rowIndex = rawColumns.value.indexOf(pivotRow.value)
  const valueIndex = rawColumns.value.indexOf(pivotValue.value)
  const colIndex = pivotCol.value ? rawColumns.value.indexOf(pivotCol.value) : -1
  
  if (rowIndex === -1 || valueIndex === -1) return []
  
  const pivot: Record<string, Record<string, number[]>> = {}
  const rowLabels = new Set<string>()
  const colLabels = new Set<string>()
  
  rowsToUse.forEach(row => {
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
  
  const result = Array.from(rowLabels).map(rowLabel => {
    const values: Record<string, number> = {}
    let total = 0
    
    Array.from(colLabels).forEach(colLabel => {
      const nums = pivot[rowLabel]?.[colLabel] || []
      let value = 0
      
      switch (pivotAggregation.value) {
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
  
  return result
})

const pivotColumns = computed(() => {
  if (!pivotCol.value) return ['总计']
  
  const colIndex = rawColumns.value.indexOf(pivotCol.value)
  if (colIndex === -1) return ['总计']
  
  const rowsToUse = filteredRows.value.length > 0 ? filteredRows.value : rawRows.value
  const cols = new Set<string>()
  rowsToUse.forEach(row => {
    cols.add(String(row[colIndex] || '未知'))
  })
  return Array.from(cols).sort()
})

const pivotColumnTotals = computed(() => {
  const totals: Record<string, number> = {}
  pivotColumns.value.forEach(col => {
    totals[col] = pivotTable.value.reduce((sum, row) => sum + (row.values[col] || 0), 0)
  })
  return totals
})

const pivotGrandTotal = computed(() => {
  return pivotTable.value.reduce((sum, row) => sum + row.total, 0)
})

// 数据导出功能
const exportData = (format: 'csv' | 'json' | 'excel') => {
  const rowsToExport = filteredRows.value.length > 0 ? filteredRows.value : rawRows.value
  const filename = `${workspaceName.value || 'data'}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : format}`
  
  if (format === 'csv' || format === 'excel') {
    exportToCSV(rowsToExport, rawColumns.value, filename)
  } else if (format === 'json') {
    exportToJSON(rowsToExport, rawColumns.value, filename)
  }
}

const exportChart = () => {
  if (!selectedXColumn.value || !selectedYColumn.value) return
  
  // 这里可以添加图表导出功能
  alert('图表导出功能开发中...')
}

// 监听筛选变化
watch([searchTerm, activeFilters], () => {
  applyFilters()
}, { deep: true })
</script>

<style scoped>
.workspace-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.workspace-header {
  margin-bottom: 24px;
}

.workspace-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.workspace-header p {
  color: #6b7280;
  font-size: 1rem;
}

.workspace-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.workspace-card h2 {
  color: #1f2937;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 600;
}

.workspace-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.upload-area {
  border: 3px dashed #cbd5e1;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8fafc;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
}

.file-input {
  display: none;
}

.upload-content {
  pointer-events: none;
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 15px;
}

.upload-link {
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  pointer-events: all;
}

.upload-hint {
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 10px;
}

.selected-file {
  margin-top: 20px;
  padding: 15px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.btn-upload {
  background: #10b981;
  color: white;
}

.btn-upload:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.btn-link {
  background: #667eea;
  color: white;
  text-decoration: none;
  display: inline-block;
}

.btn-link:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-item label {
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
}

.info-item span {
  color: #1f2937;
  font-size: 16px;
  font-weight: 500;
}

.query-link {
  margin-top: 20px;
  text-align: center;
}

.data-preview {
  margin-bottom: 20px;
  overflow-x: auto;
}

.data-info {
  text-align: center;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 500;
}

.action-buttons {
  text-align: center;
  margin-top: 20px;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.quality-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.quality-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
}

.quality-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.quality-value.quality-excellent {
  color: #10b981;
}

.quality-value.quality-good {
  color: #f59e0b;
}

.quality-value.quality-poor {
  color: #ef4444;
}

.quality-issues {
  margin-top: 20px;
  padding: 16px;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.issues-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.issues-list {
  margin: 0;
  padding-left: 20px;
  color: #78350f;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.stat-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.stat-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-type.type-number {
  background: #dbeafe;
  color: #1e40af;
}

.stat-type.type-string {
  background: #f3e8ff;
  color: #7c3aed;
}

.stat-type.type-date {
  background: #fef3c7;
  color: #92400e;
}

.stat-type.type-boolean {
  background: #d1fae5;
  color: #065f46;
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-detail {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
}

.stat-numbers {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-number {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.number-label {
  font-size: 11px;
  color: #9ca3af;
}

.number-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.chart-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: end;
}

.chart-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.chart-selector label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.chart-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.chart-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.chart-container {
  margin-top: 20px;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.chart-placeholder {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

.group-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: end;
}

.group-results {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.group-chart {
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.group-table {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stats-table thead {
  background: #f3f4f6;
}

.stats-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  border-bottom: 2px solid #e5e7eb;
}

.stats-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 14px;
}

.stats-table tbody tr:hover {
  background: #f9fafb;
}

@media (max-width: 768px) {
  .group-results {
    grid-template-columns: 1fr;
  }
  
  .chart-controls,
  .group-controls {
    flex-direction: column;
  }
  
  .chart-selector,
  .group-selector {
    width: 100%;
  }
}

.sample-files {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.sample-files-title {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 12px;
  font-size: 14px;
}

.sample-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sample-file-link {
  display: inline-block;
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  color: #1e40af;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.sample-file-link:hover {
  background: #dbeafe;
  border-color: #60a5fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);
}

@media (max-width: 768px) {
  .workspace-header h1 {
    font-size: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .selected-file {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
}

/* 筛选和搜索样式 */
.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
}

.filter-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-filter {
  background: #3b82f6;
  color: white;
}

.btn-clear {
  background: #ef4444;
  color: white;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  font-size: 13px;
  color: #1e40af;
}

.filter-remove {
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-remove:hover {
  color: #ef4444;
}

.filter-info {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
}

/* 数据转换样式 */
.transform-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.transform-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.transform-item h4 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.transform-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: end;
}

.transform-controls .form-input {
  flex: 1;
  min-width: 150px;
}

/* 高级可视化样式 */
.advanced-viz-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.viz-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.viz-selector label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.scatter-container {
  margin-top: 20px;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.correlation-info {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

.correlation-info p {
  margin: 4px 0;
  color: #1e40af;
  font-size: 14px;
}

.correlation-desc {
  font-size: 12px !important;
  color: #6b7280 !important;
}

/* 数据透视表样式 */
.pivot-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pivot-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.pivot-selector label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.pivot-table-container {
  margin-top: 20px;
  overflow-x: auto;
}

.pivot-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  font-size: 13px;
}

.pivot-table thead {
  background: #f3f4f6;
}

.pivot-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.pivot-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.pivot-row-header {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.pivot-cell {
  text-align: right;
}

.pivot-total {
  background: #eff6ff;
  font-weight: 600;
  text-align: right;
  color: #1e40af;
}

.pivot-footer {
  background: #f3f4f6;
}

.pivot-grand-total {
  background: #dbeafe;
  font-weight: 700;
  text-align: right;
  color: #1e3a8a;
}

/* 导出样式 */
.export-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-export {
  background: #10b981;
  color: white;
  padding: 10px 20px;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-info {
  padding: 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border-left: 4px solid #10b981;
  font-size: 13px;
  color: #166534;
}
</style>
