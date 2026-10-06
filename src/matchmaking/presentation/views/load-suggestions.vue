<script setup>
import {computed, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import {CargoType} from "../../domain/model/cargo-type.value-object.js";
import {ReturnRoute} from "../../domain/model/return-route.entity.js";
import LoadSuggestionCard from "../components/load-suggestion-card.vue";
import {formatDate, formatNumber} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useMatchmakingStore();
const profileStore = useProfileStore();
const reputationStore = useReputationStore();

const filters = reactive({ cargoType: null, maxDetourKm: null, sortBy: 'detour' });
const selectedRouteId = computed({
  get: () => Number(route.query.routeId) || store.myActiveReturnRoutes.value[0]?.id || null,
  set: value => router.replace({ query: { routeId: value } })
});
const selectedRoute = computed(() => store.getReturnRouteById(selectedRouteId.value));
const routeOptions = computed(() => store.myActiveReturnRoutes.value.map(item => ({
  value: item.id,
  label: `${item.label} · ${formatDate(item.departureDate, locale.value)} ${item.timeWindow.label}`
})));
const cargoTypeOptions = computed(() => [
  { value: null, label: t('filters.all-types') },
  ...CargoType.VALUES.map(value => ({ value, label: t(`cargo-types.${value}`) }))
]);
const detourOptions = computed(() => [
  { value: null, label: t('filters.route-detour') },
  ...ReturnRoute.DETOUR_OPTIONS.map(value => ({ value, label: `${value} km` }))
]);
const sortOptions = computed(() => [
  { value: 'detour', label: t('filters.lowest-detour') },
  { value: 'rate', label: t('filters.highest-rate') },
  { value: 'weight', label: t('filters.heaviest') }
]);

const suggestions = computed(() => selectedRouteId.value
  ? store.getLoadSuggestions(selectedRouteId.value, { ...filters, maxDetourKm: filters.maxDetourKm ?? undefined })
  : []);

watch(() => store.myActiveReturnRoutes.value, list => {
  if (!route.query.routeId && list.length) router.replace({ query: { routeId: list[0].id } });
});

/**
 * Navigates to the detail of a suggested load.
 * @param {Object} suggestion - Suggestion with request and detour.
 */
const viewDetail = (suggestion) => router.push({
  name: 'matchmaking-load-detail',
  params: { routeId: selectedRouteId.value, requestId: suggestion.request.id }
});
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-3">
      <h1>{{ t('load-suggestions.title') }}</h1>
      <p>{{ t('load-suggestions.subtitle') }}</p>
    </div>
    <div v-if="!routeOptions.length" class="trazza-panel text-center py-6">
      <i class="pi pi-directions text-4xl text-primary"></i>
      <p class="font-semibold mb-1">{{ t('load-suggestions.no-routes') }}</p>
      <pv-button :label="t('return-route.publish')" icon="pi pi-plus" class="mt-2" @click="router.push({ name: 'matchmaking-return-route-new' })"/>
    </div>
    <template v-else>
      <div class="trazza-panel mb-3 flex flex-wrap align-items-center justify-content-between gap-3">
        <pv-select v-model="selectedRouteId" :options="routeOptions" option-label="label" option-value="value" class="w-full md:w-auto" style="min-width: 18rem"/>
        <div v-if="selectedRoute" class="text-sm">
          <span class="font-semibold">{{ formatNumber(selectedRoute.availableWeightKg) }} kg</span> {{ t('load-suggestions.free') }} ·
          {{ t('load-suggestions.max-detour', { km: selectedRoute.maxDetourKm }) }}
        </div>
      </div>
      <div class="grid mb-2">
        <div class="col-12 md:col-4">
          <label for="filterType" class="trazza-label">{{ t('fields.cargo-type') }}</label>
          <pv-select input-id="filterType" v-model="filters.cargoType" :options="cargoTypeOptions" option-label="label" option-value="value" class="w-full"/>
        </div>
        <div class="col-12 md:col-4">
          <label for="filterDetour" class="trazza-label">{{ t('fields.max-detour') }}</label>
          <pv-select input-id="filterDetour" v-model="filters.maxDetourKm" :options="detourOptions" option-label="label" option-value="value" class="w-full"/>
        </div>
        <div class="col-12 md:col-4">
          <label for="filterSort" class="trazza-label">{{ t('filters.sort-by') }}</label>
          <pv-select input-id="filterSort" v-model="filters.sortBy" :options="sortOptions" option-label="label" option-value="value" class="w-full"/>
        </div>
      </div>
      <p class="font-semibold">{{ t('load-suggestions.count', { count: suggestions.length }) }}</p>
      <div v-if="suggestions.length" class="grid">
        <div v-for="suggestion in suggestions" :key="suggestion.request.id" class="col-12 xl:col-6">
          <load-suggestion-card
              :suggestion="suggestion"
              :merchant-name="profileStore.displayNameOf(suggestion.request.merchantId)"
              :reputation="reputationStore.summaryFor(suggestion.request.merchantId)"
              :verified="profileStore.getMerchantProfileByUserId(suggestion.request.merchantId)?.verified ?? false"
              @view="viewDetail"/>
        </div>
      </div>
      <div v-else class="trazza-panel text-center py-6">
        <i class="pi pi-inbox text-4xl text-primary"></i>
        <p class="font-semibold mb-1">{{ t('load-suggestions.empty-title') }}</p>
        <p class="trazza-muted mt-0">{{ t('load-suggestions.empty-content') }}</p>
      </div>
    </template>
  </div>
</template>
