<template>
  <div class="treemap-demo-container">
    <h2 class="treemap-title">Vue Data UI Treemap 示例</h2>
    <div class="treemap-card">
      <VueUiTreemap :config="treemapConfig" :dataset="treemapData" class="treemap-chart" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VueUiTreemap } from 'vue-data-ui'

const treemapConfig = ref({
  table: {
    th: { backgroundColor: '#FFFFFF', color: '#1A1A1A' },
    td: { backgroundColor: '#FFFFFF', color: '#1A1A1A' }
  },
  style: {
    chart: {
      backgroundColor: '#FFFFFF',
      color: '#1A1A1A',
      legend: {
        backgroundColor: '#FFFFFF',
        color: '#1A1A1A',
        fontSize: 32
      },
      layout: {
        rects: {
          stroke: '#FFFFFF',
          selected: { stroke: '#FFFFFF' },
          label: { fontSize: 32 }
        }
      },
      title: {
        text: 'Title',
        color: '#1A1A1A',
        fontSize: 48,
        textAlign: 'left',
        paddingLeft: 12,
        subtitle: { text: 'Subtitle', fontSize: 32 }
      }
    }
  }
})

const treemapData = ref([
  {
    name: 'Parent 1',
    value: 100,
    id: '9b13f10a-bdc0-4c8d-89ea-09124062ea1f',
    color: '#1f77b4ff',
    children: [
      { name: 'P1 C1', value: 70, parentId: '9b13f10a-bdc0-4c8d-89ea-09124062ea1f', color: '#1f77b4ff', id: 'fa5eabc5-ee77-4d56-b87d-7c9a1e49d23c' },
      { name: 'P1 C2', value: 20, parentId: '9b13f10a-bdc0-4c8d-89ea-09124062ea1f', color: '#1f77b4ff', id: '0bd0d1c2-edf4-4d73-991c-42d71947d55e' },
      { name: 'P1 C3', value: 10, parentId: '9b13f10a-bdc0-4c8d-89ea-09124062ea1f', color: '#1f77b4ff', id: 'cb121587-8ca7-4649-9f44-7b6826570ebf' }
    ]
  },
  {
    name: 'Parent 2',
    value: 110,
    id: 'ec690262-284c-4103-af7c-e250a88406e1',
    color: '#aec7e8ff',
    children: [
      { name: 'P2 C1', value: 80, parentId: 'ec690262-284c-4103-af7c-e250a88406e1', color: '#aec7e8ff', id: '52a1022c-3dde-47ed-8a8a-c21bdb4c5899' },
      { name: 'P2 C2', value: 20, parentId: 'ec690262-284c-4103-af7c-e250a88406e1', color: '#aec7e8ff', id: 'e36cd731-a865-492c-9793-2efe33b17560' },
      { name: 'P2 C3', value: 10, parentId: 'ec690262-284c-4103-af7c-e250a88406e1', color: '#aec7e8ff', id: '08e8dda8-9b46-455f-a351-f4ef6ee09b5c' }
    ]
  },
  {
    name: 'Parent 3',
    value: 75,
    id: 'b051031d-e72a-4d60-9505-7c1e818b63ae',
    color: '#ff7f0eff',
    children: [
      { name: 'P3 C1', value: 20, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: '39791e14-01a9-4441-8fed-fd276dd3e1d5' },
      { name: 'P3 C2', value: 10, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: '37739b5a-a9db-4c5d-a45b-0c19606a612a' },
      { name: 'P3 C3', value: 10, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: '905dccc3-14bc-450c-8d1f-a9f479ac9f89' },
      { name: 'P3 C6', value: 10, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: '65c6cb25-13b9-4688-8dbd-ecd6210343e0' },
      { name: 'P3 C8', value: 10, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: '752b2367-fd6b-4ee8-bc19-287834f25161', children: [
        { name: 'P3 C8 CC1', value: 5, parentId: '752b2367-fd6b-4ee8-bc19-287834f25161', color: '#ff7f0eff', id: '622ecdd4-8faf-45d8-8ca0-6d64790fcc4c' },
        { name: 'P3 C8 CC2', value: 5, parentId: '752b2367-fd6b-4ee8-bc19-287834f25161', color: '#ff7f0eff', id: '35189bed-9071-4f45-a3f0-bdc780a4f86b' }
      ] },
      { name: 'P3 C4', value: 5, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: '54884141-6c90-4ded-96bd-e438ed18fe76' },
      { name: 'P3 C5', value: 5, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: 'fbdef2f7-2232-4bac-b6da-d6d100424bf7' },
      { name: 'P3 C7', value: 5, parentId: 'b051031d-e72a-4d60-9505-7c1e818b63ae', color: '#ff7f0eff', id: 'ea447bd7-c736-482e-bf56-ccb456499846' }
    ]
  }
])
</script>

<style scoped>
.treemap-demo-container {
  max-width: 2100px;
  margin: 0 auto;
  padding: 48px 24px 80px 24px;
  background: #f8fafc;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.treemap-title {
  font-size: 3.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 48px;
  text-align: center;
  display: block;
}
.treemap-card {
  width: 1000px;
  height: 2000px;
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 8px 48px 0 rgba(60,60,60,0.12);
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.treemap-chart {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}
@media (max-width: 2100px) {
  .treemap-card {
    width: 100vw;
    max-width: 100vw;
    height: 60vw;
    max-height: 1200px;
    padding: 16px 4px;
  }
  .treemap-title {
    font-size: 2rem;
    margin-bottom: 24px;
  }
}
</style>
