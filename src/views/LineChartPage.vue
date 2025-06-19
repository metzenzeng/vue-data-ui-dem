<template>
  <div class="chart-page-container">
    <h2 class="chart-title">访问趋势（折线图）</h2>
    <div class="chart-card">
      <VueUiXy
        :key="chartKey"
        :data="lineChartData"
        :config="{
          xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
          yAxis: { type: 'value' },
          tooltip: { trigger: 'axis' }
        }"
        class="chart-demo"
      />
      <div class="chart-info">
        总访问量: {{ totalVisits }} 次 |
        平均访问: {{ (totalVisits / 7).toFixed(1) }} 次/天
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueUiXy } from 'vue-data-ui'
const chartKey = ref(0)
const lineChartData = ref([
  { name: '访问量', series: [320, 332, 301, 334, 390, 330, 320] },
  { name: '下载量', series: [220, 182, 191, 234, 290, 330, 310] },
  { name: '注册量', series: [150, 232, 201, 154, 190, 330, 410] }
])
const totalVisits = computed(() => {
  if (!lineChartData.value || !lineChartData.value[0]?.series) return 0
  return lineChartData.value[0].series.reduce((sum, value) => sum + (value || 0), 0)
})
</script>
<style scoped>
.chart-page-container { max-width: 900px; margin: 0 auto; padding: 40px 16px; }
.chart-title { font-size: 2rem; font-weight: 700; margin-bottom: 32px; text-align: center; }
.chart-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 32px 0 rgba(60,60,60,0.10); padding: 32px 24px; }
.chart-demo { width: 100%; min-height: 400px; }
.chart-info { margin-top: 1.5rem; color: #64748b; font-size: 1rem; text-align: center; }
</style>
