<script setup>
import {useI18n} from "vue-i18n";
import {formatDate, formatNumber, initialsOf, statusSeverity} from "../../../shared/presentation/formatters.js";

const props = defineProps({
  match: { type: Object, required: true },
  carrierName: { type: String, default: '' },
  reputation: { type: Object, default: () => ({ average: 0, count: 0 }) },
  verified: { type: Boolean, default: false }
});
const emit = defineEmits(['send-offer']);
const { t, locale } = useI18n();
</script>

<template>
  <div class="trazza-panel flex flex-column gap-2">
    <div class="flex justify-content-between align-items-start gap-3">
      <div class="flex align-items-center gap-2">
        <pv-avatar :label="initialsOf(props.carrierName)" shape="circle" class="carrier-avatar"/>
        <div>
          <div class="font-semibold">{{ props.carrierName }}</div>
          <div class="text-sm trazza-muted">
            <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
            {{ props.reputation.count ? `${props.reputation.average} (${props.reputation.count})` : t('reputation.no-ratings') }}
            <span v-if="props.verified"> · {{ t('profile.dni-verified') }}</span>
          </div>
        </div>
      </div>
      <pv-tag v-if="props.match.proposal" :value="t(`statuses.${props.match.proposal.status.value}`)" :severity="statusSeverity(props.match.proposal.status.value)"/>
    </div>
    <div class="text-sm">
      <span class="trazza-route">{{ props.match.route.label }}</span> ·
      {{ formatDate(props.match.route.departureDate, locale) }} {{ props.match.route.timeWindow.label }}
    </div>
    <div class="text-sm">{{ props.match.route.vehicleLabel }} · {{ formatNumber(props.match.route.availableWeightKg) }} kg {{ t('load-suggestions.free') }}</div>
    <div class="flex justify-content-between align-items-center flex-wrap gap-2">
      <pv-chip :label="t('find-carriers.detour-for-load', { detour: props.match.detour.label })" icon="pi pi-directions" class="detour-chip"/>
      <pv-button v-if="!props.match.proposal" :label="t('find-carriers.send-offer')" icon="pi pi-send" size="small" @click="emit('send-offer', props.match)"/>
    </div>
  </div>
</template>

<style scoped>
.carrier-avatar {
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
