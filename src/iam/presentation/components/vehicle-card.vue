<script setup>
import {useI18n} from "vue-i18n";
import {formatNumber} from "../../../shared/presentation/formatters.js";

const props = defineProps({
  vehicle: { type: Object, required: true }
});
const emit = defineEmits(['edit', 'toggle', 'remove']);
const { t } = useI18n();
</script>

<template>
  <div class="trazza-panel h-full flex flex-column gap-3">
    <div class="flex justify-content-between align-items-start gap-2">
      <div>
        <div class="font-bold text-lg">{{ props.vehicle.brandModel }}</div>
        <div class="trazza-muted text-sm">{{ props.vehicle.plate.value }}</div>
      </div>
      <pv-tag :value="props.vehicle.active ? t('vehicle.active') : t('vehicle.inactive')" :severity="props.vehicle.active ? 'success' : 'secondary'"/>
    </div>
    <div class="vehicle-photo flex align-items-center justify-content-center border-round">
      <i class="pi pi-truck text-4xl text-primary"></i>
    </div>
    <div class="text-sm">
      {{ t(`body-types.${props.vehicle.bodyType}`) }} · {{ formatNumber(props.vehicle.capacity.weightKg) }} kg · {{ formatNumber(props.vehicle.capacity.volumeM3) }} m³
    </div>
    <div class="flex gap-2 mt-auto">
      <pv-button :label="t('actions.edit')" icon="pi pi-pencil" size="small" outlined @click="emit('edit', props.vehicle)"/>
      <pv-button :label="props.vehicle.active ? t('vehicle.deactivate') : t('vehicle.activate')" size="small" text @click="emit('toggle', props.vehicle)"/>
      <pv-button icon="pi pi-trash" size="small" text severity="danger" :aria-label="t('actions.delete')" @click="emit('remove', props.vehicle)"/>
    </div>
  </div>
</template>

<style scoped>
.vehicle-photo {
  height: 6rem;
  background: var(--p-primary-50);
}
</style>
