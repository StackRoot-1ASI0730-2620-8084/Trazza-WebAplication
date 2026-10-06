<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import CounterOfferPanel from "../components/counter-offer-panel.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatNumber, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const store = useMatchmakingStore();
const iamStore = useIamStore();
const profileStore = useProfileStore();
const { showError, showSuccess } = useErrorHandler();
const counterDialog = ref(false);
const selectedProposal = ref(null);
const processing = ref(false);

const isCarrier = computed(() => iamStore.isCarrier.value);

const carrierOffers = computed(() => store.myProposals.value.map(proposal => ({
  proposal,
  request: store.getFreightRequestById(proposal.freightRequestId),
  merchantName: profileStore.displayNameOf(proposal.merchantId)
})).filter(item => item.request));

const merchantRequests = computed(() => store.myFreightRequests.value
  .map(request => {
    const proposals = store.proposalsForRequest(request.id);
    return {
      request,
      total: proposals.length,
      awaiting: proposals.filter(proposal => proposal.isAwaiting('merchant') || proposal.status.value === 'accepted').length,
      matched: proposals.find(proposal => proposal.status.value === 'matched') ?? null
    };
  })
  .filter(item => item.total > 0));

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
    counterDialog.value = false;
  } catch (error) {
    showError(error);
  } finally {
    processing.value = false;
  }
};

/**
 * Opens the counteroffer dialog.
 * @param {Object} proposal - Proposal to counter.
 */
const openCounter = (proposal) => {
  selectedProposal.value = proposal;
  counterDialog.value = true;
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('offers.title') }}</h1>
      <p>{{ isCarrier ? t('offers.carrier-subtitle') : t('offers.merchant-subtitle') }}</p>
    </div>
    <div v-if="isCarrier" class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="carrierOffers" :loading="!store.state.loaded" data-key="proposal.id" paginator :rows="8" striped-rows>
        <template #empty>
          <div class="text-center py-4 trazza-muted">{{ t('offers.empty') }}</div>
        </template>
        <pv-column :header="t('columns.load')">
          <template #body="{ data }">
            <div class="font-semibold">{{ data.request.code }} · {{ data.merchantName }}</div>
            <div class="text-sm trazza-muted">{{ data.request.label }} · {{ formatNumber(data.request.cargo.weightKg) }} kg</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.date')">
          <template #body="{ data }">{{ formatDate(data.request.pickupDate, locale) }}</template>
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
            <div v-if="data.proposal.isAwaiting('carrier')" class="flex gap-1 flex-wrap">
              <pv-button :label="t('actions.accept')" size="small" :loading="processing" @click="run(() => store.acceptProposal(data.proposal), 'offer.accepted')"/>
              <pv-button :label="t('offer.counter-short')" size="small" outlined @click="openCounter(data.proposal)"/>
              <pv-button :label="t('actions.reject')" size="small" text severity="danger" @click="run(() => store.rejectProposal(data.proposal), 'offer.rejected')"/>
            </div>
            <pv-button v-else-if="data.proposal.status.value === 'matched'" :label="t('offers.go-to-trip')" size="small" text icon="pi pi-truck" @click="router.push({ name: 'execution-active-trip' })"/>
            <span v-else class="text-sm trazza-muted">{{ data.proposal.status.isOpen ? t('offers.waiting-merchant') : '—' }}</span>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
    <div v-else>
      <div v-if="!merchantRequests.length" class="trazza-panel text-center py-6 trazza-muted">{{ t('offers.empty') }}</div>
      <div class="grid">
        <div v-for="item in merchantRequests" :key="item.request.id" class="col-12 md:col-6">
          <div class="trazza-panel flex flex-column gap-2 h-full">
            <div class="flex justify-content-between align-items-center">
              <span class="font-bold">{{ item.request.code }}</span>
              <pv-tag :value="t(`statuses.${item.request.status.value}`)" :severity="statusSeverity(item.request.status.value)"/>
            </div>
            <div class="trazza-route">{{ item.request.label }}</div>
            <div class="text-sm trazza-muted">{{ formatNumber(item.request.cargo.weightKg) }} kg · {{ formatDate(item.request.pickupDate, locale) }} {{ item.request.pickupWindow.label }}</div>
            <div class="flex align-items-center gap-2 text-sm">
              <span>{{ t('offers.received', { count: item.total }) }}</span>
              <pv-badge v-if="item.awaiting" :value="t('offers.need-answer', { count: item.awaiting })" severity="warn"/>
            </div>
            <pv-button :label="t('offers.review')" icon="pi pi-arrow-right" icon-pos="right" size="small" class="mt-auto align-self-start" @click="router.push({ name: 'matchmaking-offer-detail', params: { requestId: item.request.id } })"/>
          </div>
        </div>
      </div>
    </div>
    <pv-dialog v-model:visible="counterDialog" modal :header="t('offer.counter')" :style="{ width: '26rem' }">
      <counter-offer-panel v-if="selectedProposal" :hint="t('offer.counter-hint', { rate: selectedProposal.currentRate.formatted })" :initial-amount="selectedProposal.currentRate.amount" :loading="processing" @submit="amount => run(() => store.counterProposal(selectedProposal, amount), 'offer.countered')"/>
    </pv-dialog>
  </div>
</template>
