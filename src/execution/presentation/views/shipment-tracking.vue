<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useExecutionStore from "../../application/execution.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import ShipmentTimeline from "../components/shipment-timeline.vue";
import TrackingMap from "../components/tracking-map.vue";
import IncidentDialog from "../components/incident-dialog.vue";
import RatingDialog from "../../../reputation/presentation/components/rating-dialog.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatNumber, formatTime, initialsOf} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useExecutionStore();
const reputationStore = useReputationStore();
const iamStore = useIamStore();
const { showError, showSuccess } = useErrorHandler();
const processing = ref(false);
const incidentDialog = ref(false);
const ratingDialog = ref(false);

const trackable = computed(() => store.myShipments.value.filter(item => item.status.isActive || item.status.value === 'delivered'));
const selectedId = computed({
  get: () => Number(route.query.shipmentId) || trackable.value[0]?.id || null,
  set: value => router.replace({ query: { shipmentId: value } })
});
const shipment = computed(() => store.getShipmentById(selectedId.value));
const options = computed(() => trackable.value.map(item => ({ value: item.id, label: `${item.code} · ${item.label}` })));
const carrierReputation = computed(() => shipment.value ? reputationStore.summaryFor(shipment.value.carrierId) : { average: 0, count: 0 });
const alreadyRated = computed(() => shipment.value ? !!reputationStore.ratingForShipmentBy(shipment.value.id, iamStore.currentUserId.value) : true);
const trackingLink = computed(() => shipment.value ? `${window.location.origin}/t/${shipment.value.code}` : '');

watch(trackable, list => {
  if (!route.query.shipmentId && list.length) router.replace({ query: { shipmentId: list[0].id } });
});

/**
 * Copies the read-only tracking link.
 */
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(trackingLink.value);
    showSuccess('tracking.link-copied');
  } catch (error) {
    showError(error);
  }
};

/**
 * Confirms the reception of the goods and opens the rating dialog.
 */
const confirmReception = async () => {
  processing.value = true;
  await router.replace({ query: { shipmentId: shipment.value.id } });
  try {
    await store.confirmReception(shipment.value);
    showSuccess('tracking.reception-confirmed');
    ratingDialog.value = true;
  } catch (error) {
    showError(error);
  } finally {
    processing.value = false;
  }
};
</script>

<template>
  <div class="trazza-page">
    <div v-if="!shipment" class="trazza-panel text-center py-6">
      <i class="pi pi-map-marker text-4xl text-primary"></i>
      <p class="font-semibold mb-1">{{ t('tracking.no-shipments') }}</p>
      <p class="trazza-muted mt-0">{{ t('tracking.no-shipments-hint') }}</p>
      <pv-button :label="t('option.freight-requests')" icon="pi pi-box" @click="router.push({ name: 'matchmaking-freight-requests' })"/>
    </div>
    <template v-else>
      <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>{{ t('tracking.heading', { code: shipment.code }) }}</h1>
          <p>{{ shipment.label }} · {{ t(`cargo-types.${shipment.cargoType}`) }} · {{ formatNumber(shipment.weightKg) }} kg</p>
        </div>
        <pv-select v-if="options.length > 1" v-model="selectedId" :options="options" option-label="label" option-value="value"/>
      </div>
      <pv-message v-if="shipment.isOffRoute" severity="warn" class="mb-3">
        <div class="font-semibold">{{ t('tracking.off-route', { distance: shipment.deviationKm }) }}</div>
        <div class="text-sm">{{ t('tracking.off-route-hint') }}</div>
      </pv-message>
      <div class="trazza-panel mb-3">
        <shipment-timeline :shipment="shipment" :show-events="false"/>
      </div>
      <div class="grid">
        <div class="col-12 lg:col-7 flex flex-column gap-3">
          <div class="trazza-panel">
            <tracking-map :shipment="shipment"/>
          </div>
          <div class="trazza-panel">
            <div class="trazza-overline mb-2">{{ t('tracking.history') }}</div>
            <shipment-timeline :shipment="shipment" :show-steps="false"/>
          </div>
        </div>
        <div class="col-12 lg:col-5 flex flex-column gap-3">
          <div class="trazza-panel">
            <div class="flex align-items-center gap-3">
              <pv-avatar :label="initialsOf(shipment.carrierName)" size="large" shape="circle" class="carrier-avatar"/>
              <div>
                <div class="font-semibold">{{ shipment.carrierName }}</div>
                <div class="text-sm trazza-muted">
                  <i class="pi pi-star-fill text-yellow-500 text-xs"></i> {{ carrierReputation.count ? carrierReputation.average : '—' }} · {{ shipment.vehicleLabel }}
                </div>
              </div>
            </div>
            <div v-if="shipment.status.isMoving" class="text-sm mt-2">
              {{ t('tracking.eta', { minutes: shipment.etaMinutes ?? '—', distance: shipment.distanceToDeliveryKm ?? '—' }) }} ·
              {{ t('tracking.picked-up-at', { time: formatTime(shipment.pickedUpAt, locale) }) }}
            </div>
            <a v-if="shipment.carrierPhone" :href="`tel:+51${shipment.carrierPhone}`">
              <pv-button :label="t('tracking.call-carrier')" icon="pi pi-phone" size="small" outlined class="mt-2"/>
            </a>
          </div>
          <div v-if="shipment.status.value === 'delivered'" class="trazza-panel flex flex-column gap-2">
            <div class="font-semibold">{{ t('tracking.marked-delivered', { time: formatTime(shipment.deliveredAt, locale) }) }}</div>
            <div>{{ t('tracking.arrived-ok') }}</div>
            <div class="text-sm trazza-muted">{{ t('tracking.arrived-hint') }}</div>
            <pv-button :label="t('tracking.yes-confirm')" icon="pi pi-check" :loading="processing" @click="confirmReception"/>
            <pv-button :label="t('tracking.no-report')" severity="warn" outlined @click="incidentDialog = true"/>
          </div>
          <div v-else class="trazza-panel">
            <div class="trazza-overline mb-1">{{ t('tracking.share-title') }}</div>
            <div class="text-sm trazza-muted mb-2">{{ t('tracking.share-hint') }}</div>
            <div class="flex gap-2">
              <pv-input-text :model-value="trackingLink" readonly class="flex-1 text-sm"/>
              <pv-button icon="pi pi-copy" outlined :aria-label="t('tracking.copy-link')" @click="copyLink"/>
            </div>
            <pv-button :label="t('trip.report-issue')" icon="pi pi-exclamation-triangle" severity="warn" text class="mt-2" @click="incidentDialog = true"/>
          </div>
          <pv-button v-if="shipment.status.isDelivered && !alreadyRated && shipment.status.value === 'closed'" :label="t('rating.rate-carrier')" icon="pi pi-star" outlined @click="ratingDialog = true"/>
        </div>
      </div>
    </template>
    <incident-dialog v-model:visible="incidentDialog" :shipment="shipment"/>
    <rating-dialog v-model:visible="ratingDialog" :shipment="shipment"/>
  </div>
</template>

<style scoped>
.carrier-avatar {
  background: var(--trazza-soft);
  color: var(--trazza-accent);
  font-weight: 700;
}
</style>
