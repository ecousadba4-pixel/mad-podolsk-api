<script setup lang="ts">
/**
 * ResourcesDataEntry — подраздел "Внесение данных"
 * 
 * Содержит три блока:
 * - Собственная техника
 * - Арендованная техника
 * - Мастера
 */
import { OwnEquipmentBlock, RentedEquipmentBlock, MastersBlock } from '@/components/resources'
</script>

<template>
  <div class="data-entry">
    <OwnEquipmentBlock />
    <RentedEquipmentBlock />
    <MastersBlock />
  </div>
</template>

<style scoped lang="scss">
.data-entry {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}
</style>
