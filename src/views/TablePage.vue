<template>
  <div class="chart-page-container">
    <h2 class="chart-title">用户活动数据表</h2>
    <div class="chart-card">
      <VueUiTable :config="tableConfig" :dataset="tableData" class="chart-demo" />
      <div class="chart-info">
        总用户数: {{ totalUsers }} 人 |
        平均性能: {{ averagePerformance.toFixed(1) }}%
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueUiTable } from 'vue-data-ui'
const tableData = ref({
  head: [
    { name: 'id', label: 'ID' },
    { name: 'name', label: '姓名' },
    { name: 'age', label: '年龄' },
    { name: 'email', label: '邮箱' },
    { name: 'status', label: '状态' },
    { name: 'performance', label: '性能' }
  ],
  body: Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: `用户${i + 1}`,
    age: Math.floor(Math.random() * 30) + 20,
    email: `user${i + 1}@example.com`,
    status: Math.random() > 0.5 ? '活跃' : '离线',
    performance: Math.floor(Math.random() * 40) + 60
  }))
})
const tableConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    th: { backgroundColor: '#f3f4f6', color: '#374151', outline: 'none', fontSize: '14px', fontWeight: 'bold' },
    td: { fontSize: '14px', color: '#1f2937', outline: 'none' },
    table: {
      th: { backgroundColor: '#f9fafb', color: '#374151', borderColor: '#e5e7eb' },
      td: { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#e5e7eb' }
    }
  },
  responsiveBreakpoint: 768,
  colNames: {
    id: 'ID',
    name: '姓名',
    age: '年龄',
    email: '邮箱',
    status: '状态',
    performance: '性能'
  },
  userOptions: {
    show: true,
    buttons: { pdf: true, csv: true, img: true, fullscreen: true }
  }
})
const totalUsers = computed(() => tableData.value?.body?.length || 0)
const averagePerformance = computed(() => {
  if (!tableData.value?.body || tableData.value.body.length === 0) return 0
  const total = tableData.value.body.reduce((sum, row) => sum + (row.performance || 0), 0)
  return total / tableData.value.body.length
})
</script>
<style scoped>
.chart-page-container { max-width: 900px; margin: 0 auto; padding: 40px 16px; }
.chart-title { font-size: 2rem; font-weight: 700; margin-bottom: 32px; text-align: center; }
.chart-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 32px 0 rgba(60,60,60,0.10); padding: 32px 24px; }
.chart-demo { width: 100%; min-height: 400px; }
.chart-info { margin-top: 1.5rem; color: #64748b; font-size: 1rem; text-align: center; }
</style>
