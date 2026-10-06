<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import useBillingStore from "../../../billing/application/billing.store.js";
import {ReturnRoute} from "../../domain/model/return-route.entity.js";
import {CargoType} from "../../domain/model/cargo-type.value-object.js";
import {RouteMatchingService} from "../../domain/services/route-matching.service.js";
import {Address} from "../../../shared/domain/model/address.value-object.js";
import AddressField from "../../../shared/presentation/components/address-field.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatNumber, halfHourSlots, toIsoDate} from "../../../shared/presentation/formatters.js";

const { t } = useI18n();
const router = useRouter();
const store = useMatchmakingStore();
const profileStore = useProfileStore();
const billingStore = useBillingStore();
const { describeError, showSuccess } = useErrorHandler();
const errorMessage = ref('');
const saving = ref(false);
const today = new Date();
today.setHours(0, 0, 0, 0);

const form = reactive({
  origin: { street: '', district: null },
  destination: { street: '', district: null },
  departureDate: new Date(today),
  timeWindow: { start: '16:00', end: '18:00' },
  vehicleId: null,
  availableWeightKg: null,
  availableVolumeM3: null,
  maxDetourKm: 15,
  acceptedCargoTypes: ['general']
});

const vehicles = computed(() => profileStore.currentCarrierProfile.value?.activeVehicles ?? []);
const selectedVehicle = computed(() => vehicles.value.find(vehicle => vehicle.id === form.vehicleId));
const vehicleOptions = computed(() => vehicles.value.map(vehicle => ({
  value: vehicle.id,
  label: `${vehicle.label} · ${formatNumber(vehicle.capacity.weightKg)} kg · ${formatNumber(vehicle.capacity.volumeM3)} m³`
})));
const timeSlots = halfHourSlots();
const detourOptions = ReturnRoute.DETOUR_OPTIONS.map(value => ({ value, label: `${value} km` }));
const cargoTypeOptions = computed(() => CargoType.VALUES.map(value => ({ value, label: t(`cargo-types.${value}`) })));
const exceedsVehicle = computed(() => selectedVehicle.value && form.availableWeightKg > selectedVehicle.value.capacity.weightKg);
const limitReached = computed(() => !billingStore.canPublish(store.publicationsThisMonth.value));

const estimation = computed(() => {
  try {
    return RouteMatchingService.estimateTrip(new Address(form.origin), new Address(form.destination));
  } catch (error) {
    return null;
  }
});

watch(vehicles, list => {
  if (!form.vehicleId && list.length) form.vehicleId = list[0].id;
}, { immediate: true });

watch(selectedVehicle, vehicle => {
  if (vehicle && form.availableWeightKg === null) {
    form.availableWeightKg = vehicle.capacity.weightKg;
    form.availableVolumeM3 = vehicle.capacity.volumeM3;
  }
}, { immediate: true });

/**
 * Publishes the return route through the matchmaking store.
 */
