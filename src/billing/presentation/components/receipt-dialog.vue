<script setup>
import {useI18n} from "vue-i18n";
import {formatDate} from "../../../shared/presentation/formatters.js";

const props = defineProps({
  receipt: { type: Object, default: null },
  transaction: { type: Object, default: null }
});
const visible = defineModel('visible', { type: Boolean, default: false });
const { t, locale } = useI18n();
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t('receipt.title')" :style="{ width: '28rem' }" :breakpoints="{ '575px': '95vw' }">
    <div v-if="props.receipt" class="receipt">
      <div class="text-center mb-3">
        <div class="font-bold text-lg">TRAZZA S.A.C.</div>
        <div class="text-sm trazza-muted">RUC 20612345678 · Lima, Perú</div>
        <div class="receipt-type mt-2 py-1 font-semibold">
          {{ t(`receipt.types.${props.receipt.type.value}`) }}<br>{{ props.receipt.code }}
        </div>
      </div>
      <dl class="receipt-grid m-0 text-sm">
        <dt>{{ t('receipt.customer') }}</dt><dd>{{ props.receipt.customerName }}</dd>
        <dt>{{ props.receipt.type.value === 'factura' ? t('fields.ruc') : t('fields.dni') }}</dt><dd>{{ props.receipt.customerDocument }}</dd>
        <dt>{{ t('receipt.issued') }}</dt><dd>{{ formatDate(props.receipt.issuedAt, locale) }}</dd>
        <dt>{{ t('receipt.concept') }}</dt><dd>{{ t('receipt.concept-value', { plan: t(`plans.${props.transaction?.plan.code ?? 'pro'}`) }) }}</dd>
        <dt>{{ t('receipt.payment') }}</dt><dd>{{ props.transaction?.method.label }}</dd>
      </dl>
      <pv-divider/>
      <div class="flex justify-content-between text-sm"><span>{{ t('receipt.subtotal') }}</span><span>{{ props.receipt.subtotal.formatted }}</span></div>
      <div class="flex justify-content-between text-sm"><span>IGV (18%)</span><span>{{ props.receipt.igv.formatted }}</span></div>
      <div class="flex justify-content-between font-bold text-lg mt-2"><span>{{ t('receipt.total') }}</span><span>{{ props.receipt.total.formatted }}</span></div>
    </div>
    <template #footer>
      <pv-button :label="t('actions.close')" @click="visible = false"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.receipt-type {
  border: 1px solid var(--trazza-line);
  border-radius: 6px;
}

.receipt-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.35rem 1rem;
}

.receipt-grid dt {
  color: var(--trazza-muted);
}

.receipt-grid dd {
  margin: 0;
}
</style>
