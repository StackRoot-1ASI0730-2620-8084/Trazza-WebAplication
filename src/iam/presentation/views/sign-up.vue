<script setup>
import {computed, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useIamStore from "../../application/iam.store.js";
import {SignUpCommand} from "../../domain/commands/sign-up.command.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();
const { describeError } = useErrorHandler();
const errorMessage = ref('');

const form = reactive({
  role: route.query.role === 'merchant' ? 'merchant' : 'carrier',
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  documentNumber: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false
});

const isMerchant = computed(() => form.role === 'merchant');

const roles = [
  { value: 'carrier', title: 'sign-up.carrier-title', description: 'sign-up.carrier-description', icon: 'pi pi-truck' },
  { value: 'merchant', title: 'sign-up.merchant-title', description: 'sign-up.merchant-description', icon: 'pi pi-shop' }
];

/**
 * Builds a sign-up command from the form and executes the sign-up use case.
 */
const performSignUp = async () => {
  errorMessage.value = '';
  try {
    await iamStore.signUp(new SignUpCommand(form));
    router.push({ name: 'dashboard' });
  } catch (error) {
    errorMessage.value = describeError(error);
  }
};
</script>

<template>
  <div class="trazza-panel w-full shadow-2" style="max-width: 40rem">
    <h1 class="text-2xl font-bold m-0">{{ t('sign-up.title') }}</h1>
    <p class="trazza-muted mt-1 mb-4">{{ t('sign-up.subtitle') }}</p>
    <form class="flex flex-column gap-3" @submit.prevent="performSignUp">
      <div class="grid m-0">
        <div v-for="role in roles" :key="role.value" class="col-12 md:col-6 p-1">
          <label :for="`role-${role.value}`" class="role-option flex gap-3 p-3 cursor-pointer" :class="{ 'role-selected': form.role === role.value }">
            <pv-radio-button v-model="form.role" :input-id="`role-${role.value}`" name="role" :value="role.value"/>
            <div>
              <div class="font-semibold"><i :class="role.icon" class="mr-2"></i>{{ t(role.title) }}</div>
              <div class="text-sm trazza-muted">{{ t(role.description) }}</div>
            </div>
          </label>
        </div>
      </div>
      <div class="grid">
        <div class="col-12" :class="{ 'md:col-6': isMerchant }">
          <label for="fullName" class="trazza-label">{{ t('fields.full-name') }} *</label>
          <pv-input-text id="fullName" v-model="form.fullName" class="w-full"/>
        </div>
        <div v-if="isMerchant" class="col-12 md:col-6">
          <label for="businessName" class="trazza-label">{{ t('fields.business-name') }} *</label>
          <pv-input-text id="businessName" v-model="form.businessName" class="w-full"/>
        </div>
        <div class="col-12 md:col-6">
          <label for="email" class="trazza-label">{{ t('fields.email') }} *</label>
          <pv-input-text id="email" v-model="form.email" type="email" class="w-full"/>
        </div>
        <div class="col-12 md:col-6">
          <label for="phone" class="trazza-label">{{ t('fields.phone') }} *</label>
          <pv-input-text id="phone" v-model="form.phone" placeholder="+51 9__ ___ ___" class="w-full"/>
        </div>
        <div class="col-12">
          <label for="document" class="trazza-label">{{ isMerchant ? t('fields.ruc') : t('fields.dni') }} *</label>
          <pv-input-text id="document" v-model="form.documentNumber" :placeholder="isMerchant ? t('sign-up.ruc-placeholder') : t('sign-up.dni-placeholder')" class="w-full"/>
          <small class="trazza-muted">{{ isMerchant ? t('sign-up.ruc-hint') : t('sign-up.dni-hint') }}</small>
        </div>
        <div class="col-12 md:col-6">
          <label for="password" class="trazza-label">{{ t('fields.password') }} *</label>
          <pv-password input-id="password" v-model="form.password" toggle-mask fluid :prompt-label="t('sign-up.password-prompt')" :weak-label="t('sign-up.password-weak')" :medium-label="t('sign-up.password-medium')" :strong-label="t('sign-up.password-strong')"/>
        </div>
        <div class="col-12 md:col-6">
          <label for="confirmPassword" class="trazza-label">{{ t('fields.confirm-password') }} *</label>
          <pv-password input-id="confirmPassword" v-model="form.confirmPassword" :feedback="false" toggle-mask fluid/>
        </div>
      </div>
      <div class="flex align-items-center gap-2">
        <pv-checkbox v-model="form.acceptedTerms" input-id="terms" binary/>
        <label for="terms" class="text-sm">{{ t('sign-up.accept-terms') }}</label>
      </div>
      <pv-message v-if="errorMessage" severity="error" size="small">{{ errorMessage }}</pv-message>
      <pv-button type="submit" :label="t('sign-up.submit')" :loading="iamStore.state.processing" class="w-full"/>
    </form>
    <p class="text-sm text-center mt-4 mb-0">
      {{ t('sign-up.have-account') }}
      <router-link :to="{ name: 'iam-sign-in' }" class="text-primary font-semibold">{{ t('sign-in.submit') }}</router-link>
    </p>
  </div>
</template>

<style scoped>
.role-option {
  border: 1px solid var(--trazza-line);
  border-radius: 10px;
  height: 100%;
}

.role-selected {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}
</style>
