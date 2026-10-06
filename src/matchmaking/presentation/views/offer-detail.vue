<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import CounterOfferPanel from "../components/counter-offer-panel.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatNumber, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useMatchmakingStore();
const profileStore = useProfileStore();
const reputationStore = useReputationStore();
const { showError, showSuccess } = useErrorHandler();
const processing = ref(false);
const counterTarget = ref(null);
const confirmedShipment = ref(null);

const request = computed(() => store.getFreightRequestById(route.params.requestId));
const rows = computed(() => store.proposalsForRequest(route.params.requestId).map(proposal => ({
  proposal,
  carrierName: profileStore.displayNameOf(proposal.carrierId),
  reputation: reputationStore.summaryFor(proposal.carrierId),
  vehicle: store.getReturnRouteById(proposal.returnRouteId)?.vehicleLabel ?? ''
})));
const matchedRow = computed(() => rows.value.find(row => row.proposal.status.value === 'matched') ?? null);

/**
 * Runs a negotiation action.
 * @param {Function} action - Async action.
 * @param {string} successKey - I18n success key.
 */
const run = async (action, successKey) => {
  processing.value = true;
  try {
    await action();
    showSuccess(successKey);
    counterTarget.value = null;
  } catch (error) {
    showError(error);
  } finally {
    processing.value = false;
  }
};

/**
 * Confirms the match with a carrier and opens the shipment.
 * @param {Object} proposal - Accepted proposal.
 */
const confirmMatch = (proposal) => run(async () => {
  confirmedShipment.value = await store.confirmMatch(proposal);
}, 'offer.match-confirmed');
</script>

<template>
  <div class="trazza-page">
    <pv-button :label="t('actions.back')" icon="pi pi-arrow-left" text class="mb-2 -ml-2" @click="router.push({ name: 'matchmaking-offers' })"/>
    <div v-if="!request" class="trazza-panel text-center py-6 trazza-muted">{{ t('load-detail.not-found') }}</div>
    <template v-else>
      <div class="trazza-page-header mb-4">
        <h1>{{ t('offer-detail.heading', { code: request.code }) }}</h1>
        <p>{{ request.label }} · {{ formatNumber(request.cargo.weightKg) }} kg · {{ formatDate(request.pickupDate, locale) }} {{ request.pickupWindow.label }}</p>
      </div>
      <div v-if="matchedRow" class="flex flex-column md:flex-row md:align-items-center gap-3 mb-3">
        <pv-message severity="success" class="flex-1">
          <div class="font-semibold">{{ t('offer-detail.match-confirmed') }}</div>
          <div>{{ t('offer-detail.match-confirmed-detail', { carrier: matchedRow.carrierName, window: request.pickupWindow.label }) }}</div>
        </pv-message>
        <pv-button :label="t('offer-detail.go-to-tracking')" icon="pi pi-map-marker" @click="router.push({ name: 'execution-shipment-tracking', query: confirmedShipment ? { shipmentId: confirmedShipment.id } : {} })"/>
      </div>
      <div class="trazza-panel p-0 overflow-hidden">
        <pv-data-table :value="rows" data-key="proposal.id" striped-rows>
          <template #empty>
            <div class="text-center py-4 trazza-muted">{{ t('offers.empty') }}</div>
          </template>
          <pv-column :header="t('columns.carrier')">
            <template #body="{ data }"><span class="font-semibold">{{ data.carrierName }}</span></template>
          </pv-column>
          <pv-column :header="t('columns.rating')">
            <template #body="{ data }">
              <i class="pi pi-star-fill text-yellow-500 text-xs"></i> {{ data.reputation.count ? data.reputation.average : '—' }}
            </template>
          </pv-column>
          <pv-column :header="t('columns.vehicle')" field="vehicle"/>
          <pv-column :header="t('columns.detour')">
            <template #body="{ data }">{{ data.proposal.detour.label }}</template>
          </pv-column>
          <pv-column :header="t('columns.rate')">
            <template #body="{ data }">
              <div class="font-semibold">{{ data.proposal.currentRate.formatted }}</div>
              <div v-if="data.proposal.previousRate" class="text-xs trazza-muted line-through">{{ data.proposal.previousRate.formatted }}</div>
            </template>
          </pv-column>
          <pv-column :header="t('columns.status')">
            <template #body="{ data }">
              <pv-tag :value="t(`statuses.${data.proposal.status.value}`)" :severity="statusSeverity(data.proposal.status.value)"/>
            </template>
          </pv-column>
          <pv-column :header="t('columns.actions')">
            <template #body="{ data }">
              <pv-button v-if="data.proposal.status.value === 'accepted'" :label="t('offer-detail.confirm-match')" size="small" icon="pi pi-check" :loading="processing" @click="confirmMatch(data.proposal)"/>
              <div v-else-if="data.proposal.isAwaiting('merchant')" class="flex gap-1 flex-wrap">
                <pv-button :label="t('actions.accept')" size="small" :loading="processing" @click="run(() => store.acceptProposal(data.proposal), 'offer.accepted')"/>
                <pv-button :label="t('offer.counter-short')" size="small" outlined @click="counterTarget = data"/>
                <pv-button :label="t('actions.reject')" size="small" text severity="danger" @click="run(() => store.rejectProposal(data.proposal), 'offer.rejected')"/>
              </div>
              <pv-button v-else-if="data.proposal.status.value === 'matched'" :label="t('offer-detail.go-to-tracking')" size="small" text @click="router.push({ name: 'execution-shipment-tracking' })"/>
              <span v-else class="text-sm trazza-muted">{{ data.proposal.status.isOpen ? t('offers.waiting-carrier') : '—' }}</span>
            </template>
          </pv-column>
        </pv-data-table>
      </div>
      <div v-if="counterTarget" class="mt-3" style="max-width: 28rem">
        <counter-offer-panel
            :title="t('offer-detail.counter-to', { carrier: counterTarget.carrierName })"
            :hint="t('offer-detail.counter-hint', { proposed: counterTarget.proposal.currentRate.formatted, previous: counterTarget.proposal.previousRate?.formatted ?? request.offeredRate?.formatted ?? '—' })"
            :initial-amount="counterTarget.proposal.currentRate.amount"
            :loading="processing"
            @submit="amount => run(() => store.counterProposal(counterTarget.proposal, amount), 'offer.countered')"/>
      </div>
    </template>
  </div>
</template>
