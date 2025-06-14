<template>
  <div class="visualization-container">
    <h2>数据可视化示例</h2>

    <!-- 折线图 -->
    <div class="chart-section">
      <h3>销售趋势</h3>
      <VueUiXy
        :config="lineConfig"
        :dataset="lineData"
      />
    </div>

    <!-- 饼图 -->
    <div class="chart-section">
      <h3>市场份额</h3>
      <VueUiDonut
        :config="donutConfig"
        :dataset="donutData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 折线图数据
const lineData = ref([
  { x: '1月', y: 120 },
  { x: '2月', y: 190 },
  { x: '3月', y: 300 },
  { x: '4月', y: 500 },
  { x: '5月', y: 200 },
  { x: '6月', y: 300 }
])

const lineConfig = ref({
  style: {
    fontFamily: 'Arial, sans-serif',
    chart: {
      backgroundColor: '#FFFFFF',
      color: '#2d353c'
    }
  }
})

// 饼图数据
const donutData = ref([
  { name: 'A产品', value: 45, color: '#ff6b6b' },
  { name: 'B产品', value: 25, color: '#4ecdc4' },
  { name: 'C产品', value: 30, color: '#45b7d1' }
])

const donutConfig = ref({
  style: {
    fontFamily: 'Arial, sans-serif',
    chart: {
      backgroundColor: '#FFFFFF',
      color: '#2d353c'
    }
  }
})
</script>

<style scoped>
.visualization-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.chart-section {
  margin-bottom: 40px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

h2, h3 {
  color: #2d353c;
  margin-bottom: 20px;
}
</style>
