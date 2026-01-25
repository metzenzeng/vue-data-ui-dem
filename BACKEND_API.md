# 后端 API 文档

本文档描述了前端需要的后端 API 接口，用于支持 Workspace 管理和 BigQuery 集成功能。

## 基础配置

- **API 基础 URL**: `http://localhost:3000/api` (可通过环境变量 `VITE_API_BASE_URL` 配置)
- **Content-Type**: `application/json` (除文件上传外)

## API 接口

### 1. 创建工作区

**POST** `/api/workspaces`

创建新的工作区。

**请求体:**
```json
{
  "name": "我的工作区",
  "description": "工作区描述（可选）"
}
```

**响应:**
```json
{
  "workspace": {
    "id": "workspace_123",
    "name": "我的工作区",
    "description": "工作区描述",
    "createdAt": "2026-01-25T10:00:00Z"
  }
}
```

### 2. 上传文件并创建 BigQuery 表

**POST** `/api/workspaces/upload`

上传 CSV 或 Excel 文件，自动创建 BigQuery 表。

**请求:**
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: 文件 (CSV 或 Excel)
  - `workspaceId`: 工作区 ID

**响应:**
```json
{
  "data": {
    "rows": [
      ["值1", "值2", "值3"],
      ["值4", "值5", "值6"]
    ],
    "columns": ["列1", "列2", "列3"],
    "rowCount": 2,
    "columnCount": 3
  },
  "bigQueryDetails": {
    "projectId": "your-gcp-project",
    "datasetId": "your_dataset",
    "tableId": "table_123456",
    "rowCount": 2,
    "columnCount": 3,
    "createdAt": "2026-01-25T10:00:00Z",
    "queryUrl": "https://console.cloud.google.com/bigquery?project=your-gcp-project&ws=!1m5!1m4!4m3!1syour-gcp-project!2syour_dataset!3stable_123456"
  }
}
```

### 3. 获取工作区列表（可选）

**GET** `/api/workspaces`

获取所有工作区列表。

**响应:**
```json
{
  "workspaces": [
    {
      "id": "workspace_123",
      "name": "我的工作区",
      "description": "工作区描述",
      "createdAt": "2026-01-25T10:00:00Z"
    }
  ]
}
```

### 4. 获取工作区详情（可选）

**GET** `/api/workspaces/:workspaceId`

获取特定工作区的详情。

**响应:**
```json
{
  "workspace": {
    "id": "workspace_123",
    "name": "我的工作区",
    "description": "工作区描述",
    "createdAt": "2026-01-25T10:00:00Z"
  }
}
```

## 后端实现建议

### 技术栈建议

- **Node.js + Express** 或 **Python + FastAPI/Flask**
- **文件解析**: 
  - CSV: 使用 `csv-parser` (Node.js) 或 `pandas` (Python)
  - Excel: 使用 `xlsx` (Node.js) 或 `openpyxl`/`pandas` (Python)
- **BigQuery 客户端**:
  - Node.js: `@google-cloud/bigquery`
  - Python: `google-cloud-bigquery`

### 实现步骤

1. **文件上传处理**
   - 接收 multipart/form-data
   - 验证文件类型（CSV/Excel）
   - 解析文件内容

2. **数据解析**
   - CSV: 按行解析，第一行作为列名
   - Excel: 读取第一个工作表，第一行作为列名

3. **BigQuery 表创建**
   - 连接到 GCP BigQuery
   - 根据数据自动推断列类型
   - 创建数据集（如果不存在）
   - 创建表并插入数据

4. **返回结果**
   - 返回解析后的数据（用于前端预览）
   - 返回 BigQuery 表详情

### 环境变量

后端需要配置以下环境变量：

```bash
# GCP 配置
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# 或使用其他认证方式
```

### 错误处理

所有接口应返回标准的错误响应：

```json
{
  "error": true,
  "message": "错误描述"
}
```

HTTP 状态码：
- `200`: 成功
- `400`: 请求错误（如文件格式不正确）
- `500`: 服务器错误

## 示例实现

### Node.js + Express 示例

```javascript
const express = require('express');
const multer = require('multer');
const { BigQuery } = require('@google-cloud/bigquery');
const csv = require('csv-parser');
const xlsx = require('xlsx');

const app = express();
const upload = multer({ dest: 'uploads/' });
const bigquery = new BigQuery();

app.post('/api/workspaces', async (req, res) => {
  // 创建工作区逻辑
});

app.post('/api/workspaces/upload', upload.single('file'), async (req, res) => {
  // 文件上传和 BigQuery 创建逻辑
});
```

### Python + FastAPI 示例

```python
from fastapi import FastAPI, UploadFile, File
from google.cloud import bigquery
import pandas as pd

app = FastAPI()
client = bigquery.Client()

@app.post("/api/workspaces")
async def create_workspace():
    # 创建工作区逻辑
    pass

@app.post("/api/workspaces/upload")
async def upload_file(file: UploadFile = File(...), workspace_id: str = Form(...)):
    # 文件上传和 BigQuery 创建逻辑
    pass
```

## 注意事项

1. **文件大小限制**: 建议设置合理的文件大小限制（如 100MB）
2. **安全性**: 
   - 验证文件类型
   - 防止路径遍历攻击
   - 使用服务账号密钥，不要暴露在客户端
3. **性能**: 
   - 大文件考虑异步处理
   - 使用流式处理避免内存溢出
4. **BigQuery 配额**: 注意 GCP BigQuery 的 API 配额限制
