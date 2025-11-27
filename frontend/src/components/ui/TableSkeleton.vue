<template>
  <div class="table-skeleton">
    <div class="table-skeleton__header">
      <div class="th name skeleton" aria-hidden="true"></div>
      <div class="th numeric skeleton" aria-hidden="true"></div>
      <div class="th numeric skeleton" aria-hidden="true"></div>
      <div class="th numeric skeleton" aria-hidden="true"></div>
    </div>
    <div class="table-skeleton__body">
      <div v-for="n in 6" :key="n" class="tr">
        <div class="td name skeleton" aria-hidden="true"></div>
        <div class="td numeric skeleton" aria-hidden="true"></div>
        <div class="td numeric skeleton" aria-hidden="true"></div>
        <div class="td numeric skeleton" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// simple presentational skeleton for table-like layout
</script>

