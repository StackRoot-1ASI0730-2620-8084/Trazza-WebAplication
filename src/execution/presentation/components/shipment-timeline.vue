<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {formatTime} from "../../../shared/presentation/formatters.js";

const props = defineProps({
  shipment: { type: Object, required: true },
  showEvents: { type: Boolean, default: true },
  showSteps: { type: Boolean, default: true }
});
const { t, locale } = useI18n();

const steps = ['matched', 'picked_up', 'in_transit', 'delivered'];
const currentStep = computed(() => props.shipment.status.step);
const events = computed(() => [...props.shipment.events].reverse());
</script>

<template>
  <div>
    <div v-if="props.showSteps && props.shipment.status.value === 'cancelled'" class="mb-2">
      <pv-tag :value="t('statuses.cancelled')" severity="danger"/>
    </div>
    <ol v-else-if="props.showSteps" class="stepper list-none p-0 m-0 flex">
      <li v-for="(step, index) in steps" :key="step" class="flex-1 flex flex-column align-items-center text-center"
          :class="{ done: index + 1 <= currentStep, current: index + 1 === currentStep + 1 }">
        <span class="bullet flex align-items-center justify-content-center">
          <i v-if="index + 1 <= currentStep" class="pi pi-check text-xs"></i>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="text-xs md:text-sm mt-1">{{ t(`tracking.steps.${step}`) }}</span>
      </li>
    </ol>
    <div v-if="props.showEvents" :class="{ 'mt-4': props.showSteps }">
      <div v-for="(event, index) in events" :key="index" class="flex gap-3 py-1 text-sm">
        <span class="font-semibold event-time">{{ formatTime(event.occurredAt, locale) }}</span>
        <span :class="{ 'text-orange-600': event.type === 'detour_alert' || event.type === 'incident_reported' }">
          {{ t(`tracking.events.${event.type}`, { ...event.details, district: event.details.district ?? '', distance: event.details.distanceKm ?? '' }) }}
        </span>
      </div>
      <div v-if="!props.shipment.status.isDelivered && props.shipment.status.value !== 'cancelled'" class="flex gap-3 py-1 text-sm trazza-muted">
        <span class="event-time">—</span>
        <span>{{ t('tracking.events.delivery_pending') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stepper li {
  position: relative;
  color: var(--trazza-muted);
}

.stepper li:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 0.9rem;
  left: calc(50% + 1rem);
  right: calc(-50% + 1rem);
  height: 2px;
  background: var(--trazza-line);
}

.stepper li.done:not(:last-child)::after {
  background: var(--p-primary-color);
}

.bullet {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  border: 2px solid var(--trazza-line);
  background: #fff;
  font-weight: 700;
  font-size: 0.8rem;
}

.stepper li.done {
  color: var(--trazza-ink);
}

.stepper li.done .bullet {
  background: var(--p-primary-color);
  border-color: var(--p-primary-color);
  color: #fff;
}

.stepper li.current .bullet {
  border-color: var(--p-primary-color);
  color: var(--p-primary-color);
}

.event-time {
  min-width: 3rem;
}
</style>
