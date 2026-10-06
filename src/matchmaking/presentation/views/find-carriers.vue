<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import CarrierCard from "../components/carrier-card.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatNumber} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useMatchmakingStore();
const profileStore = useProfileStore();
const reputationStore = useReputationStore();
const { showError, showSuccess } = useErrorHandler();

const minRating = ref(0);
const offerDialog = ref(false);
const offerAmount = ref(null);
const selectedMatch = ref(null);
const sending = ref(false);

const openRequests = computed(() => store.myFreightRequests.value.filter(request => request.status.isOpen));
const selectedRequestId = computed({
  get: () => Number(route.query.requestId) || openRequests.value[0]?.id || null,
  set: value => router.replace({ query: { requestId: value } })
});
const selectedRequest = computed(() => store.getFreightRequestById(selectedRequestId.value));
const requestOptions = computed(() => openRequests.value.map(request => ({
  value: request.id,
  label: `${request.code} · ${request.label} · ${formatDate(request.pickupDate, locale.value)}`
})));
const ratingOptions = computed(() => [
  { value: 0, label: t('filters.any-rating') },
  { value: 4, label: '≥ 4 ★' },
  { value: 4.5, label: '≥ 4.5 ★' }
]);
const matches = computed(() => selectedRequestId.value
  ? store.findCarriersFor(selectedRequestId.value).filter(match => {
      const summary = reputationStore.summaryFor(match.route.carrierId);
      return minRating.value === 0 || summary.average >= minRating.value;
    })
  : []);

watch(openRequests, list => {
  if (!route.query.requestId && list.length) router.replace({ query: { requestId: list[0].id } });
});

/**
 * Opens the offer dialog for a carrier.
 * @param {Object} match - Route and detour of the carrier.
 */
const openOfferDialog = (match) => {
  selectedMatch.value = match;
  offerAmount.value = selectedRequest.value?.offeredRate?.amount ?? null;
  offerDialog.value = true;
};

/**
 * Sends the offer to the selected carrier.
 */
const sendOffer = async () => {
  sending.value = true;
  try {
    await store.sendProposal({ routeId: selectedMatch.value.route.id, requestId: selectedRequestId.value, amount: offerAmount.value });
    offerDialog.value = false;
    showSuccess('offer.sent');
  } catch (error) {
    showError(error);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-3">
      <h1>{{ t('find-carriers.title') }}</h1>
      <p>{{ t('find-carriers.subtitle') }}</p>
    </div>
    <div v-if="!requestOptions.length" class="trazza-panel text-center py-6">
      <i class="pi pi-box text-4xl text-primary"></i>
      <p class="font-semibold mb-1">{{ t('find-carriers.no-requests') }}</p>
      <pv-button :label="t('freight-request.new')" icon="pi pi-plus" class="mt-2" @click="router.push({ name: 'matchmaking-freight-request-new' })"/>
    </div>
    <template v-else>
      <div class="trazza-panel mb-3 grid m-0">
        <div class="col-12 md:col-8">
          <label for="request" class="trazza-label">{{ t('find-carriers.your-request') }}</label>
          <pv-select input-id="request" v-model="selectedRequestId" :options="requestOptions" option-label="label" option-value="value" class="w-full"/>
        </div>
        <div class="col-12 md:col-4">
          <label for="rating" class="trazza-label">{{ t('filters.rating') }}</label>
          <pv-select input-id="rating" v-model="minRating" :options="ratingOptions" option-label="label" option-value="value" class="w-full"/>
        </div>
        <div v-if="selectedRequest" class="col-12 text-sm trazza-muted">
          {{ selectedRequest.pickupWindow.label }} · {{ formatNumber(selectedRequest.cargo.weightKg) }} kg · {{ t(`cargo-types.${selectedRequest.cargo.type.value}`) }}
        </div>
      </div>
      <p class="font-semibold">{{ t('find-carriers.count', { count: matches.length }) }}</p>
      <div v-if="matches.length" class="grid">
        <div v-for="match in matches" :key="match.route.id" class="col-12 xl:col-6">
          <carrier-card
              :match="match"
              :carrier-name="profileStore.displayNameOf(match.route.carrierId)"
              :reputation="reputationStore.summaryFor(match.route.carrierId)"
              :verified="profileStore.getCarrierProfileByUserId(match.route.carrierId)?.verified ?? false"
              @send-offer="openOfferDialog"/>
        </div>
      </div>
      <div v-else class="trazza-panel text-center py-6">
        <i class="pi pi-truck text-4xl text-primary"></i>
        <p class="font-semibold mb-1">{{ t('find-carriers.empty-title') }}</p>
        <p class="trazza-muted mt-0">{{ t('find-carriers.empty-content') }}</p>
      </div>
    </template>
    <pv-dialog v-model:visible="offerDialog" modal :header="t('find-carriers.send-offer')" :style="{ width: '26rem' }">
      <p class="mt-0">{{ t('find-carriers.offer-to', { carrier: selectedMatch ? profileStore.displayNameOf(selectedMatch.route.carrierId) : '' }) }}</p>
      <label for="offerAmount" class="trazza-label">{{ t('offer.your-rate') }}</label>
      <pv-input-number input-id="offerAmount" v-model="offerAmount" :min="1" mode="currency" currency="PEN" locale="es-PE" fluid/>
      <template #footer>
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="offerDialog = false"/>
        <pv-button :label="t('actions.send')" icon="pi pi-send" :loading="sending" :disabled="!offerAmount" @click="sendOffer"/>
      </template>
    </pv-dialog>
  </div>
</template>
