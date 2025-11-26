<template>
  <header id="smeta-header-component" class="smeta-header">
    <div class="smeta-header__left">
      <div class="panel-title-mobile-label smeta-header__label">Работы по смете</div>
      <h3 class="panel-title text-h3 smeta-header__title">{{ label }}</h3>
    </div>

    <div class="smeta-header__right" aria-hidden="true">
      <!-- sort control temporarily disabled -->
    </div>

    <div v-if="subtitle" class="smeta-header__subtitle-full">{{ subtitle }}</div>
  </header>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  subtitle: { type: String, default: '' },
  modelValue: { type: String, default: 'plan' }
  ,collapsible: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'change'])

function onUpdateModelValue(v){
  emit('update:modelValue', v)
  emit('change', v)
}

// Sort control temporarily disabled
</script>
<style scoped>
/* Minimal layout only — typography for the title/label is inherited from global panel styles
   (the ones used by `SmetaCardsSection.vue` / `.panel-title`), so we intentionally avoid
   overriding font-family/weight/transform here. */
.smeta-header{
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 12px 18px;
  align-items: center;
  padding: 8px 16px 2px 16px;
}
.smeta-header__right{ justify-self:end; display:flex; flex-direction:row; gap:8px; align-items:center; }

/* Make left title block typography match `SmetaCardsSection` panel title styles */
.smeta-header__left {
  font-family: var(--font-din);
}
.smeta-header__left .panel-title {
  font-size: clamp(1.05rem, 1.6vw, var(--font-size-h3));
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.12;
  color: var(--text-main);
  margin: 0 0 calc(var(--gap-sm));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.smeta-header__left .panel-title-mobile-label {
  font-size: var(--font-size-label);
  color: var(--text-muted);
  text-transform: none;
}

@media (max-width: 640px){
  .smeta-header{ grid-template-columns: 1fr minmax(120px, 40%); }
  .smeta-header__subtitle-full{ grid-column: 1 / -1; margin-top: 2px; margin-bottom: 2px; font-size: var(--font-size-caption); color:var(--text-muted); }
  .smeta-header__right{ width:100%; justify-self:end; }
}

@media (min-width: 641px){
  .smeta-header__subtitle-full{ display: none; }
}
@media (max-width: 420px){
  .smeta-header{ grid-template-columns: 1fr; }
  .smeta-header__right{ width:100%; justify-self:start }
}
</style>
    
