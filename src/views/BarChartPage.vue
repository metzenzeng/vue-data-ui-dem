<template>
  <div class="chart-page-container">
    <h2 class="chart-title">团队绩效对比（柱状图）</h2>
    <div class="chart-card">
      <VueUiVerticalBar :config="barConfig" :dataset="barData" class="chart-demo" />
      <div class="chart-info">平均值: {{ barAverage.toFixed(0) }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueUiVerticalBar } from 'vue-data-ui'
const barData = ref([
  { name: '一月', value: 65, color: '#3b82f6' },
  { name: '二月', value: 59, color: '#10b981' },
  { name: '三月', value: 80, color: '#f59e0b' },
  { name: '四月', value: 81, color: '#ef4444' },
  { name: '五月', value: 56, color: '#6366f1' },
  { name: '六月', value: 55, color: '#8b5cf6' }
])
const barConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: { backgroundColor: '#ffffff', color: '#1f2937' },
    bars: { borderRadius: 4, stroke: '#3b82f6', strokeWidth: 1 }
  },
  userOptions: { show: true }
})
const barAverage = computed(() => {
  if (!barData.value || barData.value.length === 0) return 0
  const total = barData.value.reduce((sum, item) => sum + (item.value || 0), 0)
  return total / barData.value.length
})
</script>
<style scoped>
.chart-page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 80px 24px;
  background: #f8fafc;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chart-title {
  font-size: 3.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 48px;
  text-align: center;
  display: block;
}
.chart-card {
  width: 1000px;
  height: 1000px;
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 8px 48px 0 rgba(60,60,60,0.12);
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.chart-demo {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}
.chart-info {
  margin-top: 1.5rem;
  color: #64748b;
  font-size: 1.5rem;
  text-align: center;
}
@media (max-width: 1100px) {
  .chart-card {
    width: 100vw;
    max-width: 100vw;
    height: 60vw;
    max-height: 2000px;
    padding: 16px 4px;
  }
  .chart-title {
    font-size: 2rem;
    margin-bottom: 24px;
  }
}
</style>
