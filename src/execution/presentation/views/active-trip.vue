<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useToast} from "primevue";
import useExecutionStore from "../../application/execution.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import ShipmentTimeline from "../components/shipment-timeline.vue";
import TrackingMap from "../components/tracking-map.vue";
import IncidentDialog from "../components/incident-dialog.vue";
import RatingDialog from "../../../reputation/presentation/components/rating-dialog.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatNumber, formatTime} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const store = useExecutionStore();
const reputationStore = useReputationStore();
const iamStore = useIamStore();
const toast = useToast();
const { showError, showSuccess } = useErrorHandler();
const processing = ref(false);
const selectedId = ref(null);
const farDialog = ref(false);
const incidentDialog = ref(false);
const ratingDialog = ref(false);
const lastDelivered = ref(null);

const activeShipments = computed(() => store.myActiveShipments.value);
const shipment = computed(() => store.getShipmentById(selectedId.value) ?? lastDelivered.value);
const shipmentOptions = computed(() => activeShipments.value.map(item => ({ value: item.id, label: `${item.code} · ${item.label}` })));
const merchantReputation = computed(() => shipment.value ? reputationStore.summaryFor(shipment.value.merchantId) : { average: 0, count: 0 });
const alreadyRated = computed(() => shipment.value ? !!reputationStore.ratingForShipmentBy(shipment.value.id, iamStore.currentUserId.value) : true);

watch(activeShipments, list => {
  if (!list.some(item => item.id === selectedId.value) && list.length) selectedId.value = list[0].id;
}, { immediate: true });

/**
 * Runs an execution action.
 * @param {Function} action - Async action.
 * @param {string} successKey - I18n success key.
 */
const run = async (action, successKey) => {
  processing.value = true;
  try {
    await action();
    if (successKey) showSuccess(successKey);
  } catch (error) {
    showError(error);
  } finally {
    processing.value = false;
  }
};

/**
 * Confirms the pickup.
 */
const confirmPickup = () => run(() => store.confirmPickup(shipment.value), 'tracking.pickup-confirmed');

/**
 * Shares the current location of the vehicle.
 */
const shareLocation = () => run(async () => {
  const event = await store.shareLocation(shipment.value);
  if (event === 'detour_alert') toast.add({ severity: 'warn', summary: t('alerts.detour-title'), detail: t('tracking.off-route-warning'), life: 4000 });
}, null);

/**
 * Confirms the delivery or asks the carrier to acknowledge the distance to the delivery point.
 * @param {boolean} [acknowledge=false] - Confirm despite being far from the delivery point.
 */
const confirmDelivery = (acknowledge = false) => {
  if (!acknowledge && shipment.value.distanceToDeliveryKm > 1) {
    farDialog.value = true;
    return;
  }
  farDialog.value = false;
  const delivered = shipment.value;
  run(async () => {
    await store.confirmDelivery(delivered, acknowledge);
    lastDelivered.value = delivered;
    ratingDialog.value = true;
  }, 'tracking.delivery-confirmed');
};
</script>

