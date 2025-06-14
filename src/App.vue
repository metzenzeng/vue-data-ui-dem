<template>
  <div class="app">
    <header class="app-header">
      <h1>🎯 Vue Data UI 演示应用</h1>
      <p>本地运行的数据可视化示例</p>
    </header>

    <div class="controls">
      <button @click="refreshData" class="btn primary">🔄 刷新数据</button>
      <button @click="toggleTheme" class="btn secondary">🎨 切换主题</button>
      <button @click="exportData" class="btn success">📁 导出数据</button>
    </div>

    <div class="charts-container">
      <!-- 折线图 -->
      <div class="chart-card">
        <h3>📈 月度销售趋势</h3>
        <VueUiXy
          :config="lineChartConfig"
          :dataset="lineChartData"
          :key="chartKey"
        />
        <div class="chart-info">
          数据点: {{ lineChartData.length }} 个
        </div>
      </div>

      <!-- 饼图 -->
      <div class="chart-card">
        <h3>🥧 产品市场份额</h3>
        <VueUiDonut
          :config="donutConfig"
          :dataset="donutData"
          :key="'donut-' + chartKey"
        />
        <div class="chart-info">
          总计: {{ donutTotal.toFixed(1) }}%
        </div>
      </div>

      <!-- 柱状图 -->
      <div class="chart-card">
        <h3>📊 团队绩效对比</h3>
        <VueUiVerticalBar
          :config="barConfig"
          :dataset="barData"
          :key="'bar-' + chartKey"
        />
        <div class="chart-info">
          平均值: {{ barAverage.toFixed(0) }}
        </div>
      </div>

      <!-- 仪表盘 -->
      <div class="chart-card full-width">
        <h3>⚡ 系统监控仪表盘</h3>
        <div class="gauges-container">
          <div class="gauge-item">
            <div class="gauge-wrapper">
              <VueUiGauge
                :config="gaugeConfig"
                :dataset="cpuData"
                :key="'cpu-' + gaugeKey"
                style="width: 180px; height: 180px;"
              />
            </div>
            <span>CPU: {{ cpuData.value.value }}%</span>
          </div>
          <div class="gauge-item">
            <div class="gauge-wrapper">
              <VueUiGauge
                :config="memoryGaugeConfig"
                :dataset="memoryData"
                :key="'memory-' + gaugeKey"
                style="width: 180px; height: 180px;"
              />
            </div>
            <span>内存: {{ memoryData.value.value }}%</span>
          </div>
          <div class="gauge-item">
            <div class="gauge-wrapper">
              <VueUiGauge
                :config="diskGaugeConfig"
                :dataset="diskData"
                :key="'disk-' + gaugeKey"
                style="width: 180px; height: 180px;"
              />
            </div>
            <span>磁盘: {{ diskData.value.value }}%</span>
          </div>
        </div>
      </div>
    </div>

    <footer class="app-footer">
      <p>🚀 本地开发环境 - 端口: {{ currentPort }}</p>
      <p>📊 Powered by Vue Data UI</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 强制重新渲染的key
const chartKey = ref(0)
const gaugeKey = ref(0)

// 当前端口（开发环境通常是5173）
const currentPort = ref(window.location.port || '5173')

// 主题状态
const isDark = ref(false)

// 定时器引用
let autoUpdateInterval = null

// 折线图数据
const lineChartData = ref([
  { name: '1月', series: [320,300] },
  { name: '2月', series: [280, 260] },
  { name: '3月', series: [450, 430] },
  { name: '4月', series: [520, 500] },
  { name: '5月', series: [380, 360] },
  { name: '6月', series: [620, 600] },
  { name: '7月', series: [590, 570] },
  { name: '8月', series: [670, 650] },
  { name: '9月', series: [490, 470] },
  { name: '10月', series: [720, 700] },
  { name: '11月', series: [650, 630] },
  { name: '12月', series: [800, 780] }
])

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
    },
    plot: {
      stroke: '#3b82f6',
      strokeWidth: 2,
      radius: 4
    }
  },
  userOptions: {
    show: true
  }
})

// 饼图数据
const donutData = ref([
  { name: '移动端', value: 42.5, color: '#3b82f6' },
  { name: '桌面端', value: 35.2, color: '#10b981' },
  { name: '平板端', value: 15.8, color: '#f59e0b' },
  { name: '其他', value: 6.5, color: '#ef4444' }
])

const donutConfig = ref({
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

const donutTotal = computed(() => {
  return donutData.value.reduce((sum, item) => sum + item.value, 0)
})

// 柱状图数据
const barData = ref([
  { name: 'Alice', value: 85 },
  { name: 'Bob', value: 92 },
  { name: 'Charlie', value: 78 },
  { name: 'Diana', value: 96 },
  { name: 'Eva', value: 88 },
  { name: 'Frank', value: 91 }
])

const barConfig = ref({
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

const barAverage = computed(() => {
  const total = barData.value.reduce((sum, item) => sum + item.value, 0)
  return total / barData.value.length
})

// 仪表盘数据 - 使用正确的数据格式
const cpuData = ref({ value: 65 })
const memoryData = ref({ value: 78 })
const diskData = ref({ value: 43 })


// 仪表盘配置
const gaugeConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: {
      backgroundColor: '#ffffff',
      color: '#1f2937'
    },
    gauge: {
      track: {
        stroke: '#e5e7eb',
        strokeWidth: 20
      },
      pointer: {
        stroke: '#3b82f6',
        strokeWidth: 4
      }
    },
    title: {
      text: 'CPU',
      color: '#374151',
      fontSize: 14,
      bold: true
    }
  },
  userOptions: {
    show: true
  }
})

const memoryGaugeConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: {
      backgroundColor: '#ffffff',
      color: '#1f2937'
    },
    gauge: {
      track: {
        stroke: '#e5e7eb',
        strokeWidth: 20
      },
      pointer: {
        stroke: '#10b981',
        strokeWidth: 4
      }
    },
    title: {
      text: '内存',
      color: '#374151',
      fontSize: 14,
      bold: true
    }
  },
  userOptions: {
    show: true
  }
})

