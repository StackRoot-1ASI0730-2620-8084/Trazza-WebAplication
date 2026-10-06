<script setup>
import {computed, onMounted, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import useBillingStore from "../../../billing/application/billing.store.js";
import {CargoType} from "../../domain/model/cargo-type.value-object.js";
import {RouteMatchingService} from "../../domain/services/route-matching.service.js";
import {Address} from "../../../shared/domain/model/address.value-object.js";
import AddressField from "../../../shared/presentation/components/address-field.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatNumber, halfHourSlots, toIsoDate} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useMatchmakingStore();
const billingStore = useBillingStore();
const { describeError, showSuccess } = useErrorHandler();
const errorMessage = ref('');
const saving = ref(false);
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const isEdit = computed(() => !!route.params.id);
const form = reactive({
  pickup: { street: '', district: null },
  delivery: { street: '', district: null },
  pickupDate: tomorrow,
  pickupWindow: { start: '10:00', end: '12:00' },
  cargoType: 'general',
  weightKg: null,
  volumeM3: null,
  description: '',
  offeredRate: null
});

const timeSlots = halfHourSlots();
const cargoTypeOptions = computed(() => CargoType.VALUES.map(value => ({ value, label: t(`cargo-types.${value}`) })));
const limitReached = computed(() => !billingStore.canPublish(store.publicationsThisMonth.value));
const estimation = computed(() => {
  try {
    return RouteMatchingService.estimateTrip(new Address(form.pickup), new Address(form.delivery));
  } catch (error) {
    return null;
  }
});

/**
 * Loads the draft being edited into the form.
 */
const loadRequest = () => {
  if (!isEdit.value) return;
  const request = store.getFreightRequestById(route.params.id);
  if (!request) return;
  Object.assign(form, {
    pickup: { street: request.pickup.street, district: request.pickup.district },
    delivery: { street: request.delivery.street, district: request.delivery.district },
    pickupDate: new Date(`${request.pickupDate}T00:00:00`),
    pickupWindow: { start: request.pickupWindow.start, end: request.pickupWindow.end },
    cargoType: request.cargo.type.value,
    weightKg: request.cargo.weightKg,
    volumeM3: request.cargo.volumeM3,
    description: request.cargo.description,
    offeredRate: request.offeredRate?.amount ?? null
  });
};

onMounted(loadRequest);
watch(() => store.state.loaded, loadRequest);

/**
 * Saves the request as draft or publishes it.
 * @param {boolean} publish - True to publish.
 */
const save = async (publish) => {
  errorMessage.value = '';
  saving.value = true;
  try {
    const request = await store.saveFreightRequest(
      { ...form, pickupDate: form.pickupDate ? toIsoDate(form.pickupDate) : '' },
      publish,
      isEdit.value ? Number(route.params.id) : null
    );
    showSuccess(publish ? 'freight-request.published' : 'freight-request.draft-saved');
    if (publish) router.push({ name: 'matchmaking-find-carriers', query: { requestId: request.id } });
    else router.push({ name: 'matchmaking-freight-requests' });
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
      <h1>{{ isEdit ? t('freight-request.edit-title') : t('freight-request.new-title') }}</h1>
      <p>{{ t('freight-request.new-subtitle') }}</p>
    </div>
    <pv-message v-if="limitReached" severity="warn" class="mb-3">
      {{ t('billing.limit-reached') }}
      <router-link :to="{ name: 'billing-plan' }" class="font-semibold underline ml-1">{{ t('billing.upgrade') }}</router-link>
    </pv-message>
    <div class="grid">
      <form class="col-12 lg:col-8" @submit.prevent="save(true)">
        <div class="trazza-panel flex flex-column gap-3">
          <div class="trazza-overline">{{ t('freight-request.pickup-delivery') }}</div>
          <address-field id="pickup" v-model="form.pickup" :label="t('fields.pickup-address')"/>
          <address-field id="delivery" v-model="form.delivery" :label="t('fields.delivery-address')"/>
          <div class="grid">
            <div class="col-12 md:col-6">
              <label for="pickupDate" class="trazza-label">{{ t('fields.pickup-date') }} *</label>
              <pv-date-picker input-id="pickupDate" v-model="form.pickupDate" :min-date="today" date-format="dd/mm/yy" show-icon fluid/>
            </div>
            <div class="col-6 md:col-3">
              <label for="windowStart" class="trazza-label">{{ t('fields.from') }} *</label>
              <pv-select input-id="windowStart" v-model="form.pickupWindow.start" :options="timeSlots" class="w-full"/>
            </div>
            <div class="col-6 md:col-3">
              <label for="windowEnd" class="trazza-label">{{ t('fields.to') }} *</label>
              <pv-select input-id="windowEnd" v-model="form.pickupWindow.end" :options="timeSlots" class="w-full"/>
            </div>
            <div class="col-12 md:col-4">
              <label for="cargoType" class="trazza-label">{{ t('fields.cargo-type') }} *</label>
              <pv-select input-id="cargoType" v-model="form.cargoType" :options="cargoTypeOptions" option-label="label" option-value="value" class="w-full"/>
            </div>
            <div class="col-6 md:col-4">
              <label for="weight" class="trazza-label">{{ t('fields.weight-kg') }} *</label>
              <pv-input-number input-id="weight" v-model="form.weightKg" :min="0" suffix=" kg" fluid/>
            </div>
            <div class="col-6 md:col-4">
              <label for="volume" class="trazza-label">{{ t('fields.volume-m3') }}</label>
              <pv-input-number input-id="volume" v-model="form.volumeM3" :min="0" :max-fraction-digits="1" suffix=" m³" fluid/>
            </div>
            <div class="col-12">
              <label for="description" class="trazza-label">{{ t('fields.description') }}</label>
              <pv-textarea id="description" v-model="form.description" rows="3" auto-resize class="w-full" :placeholder="t('freight-request.description-placeholder')"/>
            </div>
            <div class="col-12 md:col-6">
              <label for="rate" class="trazza-label">{{ t('fields.offered-rate') }}</label>
              <pv-input-number input-id="rate" v-model="form.offeredRate" :min="0" mode="currency" currency="PEN" locale="es-PE" fluid/>
              <small class="trazza-muted">{{ t('freight-request.rate-hint') }}</small>
            </div>
          </div>
          <pv-message v-if="errorMessage" severity="error" size="small">{{ errorMessage }}</pv-message>
          <div class="flex flex-wrap gap-2">
            <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="router.push({ name: 'matchmaking-freight-requests' })"/>
            <pv-button :label="t('freight-request.save-draft')" severity="secondary" :loading="saving" @click="save(false)"/>
            <pv-button type="submit" :label="t('freight-request.publish')" icon="pi pi-send" :loading="saving"/>
          </div>
        </div>
      </form>
      <div class="col-12 lg:col-4">
        <div class="trazza-panel flex flex-column gap-2">
          <div class="trazza-overline">{{ t('freight-request.summary') }}</div>
          <div class="trazza-route text-lg">{{ form.pickup.district ?? '—' }} → {{ form.delivery.district ?? '—' }}</div>
          <div class="text-sm">{{ estimation ? `${estimation.distanceKm} km · ${estimation.durationMinutes} min` : '—' }}</div>
          <div class="text-sm">{{ formatNumber(form.weightKg) }} kg · {{ formatNumber(form.volumeM3) }} m³ · {{ t(`cargo-types.${form.cargoType}`) }}</div>
          <div class="text-sm">{{ formatDate(form.pickupDate, locale) }} · {{ form.pickupWindow.start }} – {{ form.pickupWindow.end }}</div>
          <div class="text-xl font-bold mt-2">{{ form.offeredRate ? `S/ ${formatNumber(form.offeredRate)}` : t('load.open-rate') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
