<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useProfileStore from "../../application/profile.store.js";
import VehicleCard from "../components/vehicle-card.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const profileStore = useProfileStore();
const { showError, showSuccess } = useErrorHandler();

const vehicles = computed(() => profileStore.currentCarrierProfile.value?.vehicles ?? []);

/**
 * Navigates to the vehicle creation form.
 */
const navigateToNew = () => router.push({ name: 'iam-vehicle-new' });

/**
 * Navigates to the vehicle edition form.
 * @param {Object} vehicle - Vehicle to edit.
 */
const navigateToEdit = (vehicle) => router.push({ name: 'iam-vehicle-edit', params: { id: vehicle.id } });

/**
 * Activates or deactivates a vehicle.
 * @param {Object} vehicle - Vehicle to toggle.
 */
const toggleVehicle = async (vehicle) => {
  try {
    await profileStore.toggleVehicle(vehicle.id);
  } catch (error) {
    showError(error);
  }
};

/**
 * Asks for confirmation and removes a vehicle.
 * @param {Object} vehicle - Vehicle to remove.
 */
const confirmRemove = (vehicle) => {
  confirm.require({
    message: t('vehicle.confirm-delete', { plate: vehicle.plate.value }),
    header: t('actions.confirm-deletion'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('actions.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('actions.delete'), severity: 'danger' },
    accept: async () => {
      try {
        await profileStore.removeVehicle(vehicle.id);
        showSuccess('vehicle.deleted');
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
        <h1>{{ t('vehicle.list-title') }}</h1>
        <p>{{ t('vehicle.list-subtitle') }}</p>
      </div>
      <pv-button :label="t('vehicle.add')" icon="pi pi-plus" @click="navigateToNew"/>
    </div>
    <div v-if="vehicles.length" class="grid">
      <div v-for="vehicle in vehicles" :key="vehicle.id" class="col-12 md:col-6 xl:col-4">
        <vehicle-card :vehicle="vehicle" @edit="navigateToEdit" @toggle="toggleVehicle" @remove="confirmRemove"/>
      </div>
    </div>
    <div v-else class="trazza-panel text-center py-6">
      <i class="pi pi-truck text-4xl text-primary"></i>
      <p class="font-semibold mb-1">{{ t('vehicle.empty-title') }}</p>
      <p class="trazza-muted mt-0">{{ t('vehicle.empty-content') }}</p>
      <pv-button :label="t('vehicle.add')" icon="pi pi-plus" @click="navigateToNew"/>
    </div>
  </div>
</template>