const publishRoute = async () => {
  errorMessage.value = '';
  saving.value = true;
  try {
    const route = await store.publishReturnRoute({ ...form, departureDate: form.departureDate ? toIsoDate(form.departureDate) : '' });
    showSuccess('return-route.published');
    router.push({ name: 'matchmaking-load-suggestions', query: { routeId: route.id } });
  } catch (error) {
    errorMessage.value = describeError(error);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('return-route.new-title') }}</h1>
      <p>{{ t('return-route.new-subtitle') }}</p>
    </div>
    <pv-message v-if="!vehicles.length" severity="warn" class="mb-3">
      {{ t('return-route.no-vehicles') }}
      <router-link :to="{ name: 'iam-vehicle-new' }" class="font-semibold underline ml-1">{{ t('vehicle.add') }}</router-link>
    </pv-message>
    <pv-message v-if="limitReached" severity="warn" class="mb-3">
      {{ t('billing.limit-reached') }}
      <router-link :to="{ name: 'billing-plan' }" class="font-semibold underline ml-1">{{ t('billing.upgrade') }}</router-link>
    </pv-message>
    <div class="grid">
      <form class="col-12 lg:col-8" @submit.prevent="publishRoute">
        <div class="trazza-panel flex flex-column gap-3">
          <address-field id="origin" v-model="form.origin" :label="t('return-route.origin')"/>
          <address-field id="destination" v-model="form.destination" :label="t('return-route.destination')"/>
          <div class="grid">
            <div class="col-12 md:col-6">
              <label for="departureDate" class="trazza-label">{{ t('fields.departure-date') }} *</label>
              <pv-date-picker input-id="departureDate" v-model="form.departureDate" :min-date="today" date-format="dd/mm/yy" show-icon fluid/>
            </div>
            <div class="col-6 md:col-3">
              <label for="windowStart" class="trazza-label">{{ t('fields.from') }} *</label>
              <pv-select input-id="windowStart" v-model="form.timeWindow.start" :options="timeSlots" class="w-full"/>
            </div>
            <div class="col-6 md:col-3">
              <label for="windowEnd" class="trazza-label">{{ t('fields.to') }} *</label>
              <pv-select input-id="windowEnd" v-model="form.timeWindow.end" :options="timeSlots" class="w-full"/>
            </div>
            <div class="col-12">
              <label for="vehicle" class="trazza-label">{{ t('fields.vehicle') }} *</label>
              <pv-select input-id="vehicle" v-model="form.vehicleId" :options="vehicleOptions" option-label="label" option-value="value" class="w-full"/>
            </div>
            <div class="col-12 md:col-6">
              <label for="capacity" class="trazza-label">{{ t('fields.available-capacity') }} *</label>
              <pv-input-number input-id="capacity" v-model="form.availableWeightKg" :min="0" suffix=" kg" fluid :invalid="exceedsVehicle"/>
              <small v-if="exceedsVehicle" class="text-red-600">{{ t('validation.capacity-exceeds-vehicle') }} ({{ formatNumber(selectedVehicle.capacity.weightKg) }} kg)</small>
            </div>
            <div class="col-12 md:col-6">
              <label for="volume" class="trazza-label">{{ t('fields.available-volume') }}</label>
              <pv-input-number input-id="volume" v-model="form.availableVolumeM3" :min="0" :max-fraction-digits="1" suffix=" m³" fluid/>
            </div>
            <div class="col-12 md:col-4">
              <label for="detour" class="trazza-label">{{ t('fields.max-detour') }} *</label>
              <pv-select input-id="detour" v-model="form.maxDetourKm" :options="detourOptions" option-label="label" option-value="value" class="w-full"/>
            </div>
            <div class="col-12 md:col-8">
              <span class="trazza-label">{{ t('fields.cargo-types') }} *</span>
              <pv-select-button v-model="form.acceptedCargoTypes" :options="cargoTypeOptions" option-label="label" option-value="value" multiple class="flex-wrap trazza-pills"/>
            </div>
          </div>
          <pv-message v-if="errorMessage" severity="error" size="small">{{ errorMessage }}</pv-message>
          <div class="flex gap-2">
            <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="router.push({ name: 'matchmaking-return-routes' })"/>
            <pv-button type="submit" :label="t('return-route.publish')" icon="pi pi-send" :loading="saving" :disabled="!vehicles.length"/>
          </div>
        </div>
      </form>
      <div class="col-12 lg:col-4">
        <div class="trazza-panel">
          <div class="trazza-overline mb-2">{{ t('return-route.preview') }}</div>
          <div class="route-preview border-round flex flex-column justify-content-center align-items-center gap-2 p-3">
            <div class="flex align-items-center gap-2 font-semibold text-center">
              <span>{{ form.origin.district ?? '—' }}</span>
              <i class="pi pi-arrow-right text-primary"></i>
              <span>{{ form.destination.district ?? '—' }}</span>
            </div>
            <i class="pi pi-map text-4xl text-primary"></i>
          </div>
          <div class="mt-3">
            <div class="trazza-label mb-1">{{ t('return-route.estimated-distance') }}</div>
            <div class="text-xl font-bold">{{ estimation ? `${estimation.distanceKm} km · ${estimation.durationMinutes} min` : '—' }}</div>
            <p class="text-sm trazza-muted mb-0">{{ t('return-route.preview-hint', { km: form.maxDetourKm }) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-preview {
  min-height: 9rem;
  background-color: var(--trazza-map);
  background-image: linear-gradient(#ffffff 3px, transparent 3px), linear-gradient(90deg, #ffffff 3px, transparent 3px);
  background-size: 48px 48px;
}
</style>