const diskGaugeConfig = ref({
  style: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    chart: {
      backgroundColor: '#ffffff',
      color: '#1f2937'
    },
    gauge: {
      track: {
        stroke: '#e5e7eb',
        strokeWidth: 20
      },
      pointer: {
        stroke: '#f59e0b',
        strokeWidth: 4
      }
    },
    title: {
      text: '磁盘',
      color: '#374151',
      fontSize: 14,
      bold: true
    }
  },
  userOptions: {
    show: true
  }
})

const updateGaugeData = async () => {
  const newCpuValue = Math.floor(Math.random() * 100)
  const newMemoryValue = Math.floor(Math.random() * 100)
  const newDiskValue = Math.floor(Math.random() * 100)

  cpuData.value = { value: newCpuValue }
  memoryData.value = { value: newMemoryValue }
  diskData.value = { value: newDiskValue }

  // 动态更新配置颜色
  gaugeConfig.value.style.gauge.pointer.stroke =
    newCpuValue > 80 ? '#ef4444' : newCpuValue > 60 ? '#f59e0b' : '#3b82f6'

  memoryGaugeConfig.value.style.gauge.pointer.stroke =
    newMemoryValue > 80 ? '#ef4444' : newMemoryValue > 60 ? '#f59e0b' : '#10b981'

  diskGaugeConfig.value.style.gauge.pointer.stroke =
    newDiskValue > 80 ? '#ef4444' : newDiskValue > 60 ? '#f59e0b' : '#f59e0b'

  // 强制重新渲染仪表盘
  gaugeKey.value++

  // 等待DOM更新
  await nextTick()

  console.log('🔄 仪表盘数据已更新:', {
    CPU: newCpuValue,
    Memory: newMemoryValue,
    Disk: newDiskValue
  })
}

// 方法
const refreshData = async () => {
  // 更新折线图
  lineChartData.value = lineChartData.value.map((item, index) => ({
    ...item,
    y: Math.floor(Math.random() * 500) + 200 + index * 20
  }))

  // 更新饼图
  donutData.value = donutData.value.map(item => ({
    ...item,
    value: Math.random() * 40 + 10
  }))

  // 更新柱状图
  barData.value = barData.value.map(item => ({
    ...item,
    value: Math.floor(Math.random() * 40) + 60
  }))

  // 更新仪表盘
  await updateGaugeData()

  // 强制重新渲染所有图表
  chartKey.value++

  console.log('🔄 所有数据已刷新!')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  console.log('🎨 主题切换:', isDark.value ? '深色' : '浅色')
  // 这里可以实现实际的主题切换逻辑
}

const exportData = () => {
  const allData = {
    timestamp: new Date().toISOString(),
    lineChart: lineChartData.value,
    donut: donutData.value,
    bar: barData.value,
    gauges: {
      cpu: cpuData.value,
      memory: memoryData.value,
      disk: diskData.value
    }
  }

  const blob = new Blob([JSON.stringify(allData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vue-data-ui-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  console.log('📁 数据导出完成!')
}

// 生命周期钩子
onMounted(() => {
  console.log('🚀 应用已挂载')

  // 自动更新仪表盘
  autoUpdateInterval = setInterval(async () => {
    await updateGaugeData()
  }, 3000) // 改为3秒更新一次，避免过于频繁

  console.log('⏰ 自动更新定时器已启动')
})

onUnmounted(() => {
  // 清理定时器
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval)
    console.log('🛑 自动更新定时器已清理')
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.app-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.btn.primary {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
}

.btn.secondary {
  background: linear-gradient(45deg, #10b981, #047857);
}

.btn.success {
  background: linear-gradient(45deg, #f59e0b, #d97706);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 25px;
  max-width: 1400px;
  margin: 0 auto;
}

.chart-card {
  background: rgba(255,255,255,0.95);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  transition: transform 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-5px);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  color: #1f2937;
  margin-bottom: 20px;
  font-size: 1.3rem;
  text-align: center;
}

.chart-info {
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 500;
}

.gauges-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.gauge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.gauge-wrapper {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  background: #f9fafb;
  position: relative;
  overflow: hidden;
}

.gauge-item span {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.app-footer {
  text-align: center;
  margin-top: 40px;
  color: white;
  opacity: 0.8;
}

.app-footer p {
  margin: 5px 0;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }

  .app-header h1 {
    font-size: 2rem;
  }

  .gauges-container {
    flex-direction: column;
  }
}
</style>
