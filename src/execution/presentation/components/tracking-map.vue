<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const props = defineProps({
  shipment: { type: Object, required: true }
});
const { t } = useI18n();

const WIDTH = 320;
const HEIGHT = 180;
const PADDING = 28;

const points = computed(() => {
  const pickup = props.shipment.pickup.location;
  const delivery = props.shipment.delivery.location;
  const current = props.shipment.currentLocation;
  const all = [pickup, delivery, current].filter(Boolean);
  const lats = all.map(point => point.latitude);
  const lngs = all.map(point => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 0.01);
  const spanLng = Math.max(maxLng - minLng, 0.01);
  const project = point => point ? {
    x: PADDING + (point.longitude - minLng) / spanLng * (WIDTH - PADDING * 2),
    y: PADDING + (maxLat - point.latitude) / spanLat * (HEIGHT - PADDING * 2)
  } : null;
  return { pickup: project(pickup), delivery: project(delivery), current: project(current) };
});
</script>

<template>
  <div class="tracking-map border-round overflow-hidden">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" :aria-label="t('tracking.map-label')" class="w-full block">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="4"/>
        </pattern>
      </defs>
      <rect :width="WIDTH" :height="HEIGHT" fill="#e8eef7"/>
      <rect :width="WIDTH" :height="HEIGHT" fill="url(#grid)"/>
      <line :x1="points.pickup.x" :y1="points.pickup.y" :x2="points.delivery.x" :y2="points.delivery.y" stroke="#0037b0" stroke-width="3" stroke-dasharray="8 6" stroke-linecap="round"/>
      <line v-if="points.current" :x1="points.pickup.x" :y1="points.pickup.y" :x2="points.current.x" :y2="points.current.y" :stroke="props.shipment.isOffRoute ? '#ea580c' : '#0037b0'" stroke-width="4" stroke-linecap="round"/>
      <circle :cx="points.pickup.x" :cy="points.pickup.y" r="7" fill="#ffffff" stroke="#0037b0" stroke-width="3"/>
      <text :x="points.pickup.x" :y="points.pickup.y - 12" text-anchor="middle" font-size="11" fill="#131b2e">{{ props.shipment.pickup.district }}</text>
      <circle :cx="points.delivery.x" :cy="points.delivery.y" r="7" fill="#0037b0"/>
      <text :x="points.delivery.x" :y="points.delivery.y - 12" text-anchor="middle" font-size="11" fill="#131b2e">{{ props.shipment.delivery.district }}</text>
      <g v-if="points.current">
        <circle :cx="points.current.x" :cy="points.current.y" r="11" :fill="props.shipment.isOffRoute ? '#fed7aa' : '#c9d5ff'"/>
        <circle :cx="points.current.x" :cy="points.current.y" r="6" :fill="props.shipment.isOffRoute ? '#ea580c' : '#0037b0'"/>
      </g>
    </svg>
    <div class="flex justify-content-between text-xs trazza-muted px-2 py-1 legend">
      <span>{{ t('tracking.planned-vs-current') }}</span>
      <span v-if="props.shipment.currentLocation">{{ props.shipment.currentLocation.latitude.toFixed(4) }}, {{ props.shipment.currentLocation.longitude.toFixed(4) }}</span>
    </div>
  </div>
</template>

<style scoped>
.tracking-map {
  border: 1px solid var(--trazza-line);
}

.legend {
  background: #fff;
  border-top: 1px solid var(--trazza-line);
}
</style>
