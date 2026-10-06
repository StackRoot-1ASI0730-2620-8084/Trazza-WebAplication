<script setup>
import {computed, onMounted, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useProfileStore from "../../application/profile.store.js";
import {Vehicle} from "../../domain/model/vehicle.entity.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const profileStore = useProfileStore();
const { describeError, showSuccess } = useErrorHandler();
const errorMessage = ref('');
const saving = ref(false);

const isEdit = computed(() => !!route.params.id);
const form = reactive({ id: null, plate: '', brandModel: '', bodyType: 'closed_van', capacityKg: null, volumeM3: null, active: true });
const bodyTypes = computed(() => Vehicle.BODY_TYPES.map(value => ({ value, label: t(`body-types.${value}`) })));

/**
 * Loads the vehicle being edited into the form.
 */
const loadVehicle = () => {
  if (!isEdit.value) return;
  const vehicle = profileStore.currentCarrierProfile.value?.findVehicle(route.params.id);
  if (!vehicle) return;
  Object.assign(form, {
    id: vehicle.id,
    plate: vehicle.plate.value,
    brandModel: vehicle.brandModel,
    bodyType: vehicle.bodyType,
    capacityKg: vehicle.capacity.weightKg,
    volumeM3: vehicle.capacity.volumeM3,
    active: vehicle.active
  });
};

onMounted(loadVehicle);
watch(() => profileStore.currentCarrierProfile.value, loadVehicle);

/**
 * Saves the vehicle through the profile store.
 */
const saveVehicle = async () => {
  errorMessage.value = '';
  saving.value = true;
  try {
    if (isEdit.value) await profileStore.updateVehicle(form); else await profileStore.addVehicle(form);
    showSuccess('vehicle.saved');
    navigateBack();
  } catch (error) {
    errorMessage.value = describeError(error);
  } finally {
    saving.value = false;
  }
};

/**
 * Navigates back to the vehicle list.
 */
const navigateBack = () => router.push({ name: 'iam-vehicles' });
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ isEdit ? t('vehicle.edit-title') : t('vehicle.new-title') }}</h1>
      <p>{{ t('vehicle.form-subtitle') }}</p>
    </div>
    <form class="trazza-panel" style="max-width: 44rem" @submit.prevent="saveVehicle">
      <div class="grid">
        <div class="col-12 md:col-4">
          <label for="plate" class="trazza-label">{{ t('fields.plate') }} *</label>
          <pv-input-text id="plate" v-model="form.plate" placeholder="ABC-123" class="w-full"/>
        </div>
        <div class="col-12 md:col-4">
          <label for="brandModel" class="trazza-label">{{ t('fields.brand-model') }} *</label>
          <pv-input-text id="brandModel" v-model="form.brandModel" :placeholder="t('vehicle.brand-placeholder')" class="w-full"/>
        </div>
        <div class="col-12 md:col-4">
          <label for="bodyType" class="trazza-label">{{ t('fields.body-type') }} *</label>
          <pv-select input-id="bodyType" v-model="form.bodyType" :options="bodyTypes" option-label="label" option-value="value" class="w-full"/>
        </div>
        <div class="col-12 md:col-6">
          <label for="capacityKg" class="trazza-label">{{ t('fields.capacity-kg') }} *</label>
          <pv-input-number input-id="capacityKg" v-model="form.capacityKg" :min="0" placeholder="3500" suffix=" kg" class="w-full"/>
        </div>
        <div class="col-12 md:col-6">
          <label for="volumeM3" class="trazza-label">{{ t('fields.volume-m3') }} *</label>
          <pv-input-number input-id="volumeM3" v-model="form.volumeM3" :min="0" :max-fraction-digits="1" placeholder="18" suffix=" m³" class="w-full"/>
        </div>
        <div class="col-12 flex align-items-center gap-2">
          <pv-toggle-switch v-model="form.active" input-id="active"/>
          <label for="active">{{ t('vehicle.available-for-routes') }}</label>
        </div>
      </div>
      <pv-message v-if="errorMessage" severity="error" size="small" class="mt-2">{{ errorMessage }}</pv-message>
      <div class="flex gap-2 mt-3">
        <pv-button type="submit" :label="t('vehicle.save')" icon="pi pi-save" :loading="saving"/>
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="navigateBack"/>
      </div>
    </form>
  </div>
</template>
