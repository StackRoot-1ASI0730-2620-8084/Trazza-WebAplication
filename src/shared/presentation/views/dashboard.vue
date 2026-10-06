<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import useMatchmakingStore from "../../../matchmaking/application/matchmaking.store.js";
import useExecutionStore from "../../../execution/application/execution.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import {formatDate, formatNumber, statusSeverity} from "../formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const iamStore = useIamStore();
const profileStore = useProfileStore();
const matchmakingStore = useMatchmakingStore();
const executionStore = useExecutionStore();
const reputationStore = useReputationStore();

const isCarrier = computed(() => iamStore.isCarrier.value);
const firstName = computed(() => (iamStore.state.currentUser?.fullName ?? '').split(' ')[0]);
const greetingKey = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.good-morning';
  if (hour < 19) return 'dashboard.good-afternoon';
  return 'dashboard.good-evening';
});
const reputation = computed(() => reputationStore.summaryFor(iamStore.currentUserId.value));
const month = new Date().toLocaleDateString('en-CA').slice(0, 7);
const shipmentsThisMonth = computed(() => executionStore.myShipments.value.filter(item => (item.createdAt ?? '').slice(0, 7) === month).length);
const activeShipment = computed(() => executionStore.myActiveShipments.value[0] ?? null);
const nextRoute = computed(() => [...matchmakingStore.myActiveReturnRoutes.value].sort((a, b) => a.departureDate.localeCompare(b.departureDate))[0] ?? null);
const openRequests = computed(() => matchmakingStore.myFreightRequests.value.filter(request => request.status.isOpen));
const topSuggestions = computed(() => matchmakingStore.myActiveReturnRoutes.value
  .flatMap(route => matchmakingStore.getLoadSuggestions(route.id).map(item => ({ ...item, routeId: route.id })))
  .filter(item => !item.proposal)
  .slice(0, 3));

const carrierKpis = computed(() => [
  { label: 'dashboard.active-routes', value: matchmakingStore.myActiveReturnRoutes.value.length, hint: nextRoute.value ? t('dashboard.next', { date: formatDate(nextRoute.value.departureDate, locale.value), time: nextRoute.value.timeWindow.start }) : '—' },
  { label: 'dashboard.pending-offers', value: matchmakingStore.proposalsAwaitingMe.value.length, hint: t('dashboard.waiting-for-you') },
  { label: 'dashboard.trips-month', value: shipmentsThisMonth.value, hint: t('dashboard.this-month') },
  { label: 'dashboard.your-rating', value: reputation.value.count ? `${reputation.value.average} ★` : '—', hint: t('reputation.based-on', { count: reputation.value.count }) }
]);

const merchantKpis = computed(() => [
  { label: 'dashboard.in-transit', value: executionStore.myActiveShipments.value.length, hint: activeShipment.value?.etaMinutes ? t('dashboard.eta', { minutes: activeShipment.value.etaMinutes }) : '—' },
  { label: 'dashboard.open-requests', value: openRequests.value.length, hint: t('dashboard.waiting-carriers') },
  { label: 'dashboard.offers-to-review', value: matchmakingStore.proposalsAwaitingMe.value.length, hint: t('dashboard.waiting-for-you') },
  { label: 'dashboard.your-rating', value: reputation.value.count ? `${reputation.value.average} ★` : '—', hint: t('reputation.based-on', { count: reputation.value.count }) }
]);

