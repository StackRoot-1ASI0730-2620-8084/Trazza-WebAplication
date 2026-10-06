<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useBillingStore from "../../application/billing.store.js";
import useMatchmakingStore from "../../../matchmaking/application/matchmaking.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import {SubscriptionPlan} from "../../domain/model/subscription-plan.value-object.js";
import ReceiptDialog from "../components/receipt-dialog.vue";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const billingStore = useBillingStore();
const matchmakingStore = useMatchmakingStore();
const iamStore = useIamStore();
const profileStore = useProfileStore();
const { describeError, showSuccess } = useErrorHandler();
const checkoutDialog = ref(false);
const receiptDialog = ref(false);
const errorMessage = ref('');
const selectedReceipt = ref(null);
const selectedTransaction = ref(null);

const plan = computed(() => billingStore.currentPlan.value);
const proPrice = new SubscriptionPlan(SubscriptionPlan.PRO).price;
const used = computed(() => matchmakingStore.publicationsThisMonth.value);
const usagePercent = computed(() => plan.value.monthlyPublications ? Math.min(100, Math.round(used.value / plan.value.monthlyPublications * 100)) : 100);
const publicationLabel = computed(() => iamStore.isCarrier.value ? t('billing.routes') : t('billing.requests'));
const renewal = computed(() => {
  if (billingStore.activeSubscription.value) return billingStore.activeSubscription.value.periodEnd;
  const next = new Date();
  return new Date(next.getFullYear(), next.getMonth() + 1, 1).toLocaleDateString('en-CA');
});

const form = reactive({ cardNumber: '', holderName: '', expiry: '', receiptType: 'boleta', customerName: '', customerDocument: '' });
const receiptTypes = computed(() => [
  { value: 'boleta', label: t('receipt.types.boleta') },
  { value: 'factura', label: t('receipt.types.factura') }
]);

watch(checkoutDialog, open => {
  if (!open) return;
  errorMessage.value = '';
  const merchant = profileStore.currentMerchantProfile.value;
  const carrier = profileStore.currentCarrierProfile.value;
  form.receiptType = merchant ? 'factura' : 'boleta';
  form.customerName = merchant?.businessName ?? carrier?.fullName ?? '';
  form.customerDocument = merchant?.ruc.value ?? carrier?.dni.value ?? '';
  form.holderName = iamStore.state.currentUser?.fullName ?? '';
});

/**
 * Executes the upgrade to the Pro plan.
 */
const upgrade = async () => {
  errorMessage.value = '';
  try {
    const result = await billingStore.upgradeToPro(form);
    checkoutDialog.value = false;
    showSuccess('billing.upgraded');
    openReceipt(result.transaction);
  } catch (error) {
    errorMessage.value = describeError(error);
  }
};

/**
 * Opens the receipt of a transaction.
 * @param {Object} transaction - Paid transaction.
 */
