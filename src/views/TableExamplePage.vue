<template>
  <div class="table-example-container">
    <h2 class="table-title">VueUiTable 官方示例</h2>
    <div class="table-card">
      <VueUiTable :config="tableConfig" :dataset="tableDataset" class="table-demo" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { VueUiTable } from 'vue-data-ui'

const tableDataset = ref({
  header: [
    { name: "touchpoint", type: "text", average: false, decimals: undefined, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: undefined, suffix: "", prefix: "", rangeFilter: false },
    { name: "category", type: "text", average: false, decimals: undefined, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: undefined, suffix: "", prefix: "", rangeFilter: false },
    { name: "date", type: "date", average: false, decimals: undefined, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: undefined, suffix: "", prefix: "", rangeFilter: false },
    { name: "base", type: "numeric", average: false, decimals: 0, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: undefined, suffix: "", prefix: "", rangeFilter: false },
    { name: "rating", type: "numeric", average: false, decimals: 1, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: undefined, suffix: "", prefix: "", rangeFilter: false },
    { name: "spend", type: "numeric", average: false, decimals: 1, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: undefined, suffix: "€", prefix: "", rangeFilter: false },
    { name: "percentage", type: "numeric", average: false, decimals: 1, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: true, percentageTo: "base", suffix: "", prefix: "", rangeFilter: false },
    { name: "happy", type: "numeric", average: false, decimals: 0, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: "base", suffix: "", prefix: "", rangeFilter: false },
    { name: "sad", type: "numeric", average: false, decimals: 0, sum: false, isSort: false, isSearch: false, isMultiselect: false, isPercentage: false, percentageTo: "base", suffix: "", prefix: "", rangeFilter: false }
  ],
  body: [
    { td: ["Réactivité du support", "Accueil", "2023-11-14", 35, 4.1, 18.7, "", -27, 109] },
    { td: ["Variété des produits", "Caisse", "2023-08-12", 25, 2, 74, "", 35, 276] },
    { td: ["Qualité des produits", "Rayon", "2023-07-01", 40, 4.8, 120.5, "", 12, 88] },
    { td: ["Prix", "Caisse", "2023-06-20", 20, 3.5, 50.2, "", 8, 45] },
    { td: ["Service après-vente", "Accueil", "2023-05-15", 30, 4.0, 60.0, "", 20, 60] }
  ]
})

const tableConfig = ref({
  fontFamily: "inherit",
  maxHeight: 500,
  rowsPerPage: 25,
  style: {
    th: { backgroundColor: "#e1e5e8", color: "#2D353C", outline: "1px solid #FFFFFF", selected: { backgroundColor: "#1f77b4", color: "#FFFFFF" } },
    rows: {
      even: { backgroundColor: "#f3f5f7", color: "#2D353C", selectedCell: { backgroundColor: "#1f77b45b", color: "#2D353C" }, selectedNeighbors: { backgroundColor: "#63dd821e", color: "#2D353C" } },
      odd: { backgroundColor: "#FFFFFF", color: "#2D353C", selectedCell: { backgroundColor: "#1f77b45b", color: "#2D353C" }, selectedNeighbors: { backgroundColor: "#63dd821e", color: "#2D353C" } }
    },
    inputs: { backgroundColor: "#FFFFFF", color: "#2D353C", border: "1px solid #CCCCCC", accentColor: "#1f77b4" },
    dropdowns: { backgroundColor: "#e1e5e8", color: "#2D353C", icons: { selected: { color: "#008000", unicode: "✔" }, unselected: { color: "#ff0000", unicode: "✖" } } },
    infoBar: { backgroundColor: "#e1e5e8", color: "#2D353C" },
    pagination: { buttons: { backgroundColor: "#e1e5e8", color: "#2D353C", opacityDisabled: 0.5 }, navigationIndicator: { backgroundColor: "#1f77b4" } },
    exportMenu: { backgroundColor: "#e1e5e8", color: "#2D353C", buttons: { backgroundColor: "#FAFAFA", color: "#2D353C" } },
    closeButtons: { backgroundColor: "transparent", color: "#2D353C", borderRadius: "50%" },
    chart: {
      modal: { backgroundColor: "#e1e5e8", color: "#2D353C", buttons: { selected: { backgroundColor: "#1f77b4", color: "#FFFFFF" }, unselected: { backgroundColor: "#FFFFFF", color: "#2D353C" } } },
      layout: { backgroundColor: "#FFFFFF", axis: { stroke: "#ccd1d4", strokeWidth: 2 }, bar: { fill: "#1f77b4", stroke: "#FFFFFF" }, line: { smooth: true, useArea: false, stroke: "#1f77b4", strokeWidth: 4, plot: { fill: "#1f77b4", stroke: "#FFFFFF", strokeWidth: 1, radius: { selected: 6, unselected: 4 } }, selector: { stroke: "#ccc", strokeWidth: 1, strokeDasharray: 5 } }, labels: { color: "#2D353C" }, progression: { stroke: "#2D353C", strokeWidth: 2, strokeDasharray: 4, arrowSize: 7 } }
    }
  },
  translations: {
    average: "Average",
    by: "by",
    chooseCategoryColumn: "Choose category column",
    exportAllButton: "CSV all",
    exportAllLabel: "Export all rows of your current filtered dataset",
    exportPageButton: "CSV page",
    exportPageLabel: "Export rows of the current page",
    from: "From",
    inputPlaceholder: "Search...",
    makeDonut: "Generate",
    nb: "Nb",
    page: "Page",
    paginatorLabel: "Rows per page",
    sizeWarning: "Displaying too many rows at a time can lead to slower performance",
    sum: "Somme",
    to: "To",
    total: "Total",
    totalRows: "Total rows"
  },
  useChart: true
})
</script>
<style scoped>
.table-example-container {
  max-width: 2100px;
  margin: 0 auto;
  padding: 48px 24px 80px 24px;
  background: #f8fafc;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.table-title {
  font-size: 2.6rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 40px;
  text-align: center;
}
.table-card {
  width: 2000px;
  height: 2000px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 6px 40px 0 rgba(60,60,60,0.12);
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.table-demo {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
