<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useIamStore from "../../application/iam.store.js";
import useProfileStore from "../../application/profile.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {initialsOf} from "../../../shared/presentation/formatters.js";

const { t } = useI18n();
const iamStore = useIamStore();
const profileStore = useProfileStore();
const reputationStore = useReputationStore();
const { describeError, showSuccess } = useErrorHandler();
const errorMessage = ref('');
const saving = ref(false);

const user = computed(() => iamStore.state.currentUser);
const isCarrier = computed(() => iamStore.isCarrier.value);
const carrierProfile = computed(() => profileStore.currentCarrierProfile.value);
const merchantProfile = computed(() => profileStore.currentMerchantProfile.value);
const verified = computed(() => (isCarrier.value ? carrierProfile.value?.verified : merchantProfile.value?.verified) ?? false);
const documentLabel = computed(() => isCarrier.value ? t('fields.dni') : t('fields.ruc'));
const documentValue = computed(() => isCarrier.value ? carrierProfile.value?.dni.value : merchantProfile.value?.ruc.value);
const reputation = computed(() => reputationStore.summaryFor(iamStore.currentUserId.value));

const form = reactive({ fullName: '', businessName: '', phone: '' });

watch([user, merchantProfile], () => {
  form.fullName = user.value?.fullName ?? '';
  form.phone = user.value?.phone.formatted ?? '';
  form.businessName = merchantProfile.value?.businessName ?? '';
}, { immediate: true });

/**
 * Saves the profile through the profile store.
 */
const saveProfile = async () => {
  errorMessage.value = '';
  saving.value = true;
  try {
    await profileStore.updateCurrentProfile(form);
    showSuccess('profile.saved');
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
      <h1>{{ t('profile.title') }}</h1>
      <p>{{ t('profile.subtitle') }}</p>
    </div>
    <div class="grid">
      <div class="col-12 lg:col-4">
        <div class="trazza-panel flex flex-column align-items-center text-center gap-2">
          <pv-avatar :label="initialsOf(user?.fullName)" size="xlarge" shape="circle" class="profile-avatar"/>
          <div class="font-bold text-lg">{{ isCarrier ? user?.fullName : merchantProfile?.businessName }}</div>
          <div class="trazza-muted text-sm">{{ user?.email.value }}</div>
          <pv-tag :value="verified ? t('profile.verified') : t('profile.pending-verification')" :severity="verified ? 'success' : 'warn'" :icon="verified ? 'pi pi-verified' : 'pi pi-clock'"/>
          <pv-divider/>
          <div class="flex justify-content-around w-full">
            <div>
              <div class="trazza-kpi">{{ reputation.count ? reputation.average.toFixed(1) : '—' }}</div>
              <div class="text-sm trazza-muted">{{ t('profile.rating') }}</div>
            </div>
            <div>
              <div class="trazza-kpi">{{ reputation.count }}</div>
              <div class="text-sm trazza-muted">{{ t('profile.ratings-count') }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 lg:col-8">
        <form class="trazza-panel" @submit.prevent="saveProfile">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label for="fullName" class="trazza-label">{{ isCarrier ? t('fields.full-name') : t('fields.contact-name') }} *</label>
              <pv-input-text id="fullName" v-model="form.fullName" class="w-full"/>
            </div>
            <div v-if="!isCarrier" class="col-12 md:col-6">
              <label for="businessName" class="trazza-label">{{ t('fields.business-name') }} *</label>
              <pv-input-text id="businessName" v-model="form.businessName" class="w-full"/>
            </div>
            <div class="col-12 md:col-6">
              <label for="phone" class="trazza-label">{{ t('fields.phone') }} *</label>
              <pv-input-text id="phone" v-model="form.phone" class="w-full"/>
            </div>
            <div class="col-12 md:col-6">
              <label for="email" class="trazza-label">{{ t('fields.email') }}</label>
              <pv-input-text id="email" :model-value="user?.email.value" disabled class="w-full"/>
            </div>
            <div class="col-12 md:col-6">
              <label for="document" class="trazza-label">{{ documentLabel }}</label>
              <pv-input-text id="document" :model-value="documentValue" disabled class="w-full"/>
            </div>
          </div>
          <pv-message v-if="errorMessage" severity="error" size="small" class="mt-2">{{ errorMessage }}</pv-message>
          <pv-button type="submit" :label="t('actions.save-changes')" icon="pi pi-save" :loading="saving" class="mt-3"/>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-avatar {
  background: var(--trazza-soft);
  color: var(--trazza-accent);
  font-weight: 700;
}
</style>