const openReceipt = (transaction) => {
  selectedTransaction.value = transaction;
  selectedReceipt.value = billingStore.getReceiptByTransactionId(transaction.id) ?? null;
  receiptDialog.value = !!selectedReceipt.value;
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('billing.title') }}</h1>
      <p>{{ t('billing.subtitle') }}</p>
    </div>
    <div class="grid">
      <div class="col-12 md:col-6">
        <div class="trazza-panel h-full">
          <div class="trazza-overline mb-2">{{ t('billing.current-plan') }}</div>
          <div class="text-2xl font-bold mb-2">{{ t(`plans.${plan.code}`) }}</div>
          <template v-if="plan.monthlyPublications">
            <div class="text-sm mb-1">{{ t('billing.usage', { used, limit: plan.monthlyPublications, item: publicationLabel }) }}</div>
            <pv-progress-bar :value="usagePercent" :show-value="false" style="height: 0.5rem"/>
          </template>
          <div v-else class="text-sm">{{ t('billing.unlimited', { item: publicationLabel }) }}</div>
          <div class="text-sm trazza-muted mt-3">{{ t('billing.renews', { date: formatDate(renewal, locale) }) }}</div>
        </div>
      </div>
      <div class="col-12 md:col-6">
        <div class="trazza-panel h-full pro-card flex flex-column gap-2">
          <div class="trazza-overline">{{ t('billing.upgrade-overline') }}</div>
          <div class="text-2xl font-bold">{{ t('plans.pro') }} · {{ proPrice.formatted }} <span class="text-base font-normal">/ {{ t('billing.month') }}</span></div>
          <ul class="list-none p-0 m-0 flex flex-column gap-1 text-sm">
            <li><i class="pi pi-check text-primary mr-2"></i>{{ t('billing.benefit-unlimited') }}</li>
            <li><i class="pi pi-check text-primary mr-2"></i>{{ t('billing.benefit-priority') }}</li>
            <li><i class="pi pi-check text-primary mr-2"></i>{{ t('billing.benefit-vehicles') }}</li>
          </ul>
          <pv-button v-if="plan.isFree" :label="t('billing.upgrade')" icon="pi pi-bolt" class="align-self-start mt-auto" @click="checkoutDialog = true"/>
          <pv-tag v-else :value="t('billing.active')" severity="success" class="align-self-start mt-auto"/>
        </div>
      </div>
      <div class="col-12">
        <div class="trazza-panel flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div class="trazza-overline mb-1">{{ t('billing.payment-method') }}</div>
            <div>{{ billingStore.lastPaymentMethod.value?.label ?? t('billing.no-payment-method') }} <span class="trazza-muted text-sm">· {{ t('billing.gateway') }}</span></div>
          </div>
          <pv-button :label="t('billing.change')" text @click="checkoutDialog = true" :disabled="!plan.isFree"/>
        </div>
      </div>
      <div class="col-12">
        <div class="trazza-panel p-0 overflow-hidden">
          <div class="px-3 pt-3 font-semibold">{{ t('billing.history') }}</div>
          <pv-data-table :value="billingStore.myTransactions.value" data-key="id" striped-rows>
            <template #empty>
              <div class="text-center py-4 trazza-muted">{{ t('billing.no-payments') }}</div>
            </template>
            <pv-column :header="t('columns.date')">
              <template #body="{ data }">{{ formatDate(data.createdAt, locale) }}</template>
            </pv-column>
            <pv-column :header="t('columns.plan')">
              <template #body="{ data }">{{ t(`plans.${data.plan.code}`) }}</template>
            </pv-column>
            <pv-column :header="t('columns.period')">
              <template #body="{ data }">{{ data.periodStart ? `${formatDate(data.periodStart, locale)} – ${formatDate(data.periodEnd, locale)}` : '—' }}</template>
            </pv-column>
            <pv-column :header="t('columns.amount')">
              <template #body="{ data }">{{ data.amount.formatted }}</template>
            </pv-column>
            <pv-column :header="t('columns.status')">
              <template #body="{ data }">
                <pv-tag :value="t(`statuses.${data.status.value}`)" :severity="statusSeverity(data.status.value)"/>
              </template>
            </pv-column>
            <pv-column :header="t('columns.receipt')">
              <template #body="{ data }">
                <pv-button v-if="billingStore.getReceiptByTransactionId(data.id)" :label="billingStore.getReceiptByTransactionId(data.id).code" icon="pi pi-file" size="small" text @click="openReceipt(data)"/>
                <span v-else>—</span>
              </template>
            </pv-column>
          </pv-data-table>
        </div>
      </div>
    </div>
    <pv-dialog v-model:visible="checkoutDialog" modal :header="t('billing.checkout-title')" :style="{ width: '32rem' }" :breakpoints="{ '575px': '95vw' }">
      <p class="mt-0 text-sm trazza-muted">{{ t('billing.checkout-hint', { price: proPrice.formatted }) }}</p>
      <div class="grid">
        <div class="col-12">
          <label for="cardNumber" class="trazza-label">{{ t('fields.card-number') }} *</label>
          <pv-input-text id="cardNumber" v-model="form.cardNumber" placeholder="4242 4242 4242 4242" class="w-full" autocomplete="cc-number"/>
        </div>
        <div class="col-8">
          <label for="holder" class="trazza-label">{{ t('fields.card-holder') }} *</label>
          <pv-input-text id="holder" v-model="form.holderName" class="w-full" autocomplete="cc-name"/>
        </div>
        <div class="col-4">
          <label for="expiry" class="trazza-label">{{ t('fields.expiry') }} *</label>
          <pv-input-text id="expiry" v-model="form.expiry" placeholder="MM/YY" class="w-full" autocomplete="cc-exp"/>
        </div>
        <div class="col-12">
          <span class="trazza-label">{{ t('fields.receipt-type') }} *</span>
          <pv-select-button v-model="form.receiptType" :options="receiptTypes" option-label="label" option-value="value" :allow-empty="false"/>
        </div>
        <div class="col-12 md:col-7">
          <label for="customerName" class="trazza-label">{{ form.receiptType === 'factura' ? t('fields.business-name') : t('fields.full-name') }} *</label>
          <pv-input-text id="customerName" v-model="form.customerName" class="w-full"/>
        </div>
        <div class="col-12 md:col-5">
          <label for="customerDocument" class="trazza-label">{{ form.receiptType === 'factura' ? t('fields.ruc') : t('fields.dni') }} *</label>
          <pv-input-text id="customerDocument" v-model="form.customerDocument" class="w-full"/>
        </div>
      </div>
      <small class="trazza-muted">{{ t('billing.test-cards') }}</small>
      <pv-message v-if="errorMessage" severity="error" size="small" class="mt-2">{{ errorMessage }}</pv-message>
      <template #footer>
        <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="checkoutDialog = false"/>
        <pv-button :label="t('billing.pay', { price: proPrice.formatted })" icon="pi pi-lock" :loading="billingStore.state.processing" @click="upgrade"/>
      </template>
    </pv-dialog>
    <receipt-dialog v-model:visible="receiptDialog" :receipt="selectedReceipt" :transaction="selectedTransaction"/>
  </div>
</template>

<style scoped>
.pro-card {
  background: #ffffff;
  border: 2px solid var(--trazza-accent);
}
</style>
