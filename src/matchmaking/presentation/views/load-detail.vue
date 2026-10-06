<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import {RouteMatchingService} from "../../domain/services/route-matching.service.js";
import CounterOfferPanel from "../components/counter-offer-panel.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatNumber, initialsOf, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useMatchmakingStore();
const profileStore = useProfileStore();
const reputationStore = useReputationStore();
const { showError, showSuccess } = useErrorHandler();
const processing = ref(false);

const returnRoute = computed(() => store.getReturnRouteById(route.params.routeId));
const request = computed(() => store.getFreightRequestById(route.params.requestId));
const detour = computed(() => returnRoute.value && request.value ? RouteMatchingService.calculateDetour(returnRoute.value, request.value) : null);
const merchant = computed(() => request.value ? profileStore.getMerchantProfileByUserId(request.value.merchantId) : null);
const reputation = computed(() => request.value ? reputationStore.summaryFor(request.value.merchantId) : { average: 0, count: 0 });
const proposal = computed(() => store.state.matchProposals.find(item =>
  item.freightRequestId === request.value?.id && item.returnRouteId === returnRoute.value?.id && item.status.value !== 'rejected') ?? null);
const awaitingMe = computed(() => proposal.value?.isAwaiting('carrier') ?? false);
const canPropose = computed(() => !proposal.value && request.value?.status.isOpen && returnRoute.value?.status.isActive);

/**
 * Runs a negotiation action and shows its result.
 * @param {Function} action - Async action.
 * @param {string} successKey - I18n key of the success message.
 */
const run = async (action, successKey) => {
  processing.value = true;
  try {
    await action();
    showSuccess(successKey);
  } catch (error) {
    showError(error);
  } finally {
    processing.value = false;
  }
};

/**
 * Accepts the rate published by the merchant.
 */
const acceptPublishedRate = () => run(() => store.sendProposal({
  routeId: returnRoute.value.id,
  requestId: request.value.id,
  amount: request.value.offeredRate.amount
}), 'offer.sent');

/**
 * Proposes another rate to the merchant.
 * @param {number} amount - Proposed rate.
 */
const proposeRate = (amount) => run(() => store.sendProposal({
  routeId: returnRoute.value.id,
  requestId: request.value.id,
  amount
}), 'offer.sent');

/**
 * Accepts the merchant offer.
 */
const acceptOffer = () => run(() => store.acceptProposal(proposal.value), 'offer.accepted');

/**
 * Answers the merchant with another rate.
 * @param {number} amount - New rate.
 */
const counterOffer = (amount) => run(() => store.counterProposal(proposal.value, amount), 'offer.countered');

/**
 * Rejects the merchant offer.
 */
const rejectOffer = () => run(() => store.rejectProposal(proposal.value), 'offer.rejected');
</script>

