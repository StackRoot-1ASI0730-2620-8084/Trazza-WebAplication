<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatNumber, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const store = useMatchmakingStore();
const { showError, showSuccess } = useErrorHandler();

const requests = computed(() => store.myFreightRequests.value.map(request => {
  const proposals = store.proposalsForRequest(request.id);
  return { request, offers: proposals.length, openOffers: proposals.filter(proposal => proposal.status.isOpen).length };
}));

/**
 * Publishes a draft request.
 * @param {Object} request - Draft request.
 */
const publish = async (request) => {
  try {
    await store.publishFreightRequest(request);
    showSuccess('freight-request.published');
  } catch (error) {
    showError(error);
  }
};

/**
 * Asks for confirmation and cancels a request.
 * @param {Object} request - Request to cancel.
 */
const confirmCancel = (request) => {
  confirm.require({
    message: t('freight-request.confirm-cancel', { code: request.code }),
    header: t('freight-request.cancel'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('actions.back'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('freight-request.cancel'), severity: 'danger' },
    accept: async () => {
      try {
        await store.cancelFreightRequest(request);
        showSuccess('freight-request.cancelled');
      } catch (error) {
        showError(error);
      }
    }
  });
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('freight-request.list-title') }}</h1>
        <p>{{ t('freight-request.list-subtitle') }}</p>
      </div>
      <pv-button :label="t('freight-request.new')" icon="pi pi-plus" @click="router.push({ name: 'matchmaking-freight-request-new' })"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="requests" :loading="!store.state.loaded" data-key="request.id" paginator :rows="8" striped-rows>
        <template #empty>
          <div class="text-center py-4 trazza-muted">{{ t('freight-request.empty') }}</div>
        </template>
        <pv-column :header="t('columns.code')">
          <template #body="{ data }"><span class="font-semibold">{{ data.request.code }}</span></template>
        </pv-column>
        <pv-column :header="t('columns.route')">
          <template #body="{ data }">
            <div class="trazza-route">{{ data.request.label }}</div>
            <div class="text-sm trazza-muted">{{ t(`cargo-types.${data.request.cargo.type.value}`) }} · {{ formatNumber(data.request.cargo.weightKg) }} kg</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.pickup')">
          <template #body="{ data }">
            <div>{{ formatDate(data.request.pickupDate, locale) }}</div>
            <div class="text-sm trazza-muted">{{ data.request.pickupWindow.label }}</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.rate')">
          <template #body="{ data }">{{ data.request.offeredRate?.formatted ?? t('load.open-rate') }}</template>
        </pv-column>
        <pv-column :header="t('columns.offers')">
          <template #body="{ data }">
            <span>{{ data.offers }}</span>
            <pv-badge v-if="data.openOffers" :value="data.openOffers" severity="warn" class="ml-2"/>
          </template>
        </pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }">
            <pv-tag :value="t(`statuses.${data.request.status.value}`)" :severity="statusSeverity(data.request.status.value)"/>
          </template>
        </pv-column>
        <pv-column :header="t('columns.actions')">
          <template #body="{ data }">
            <div class="flex gap-1">
              <template v-if="data.request.status.isDraft">
                <pv-button icon="pi pi-pencil" text rounded v-tooltip.top="t('actions.edit')" @click="router.push({ name: 'matchmaking-freight-request-edit', params: { id: data.request.id } })"/>
                <pv-button icon="pi pi-send" text rounded v-tooltip.top="t('freight-request.publish')" @click="publish(data.request)"/>
              </template>
              <template v-if="data.request.status.isOpen">
                <pv-button icon="pi pi-search" text rounded v-tooltip.top="t('option.find-carriers')" @click="router.push({ name: 'matchmaking-find-carriers', query: { requestId: data.request.id } })"/>
              </template>
              <pv-button v-if="data.offers" icon="pi pi-comments" text rounded v-tooltip.top="t('option.offers')" @click="router.push({ name: 'matchmaking-offer-detail', params: { requestId: data.request.id } })"/>
              <pv-button v-if="data.request.status.isOpen || data.request.status.isDraft" icon="pi pi-times-circle" text rounded severity="danger" v-tooltip.top="t('freight-request.cancel')" @click="confirmCancel(data.request)"/>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>
