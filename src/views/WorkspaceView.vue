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

      <!-- 数据预览 -->
      <div class="workspace-card">
        <h2>📋 数据预览</h2>
        <div class="data-preview">
          <VueUiTable
            v-if="tableData"
            :config="tableConfig"
            :dataset="tableData"
          />
        </div>
        <div class="data-info">
          <p>总行数: {{ uploadedData.rowCount }} | 总列数: {{ uploadedData.columnCount }}</p>
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

<script setup>
import { ref, computed } from 'vue'
import { uploadFileToBigQuery, createWorkspace as createWorkspaceAPI } from '../services/api'

// 工作区状态
const currentWorkspace = ref(null)
const workspaceName = ref('')
const workspaceDescription = ref('')

// 文件上传状态
const selectedFile = ref(null)
const fileInput = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const isProcessing = ref(false)
const isLoading = ref(false)

// 数据状态
const uploadedData = ref(null)
const bigQueryDetails = ref(null)
const tableData = ref(null)

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
  } catch (error) {
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
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

// 处理拖拽
const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
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
      
      tableData.value = {
        head: columns.map((col, index) => ({
          name: col || `column_${index}`,
          label: col || `列 ${index + 1}`
        })),
        body: rows.map((row, rowIndex) => {
          const rowObj = {}
          columns.forEach((col, colIndex) => {
            rowObj[col || `column_${colIndex}`] = row[colIndex] ?? ''
          })
          return rowObj
        })
      }
    }

    console.log('文件上传成功:', response)
  } catch (error) {
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
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.workspace-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.workspace-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.workspace-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.workspace-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.workspace-card {
  background: rgba(255,255,255,0.95);
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.workspace-card h2 {
  color: #1f2937;
  margin-bottom: 20px;
  font-size: 1.5rem;
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
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
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
  border-color: #667eea;
  background: #f0f4ff;
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
  color: #667eea;
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
  background: #f0f4ff;
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
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-upload {
  background: linear-gradient(45deg, #10b981, #047857);
  color: white;
}

.btn-upload:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: linear-gradient(45deg, #6b7280, #4b5563);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
}

.btn-link {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  text-decoration: none;
  display: inline-block;
}

.btn-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
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

@media (max-width: 768px) {
  .workspace-header h1 {
    font-size: 2rem;
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
</style>