<template>
  <div class="trazza-page">
    <pv-button :label="t('actions.back')" icon="pi pi-arrow-left" text class="mb-2 -ml-2" @click="router.back()"/>
    <div v-if="!request || !returnRoute" class="trazza-panel text-center py-6 trazza-muted">{{ t('load-detail.not-found') }}</div>
    <template v-else>
      <div class="trazza-page-header mb-4">
        <h1>{{ t('load-detail.heading', { code: request.code, merchant: merchant?.businessName ?? '' }) }}</h1>
        <p>{{ request.label }} · {{ formatDate(request.pickupDate, locale) }}</p>
      </div>
      <div class="grid">
        <div class="col-12 lg:col-7 flex flex-column gap-3">
          <div class="trazza-panel">
            <div class="trazza-overline mb-3">{{ t('load-detail.details') }}</div>
            <dl class="detail-grid m-0">
              <dt>{{ t('load.pickup') }}</dt>
              <dd>{{ request.pickup.fullAddress }} · {{ request.pickupWindow.label }}</dd>
              <dt>{{ t('load.delivery') }}</dt>
              <dd>{{ request.delivery.fullAddress }}</dd>
              <dt>{{ t('load.cargo') }}</dt>
              <dd>{{ request.cargo.description || '—' }} · {{ t(`cargo-types.${request.cargo.type.value}`) }}</dd>
              <dt>{{ t('load.weight-volume') }}</dt>
              <dd>{{ formatNumber(request.cargo.weightKg) }} kg · {{ formatNumber(request.cargo.volumeM3) }} m³</dd>
              <dt>{{ t('load.your-route') }}</dt>
              <dd>{{ returnRoute.label }} · {{ returnRoute.timeWindow.label }}</dd>
            </dl>
          </div>
          <div class="trazza-panel flex align-items-center justify-content-between gap-3">
            <div class="flex align-items-center gap-3">
              <pv-avatar :label="initialsOf(merchant?.businessName)" size="large" shape="circle" class="merchant-avatar"/>
              <div>
                <div class="font-semibold">{{ merchant?.businessName }}</div>
                <div class="text-sm trazza-muted">
                  <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
                  {{ reputation.count ? t('reputation.average-of', { average: reputation.average, count: reputation.count }) : t('reputation.no-ratings') }}
                </div>
              </div>
            </div>
            <pv-tag v-if="merchant?.verified" :value="t('profile.verified')" severity="success" icon="pi pi-verified"/>
          </div>
        </div>
        <div class="col-12 lg:col-5">
          <div class="trazza-panel flex flex-column gap-3">
            <div>
              <div class="trazza-overline mb-1">{{ t('load.detour') }}</div>
              <div class="text-xl font-bold">{{ detour?.label }}</div>
            </div>
            <pv-divider class="my-0"/>
            <div>
              <div class="text-3xl font-bold">{{ request.offeredRate?.formatted ?? t('load.open-rate') }}</div>
              <div class="text-sm trazza-muted">{{ t('load.offered-by-merchant') }}</div>
            </div>
            <template v-if="canPropose">
              <pv-button v-if="request.offeredRate" :label="t('load.accept-rate', { rate: request.offeredRate.formatted })" icon="pi pi-check" :loading="processing" @click="acceptPublishedRate"/>
              <counter-offer-panel :title="t('load.propose-other')" :initial-amount="request.offeredRate?.amount ?? null" :loading="processing" @submit="proposeRate"/>
              <pv-button :label="t('load.decline')" severity="secondary" text @click="router.push({ name: 'matchmaking-load-suggestions', query: { routeId: returnRoute.id } })"/>
            </template>
            <template v-else-if="proposal">
              <div class="flex align-items-center justify-content-between">
                <span class="font-semibold">{{ t('offer.current-rate') }}: {{ proposal.currentRate.formatted }}</span>
                <pv-tag :value="t(`statuses.${proposal.status.value}`)" :severity="statusSeverity(proposal.status.value)"/>
              </div>
              <pv-message v-if="!awaitingMe" :severity="proposal.status.value === 'matched' ? 'success' : 'info'">
                {{ t(`offer.carrier-status.${proposal.status.value}`, { merchant: merchant?.businessName ?? '', rate: proposal.currentRate.formatted }) }}
              </pv-message>
              <template v-else>
                <pv-message severity="warn">{{ t('offer.merchant-proposed', { rate: proposal.currentRate.formatted }) }}</pv-message>
                <div class="flex gap-2">
                  <pv-button :label="t('actions.accept')" icon="pi pi-check" :loading="processing" @click="acceptOffer"/>
                  <pv-button :label="t('actions.reject')" severity="danger" outlined :loading="processing" @click="rejectOffer"/>
                </div>
                <counter-offer-panel :title="t('offer.counter')" :initial-amount="proposal.currentRate.amount" :loading="processing" @submit="counterOffer"/>
              </template>
            </template>
            <pv-message v-else severity="secondary">{{ t('load-detail.unavailable') }}</pv-message>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: minmax(7rem, max-content) 1fr;
  gap: 0.6rem 1.25rem;
}

.detail-grid dt {
  color: var(--trazza-muted);
  font-size: 0.9rem;
}

.detail-grid dd {
  margin: 0;
  font-weight: 500;
}

.merchant-avatar {
  background: var(--trazza-soft);
  color: var(--trazza-accent);
  font-weight: 700;
}
</style>