const kpis = computed(() => isCarrier.value ? carrierKpis.value : merchantKpis.value);
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t(greetingKey, { name: firstName }) }}</h1>
        <p>{{ isCarrier ? t('dashboard.carrier-subtitle') : t('dashboard.merchant-subtitle') }}</p>
      </div>
      <pv-button v-if="isCarrier" :label="t('return-route.publish')" icon="pi pi-plus" @click="router.push({ name: 'matchmaking-return-route-new' })"/>
      <pv-button v-else :label="t('freight-request.new')" icon="pi pi-plus" @click="router.push({ name: 'matchmaking-freight-request-new' })"/>
    </div>
    <div class="grid">
      <div v-for="kpi in kpis" :key="kpi.label" class="col-6 lg:col-3">
        <div class="trazza-panel h-full">
          <div class="trazza-overline mb-2">{{ t(kpi.label) }}</div>
          <div class="trazza-kpi">{{ kpi.value }}</div>
          <div class="text-sm trazza-muted mt-1">{{ kpi.hint }}</div>
        </div>
      </div>
    </div>
    <div class="grid mt-2">
      <div class="col-12 lg:col-6">
        <div class="trazza-panel h-full">
          <template v-if="activeShipment">
            <div class="trazza-overline mb-2">{{ isCarrier ? t('dashboard.active-trip') : t('dashboard.shipment-in-transit') }}</div>
            <div class="trazza-route text-lg">{{ activeShipment.label }}</div>
            <div class="text-sm mb-2">{{ isCarrier ? activeShipment.merchantName : `${t('roles.carrier')}: ${activeShipment.carrierName}` }}</div>
            <pv-tag :value="t(`statuses.${activeShipment.status.value}`)" :severity="statusSeverity(activeShipment.status.value)"/>
            <div class="mt-3">
              <pv-button v-if="isCarrier" :label="t('dashboard.view-trip')" size="small" @click="router.push({ name: 'execution-active-trip' })"/>
              <pv-button v-else :label="t('dashboard.track-shipment')" size="small" @click="router.push({ name: 'execution-shipment-tracking', query: { shipmentId: activeShipment.id } })"/>
            </div>
          </template>
          <template v-else-if="isCarrier && nextRoute">
            <div class="trazza-overline mb-2">{{ t('dashboard.next-return-trip') }}</div>
            <div class="trazza-route text-lg">{{ nextRoute.label }}</div>
            <div class="text-sm">{{ formatDate(nextRoute.departureDate, locale) }} · {{ nextRoute.timeWindow.label }} · {{ formatNumber(nextRoute.availableWeightKg) }} kg {{ t('load-suggestions.free') }}</div>
          </template>
          <template v-else>
            <div class="trazza-overline mb-2">{{ t('dashboard.getting-started') }}</div>
            <p class="m-0 trazza-muted">{{ isCarrier ? t('dashboard.carrier-empty') : t('dashboard.merchant-empty') }}</p>
          </template>
        </div>
      </div>
      <div class="col-12 lg:col-6">
        <div class="trazza-panel h-full">
          <template v-if="isCarrier">
            <div class="trazza-overline mb-2">{{ t('dashboard.new-suggestions') }}</div>
            <p v-if="!topSuggestions.length" class="m-0 trazza-muted">{{ t('load-suggestions.empty-title') }}</p>
            <div v-for="item in topSuggestions" :key="`${item.routeId}-${item.request.id}`" class="flex justify-content-between align-items-center py-2 border-bottom-1 surface-border cursor-pointer"
                 @click="router.push({ name: 'matchmaking-load-detail', params: { routeId: item.routeId, requestId: item.request.id } })">
              <div>
                <div class="font-semibold">{{ profileStore.displayNameOf(item.request.merchantId) }}</div>
                <div class="text-sm trazza-muted">{{ item.request.label }} · {{ formatNumber(item.request.cargo.weightKg) }} kg · {{ t('load.detour') }} {{ item.detour.label }}</div>
              </div>
              <span class="font-bold">{{ item.request.offeredRate?.formatted ?? '—' }}</span>
            </div>
          </template>
          <template v-else>
            <div class="trazza-overline mb-2">{{ t('dashboard.recent-requests') }}</div>
            <p v-if="!matchmakingStore.myFreightRequests.value.length" class="m-0 trazza-muted">{{ t('freight-request.empty') }}</p>
            <div v-for="request in matchmakingStore.myFreightRequests.value.slice(0, 4)" :key="request.id" class="flex justify-content-between align-items-center py-2 border-bottom-1 surface-border">
              <div>
                <div class="font-semibold">{{ request.code }} · {{ request.label }}</div>
                <div class="text-sm trazza-muted">{{ formatDate(request.pickupDate, locale) }} · {{ formatNumber(request.cargo.weightKg) }} kg</div>
              </div>
              <pv-tag :value="t(`statuses.${request.status.value}`)" :severity="statusSeverity(request.status.value)"/>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
