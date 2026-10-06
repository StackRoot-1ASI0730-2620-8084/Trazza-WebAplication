<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import useExecutionStore from "../../application/execution.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import RatingDialog from "../../../reputation/presentation/components/rating-dialog.vue";
import IncidentDialog from "../components/incident-dialog.vue";
import {formatDate, formatNumber, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const store = useExecutionStore();
const reputationStore = useReputationStore();
const iamStore = useIamStore();
const search = ref('');
const status = ref(null);
const period = ref(30);
const ratingDialog = ref(false);
const incidentDialog = ref(false);
const selected = ref(null);

const statusOptions = computed(() => [
  { value: null, label: t('filters.all-statuses') },
  ...['delivered', 'closed', 'cancelled'].map(value => ({ value, label: t(`statuses.${value}`) }))
]);
const periodOptions = computed(() => [
  { value: 30, label: t('filters.last-days', { days: 30 }) },
  { value: 90, label: t('filters.last-days', { days: 90 }) },
  { value: null, label: t('filters.all-time') }
]);

const rows = computed(() => {
  const term = search.value.trim().toLowerCase();
  const limit = period.value ? Date.now() - period.value * 864e5 : null;
  return store.myFinishedShipments.value
    .filter(shipment => !status.value || shipment.status.value === status.value)
    .filter(shipment => !limit || Date.parse(shipment.createdAt) >= limit)
    .filter(shipment => !term || `${shipment.label} ${shipment.merchantName} ${shipment.code}`.toLowerCase().includes(term))
    .map(shipment => ({ shipment, rating: reputationStore.ratingForShipmentBy(shipment.id, iamStore.currentUserId.value) }));
});

/**
 * Opens a dialog for a shipment.
 * @param {Object} shipment - Shipment.
 * @param {string} dialog - "rating" or "incident".
 */
const open = (shipment, dialog) => {
  selected.value = shipment;
  if (dialog === 'rating') ratingDialog.value = true; else incidentDialog.value = true;
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('history.trip-title') }}</h1>
      <p>{{ t('history.trip-subtitle') }}</p>
    </div>
    <div class="grid mb-2">
      <div class="col-12 md:col-6">
        <pv-icon-field>
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text v-model="search" :placeholder="t('history.search-merchant')" class="w-full"/>
        </pv-icon-field>
      </div>
      <div class="col-6 md:col-3">
        <pv-select v-model="period" :options="periodOptions" option-label="label" option-value="value" class="w-full"/>
      </div>
      <div class="col-6 md:col-3">
        <pv-select v-model="status" :options="statusOptions" option-label="label" option-value="value" class="w-full"/>
      </div>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="rows" :loading="!store.state.loaded" data-key="shipment.id" paginator :rows="8" striped-rows>
        <template #empty>
          <div class="text-center py-4 trazza-muted">{{ t('history.empty') }}</div>
        </template>
        <pv-column :header="t('columns.date')">
          <template #body="{ data }">{{ formatDate(data.shipment.pickupDate, locale) }}</template>
        </pv-column>
        <pv-column :header="t('columns.route')">
          <template #body="{ data }"><span class="trazza-route">{{ data.shipment.label }}</span></template>
        </pv-column>
        <pv-column :header="t('roles.merchant')">
          <template #body="{ data }">{{ data.shipment.merchantName }}</template>
        </pv-column>
        <pv-column :header="t('columns.weight')">
          <template #body="{ data }">{{ formatNumber(data.shipment.weightKg) }} kg</template>
        </pv-column>
        <pv-column :header="t('columns.rate')">
          <template #body="{ data }">{{ data.shipment.rate.formatted }}</template>
        </pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }">
            <pv-tag :value="t(`statuses.${data.shipment.status.value}`)" :severity="statusSeverity(data.shipment.status.value)"/>
            <i v-if="data.shipment.incidents.length" v-tooltip.top="t('history.incidents', { count: data.shipment.incidents.length })" class="pi pi-exclamation-triangle text-orange-500 ml-2"></i>
          </template>
        </pv-column>
        <pv-column :header="t('columns.rating')">
          <template #body="{ data }">
            <span v-if="data.rating"><i class="pi pi-star-fill text-yellow-500 text-xs"></i> {{ data.rating.score.value }}</span>
            <pv-button v-else-if="data.shipment.status.isDelivered" :label="t('history.rate')" size="small" text @click="open(data.shipment, 'rating')"/>
            <span v-else>—</span>
          </template>
        </pv-column>
        <pv-column>
          <template #body="{ data }">
            <pv-button v-if="data.shipment.status.isDelivered" icon="pi pi-exclamation-triangle" text rounded severity="warn" v-tooltip.top="t('trip.report-issue')" @click="open(data.shipment, 'incident')"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
    <rating-dialog v-model:visible="ratingDialog" :shipment="selected"/>
    <incident-dialog v-model:visible="incidentDialog" :shipment="selected"/>
  </div>
</template>
