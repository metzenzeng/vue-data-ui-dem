<template>
  <div class="chart-page-container">
    <h2 class="chart-title">系统监控仪表盘</h2>
    <div class="chart-card">
      <VueUiGauge :data="[cpuData, memoryData, diskData]" class="chart-demo" />
      <div class="gauge-labels">
        <span>CPU: {{ cpuData.value }}%</span>
        <span>内存: {{ memoryData.value }}%</span>
        <span>磁盘: {{ diskData.value }}%</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { VueUiGauge } from 'vue-data-ui'
const cpuData = ref({ value: 65, min: 0, max: 100, label: 'CPU使用率', color: '#3b82f6' })
const memoryData = ref({ value: 45, min: 0, max: 100, label: '内存使用率', color: '#10b981' })
const diskData = ref({ value: 75, min: 0, max: 100, label: '磁盘使用率', color: '#f59e0b' })
</script>
<style scoped>
.chart-page-container { max-width: 900px; margin: 0 auto; padding: 40px 16px; }
.chart-title { font-size: 2rem; font-weight: 700; margin-bottom: 32px; text-align: center; }
.chart-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 32px 0 rgba(60,60,60,0.10); padding: 32px 24px; }
.chart-demo { width: 100%; min-height: 400px; }
.gauge-labels { display: flex; justify-content: space-around; margin-top: 1.5rem; color: #374151; font-size: 1rem; font-weight: 600; }
</style>
