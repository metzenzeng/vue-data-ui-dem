<template>
  <div class="chart-page-container">
    <h2 class="chart-title">产品市场份额（饼图）</h2>
    <div class="chart-card">
      <VueUiDonut :config="donutConfig" :dataset="donutData" class="chart-demo" />
      <div class="chart-info">总计: {{ donutTotal.toFixed(1) }}%</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueUiDonut } from 'vue-data-ui'
const donutData = ref([
  { name: '产品A', value: 35, color: '#3b82f6' },
  { name: '产品B', value: 25, color: '#10b981' },
  { name: '产品C', value: 20, color: '#f59e0b' },
  { name: '产品D', value: 15, color: '#ef4444' }
])
const donutConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: { backgroundColor: '#ffffff', color: '#1f2937' }
  },
  userOptions: { show: true }
})
const donutTotal = computed(() => {
  if (!donutData.value) return 0
  return donutData.value.reduce((sum, item) => sum + (item.value || 0), 0)
})
</script>
<style scoped>
.chart-page-container { max-width: 900px; margin: 0 auto; padding: 40px 16px; }
.chart-title { font-size: 2rem; font-weight: 700; margin-bottom: 32px; text-align: center; }
.chart-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 32px 0 rgba(60,60,60,0.10); padding: 32px 24px; }
.chart-demo { width: 100%; min-height: 400px; }
.chart-info { margin-top: 1.5rem; color: #64748b; font-size: 1rem; text-align: center; }
</style>
