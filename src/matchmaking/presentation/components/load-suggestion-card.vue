<script setup>
import {useI18n} from "vue-i18n";
import {formatNumber, initialsOf, statusSeverity} from "../../../shared/presentation/formatters.js";

const props = defineProps({
  suggestion: { type: Object, required: true },
  merchantName: { type: String, default: '' },
  reputation: { type: Object, default: () => ({ average: 0, count: 0 }) },
  verified: { type: Boolean, default: false }
});
const emit = defineEmits(['view']);
const { t } = useI18n();
</script>

<template>
  <div class="trazza-panel flex flex-column gap-2">
    <div class="flex justify-content-between align-items-start gap-3">
      <div class="flex align-items-center gap-2">
        <pv-avatar :label="initialsOf(props.merchantName)" shape="circle" class="merchant-avatar"/>
        <div>
          <div class="font-semibold">{{ props.merchantName }}</div>
          <div class="text-sm trazza-muted">
            <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
            {{ props.reputation.count ? `${props.reputation.average} (${props.reputation.count})` : t('reputation.no-ratings') }}
            <span v-if="props.verified"> · {{ t('profile.verified-business') }}</span>
          </div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xl font-bold">{{ props.suggestion.request.offeredRate?.formatted ?? t('load.open-rate') }}</div>
        <div class="text-xs trazza-muted">{{ t('load.offered-rate') }}</div>
      </div>
    </div>
    <div class="trazza-route">{{ props.suggestion.request.label }}</div>
    <div class="text-sm">
      {{ formatNumber(props.suggestion.request.cargo.weightKg) }} kg · {{ formatNumber(props.suggestion.request.cargo.volumeM3) }} m³ ·
      {{ t(`cargo-types.${props.suggestion.request.cargo.type.value}`) }} · {{ t('load.pickup') }} {{ props.suggestion.request.pickupWindow.label }}
    </div>
    <div class="flex justify-content-between align-items-center flex-wrap gap-2">
      <pv-chip :label="`${t('load.detour')} ${props.suggestion.detour.label}`" icon="pi pi-directions" class="detour-chip"/>
      <div class="flex align-items-center gap-2">
        <pv-tag v-if="props.suggestion.proposal" :value="t(`statuses.${props.suggestion.proposal.status.value}`)" :severity="statusSeverity(props.suggestion.proposal.status.value)"/>
        <pv-button :label="t('load.view-detail')" size="small" outlined @click="emit('view', props.suggestion)"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.merchant-avatar {
  background: var(--trazza-soft);
  color: var(--trazza-accent);
  font-weight: 700;
}

.detour-chip {
  background: var(--p-primary-50);
  color: var(--p-primary-800);
  font-size: 0.85rem;
}
</style>