<template>
  <div class="trazza-page">
    <div v-if="!shipment" class="trazza-panel text-center py-6">
      <i class="pi pi-truck text-4xl text-primary"></i>
      <p class="font-semibold mb-1">{{ t('trip.no-active') }}</p>
      <p class="trazza-muted mt-0">{{ t('trip.no-active-hint') }}</p>
      <pv-button :label="t('option.load-suggestions')" icon="pi pi-box" @click="router.push({ name: 'matchmaking-load-suggestions' })"/>
    </div>
    <template v-else>
      <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>{{ t('trip.heading', { code: shipment.code }) }}</h1>
          <p>{{ shipment.label }} · {{ t('trip.load-from', { merchant: shipment.merchantName }) }}</p>
        </div>
        <pv-select v-if="shipmentOptions.length > 1" v-model="selectedId" :options="shipmentOptions" option-label="label" option-value="value"/>
      </div>
      <div class="trazza-panel mb-3">
        <shipment-timeline :shipment="shipment" :show-events="false"/>
      </div>
      <div class="grid">
        <div class="col-12 lg:col-7 flex flex-column gap-3">
          <div class="trazza-panel">
            <div class="flex justify-content-between align-items-center mb-2">
              <span class="trazza-overline">{{ t('trip.live-location') }}</span>
              <pv-button v-if="shipment.status.isMoving" :label="t('trip.share-location')" icon="pi pi-send" size="small" outlined :loading="processing" @click="shareLocation"/>
            </div>
            <pv-message v-if="shipment.isOffRoute" severity="warn" size="small" class="mb-2">{{ t('tracking.off-route', { distance: shipment.deviationKm }) }}</pv-message>
            <tracking-map :shipment="shipment"/>
          </div>
          <div class="trazza-panel">
            <div class="trazza-overline mb-2">{{ t('tracking.history') }}</div>
            <shipment-timeline :shipment="shipment" :show-steps="false"/>
          </div>
        </div>
        <div class="col-12 lg:col-5 flex flex-column gap-3">
          <div class="trazza-panel">
            <div class="trazza-overline mb-2">{{ t('roles.merchant') }}</div>
            <div class="font-semibold">{{ shipment.merchantName }}</div>
            <div class="text-sm trazza-muted mb-2">
              <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
              {{ merchantReputation.count ? merchantReputation.average : '—' }} · {{ shipment.merchantPhone ? `+51 ${shipment.merchantPhone}` : '' }}
            </div>
            <a v-if="shipment.merchantPhone" :href="`tel:+51${shipment.merchantPhone}`">
              <pv-button :label="t('trip.call-merchant')" icon="pi pi-phone" size="small" outlined/>
            </a>
          </div>
          <div class="trazza-panel flex flex-column gap-2">
            <template v-if="shipment.status.value === 'matched'">
              <div class="trazza-overline">{{ t('load.pickup') }}</div>
              <div class="font-semibold">{{ shipment.pickup.fullAddress }} · {{ shipment.pickupWindow }}</div>
              <div class="text-sm">{{ formatNumber(shipment.weightKg) }} kg · {{ shipment.cargoDescription || t(`cargo-types.${shipment.cargoType}`) }}</div>
              <pv-button :label="t('trip.confirm-pickup')" icon="pi pi-check" :loading="processing" @click="confirmPickup"/>
            </template>
            <template v-else-if="shipment.status.isMoving">
              <div class="trazza-overline">{{ t('load.delivery') }}</div>
              <div class="font-semibold">{{ shipment.delivery.fullAddress }}</div>
              <div class="text-sm">{{ t('tracking.eta', { minutes: shipment.etaMinutes ?? '—', distance: shipment.distanceToDeliveryKm ?? '—' }) }}</div>
              <div class="text-sm trazza-muted">{{ t('tracking.picked-up-at', { time: formatTime(shipment.pickedUpAt, locale) }) }}</div>
              <pv-button :label="t('trip.confirm-delivery')" icon="pi pi-check-circle" :loading="processing" @click="confirmDelivery(false)"/>
            </template>
            <template v-else>
              <pv-message severity="success">{{ t('trip.delivered') }}</pv-message>
              <pv-button v-if="!alreadyRated" :label="t('rating.rate-merchant')" icon="pi pi-star" outlined @click="ratingDialog = true"/>
            </template>
            <pv-button :label="t('trip.report-issue')" icon="pi pi-exclamation-triangle" severity="warn" text @click="incidentDialog = true"/>
          </div>
        </div>
      </div>
    </template>
    <pv-dialog v-model:visible="farDialog" modal :header="t('trip.check-location')" :style="{ width: '26rem' }">
      <p class="mt-0">{{ t('trip.far-from-delivery', { distance: shipment?.distanceToDeliveryKm }) }}</p>
      <p class="trazza-muted text-sm">{{ t('trip.far-hint') }}</p>
      <template #footer>
        <pv-button :label="t('actions.back')" severity="secondary" outlined @click="farDialog = false"/>
        <pv-button :label="t('trip.confirm-anyway')" severity="warn" @click="confirmDelivery(true)"/>
      </template>
    </pv-dialog>
    <incident-dialog v-model:visible="incidentDialog" :shipment="shipment"/>
    <rating-dialog v-model:visible="ratingDialog" :shipment="shipment"/>
  </div>
</template>
