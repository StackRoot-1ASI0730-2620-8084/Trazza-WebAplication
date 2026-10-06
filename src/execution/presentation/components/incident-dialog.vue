<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useExecutionStore from "../../application/execution.store.js";
import {IncidentType} from "../../domain/model/incident-type.value-object.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const props = defineProps({
  shipment: { type: Object, default: null }
});
const visible = defineModel('visible', { type: Boolean, default: false });
const emit = defineEmits(['reported']);
const { t } = useI18n();
const store = useExecutionStore();
const { describeError, showSuccess } = useErrorHandler();
const errorMessage = ref('');
const sending = ref(false);
const form = reactive({ type: 'damaged_goods', description: '' });
const typeOptions = computed(() => IncidentType.VALUES.map(value => ({ value, label: t(`incident-types.${value}`) })));

watch(visible, open => {
  if (open) {
    form.type = 'damaged_goods';
    form.description = '';
    errorMessage.value = '';
  }
});

/**
 * Sends the incident report.
 */
const send = async () => {
  errorMessage.value = '';
  sending.value = true;
  try {
    await store.reportIncident(props.shipment, form);
    showSuccess('incident.sent');
    visible.value = false;
    emit('reported');
  } catch (error) {
    errorMessage.value = describeError(error);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t('incident.title')" :style="{ width: '30rem' }" :breakpoints="{ '575px': '95vw' }">
    <p v-if="props.shipment" class="mt-0 trazza-muted">{{ props.shipment.code }} · {{ props.shipment.label }}</p>
    <div class="flex flex-column gap-3">
      <div>
        <label for="incidentType" class="trazza-label">{{ t('incident.what-happened') }} *</label>
        <pv-select input-id="incidentType" v-model="form.type" :options="typeOptions" option-label="label" option-value="value" class="w-full"/>
      </div>
      <div>
        <label for="incidentDescription" class="trazza-label">{{ t('fields.description') }} *</label>
        <pv-textarea id="incidentDescription" v-model="form.description" rows="4" class="w-full" :placeholder="t('incident.description-placeholder')"/>
      </div>
      <small class="trazza-muted">{{ t('incident.window-hint') }}</small>
      <pv-message v-if="errorMessage" severity="error" size="small">{{ errorMessage }}</pv-message>
    </div>
    <template #footer>
      <pv-button :label="t('actions.cancel')" severity="secondary" outlined @click="visible = false"/>
      <pv-button :label="t('incident.send')" icon="pi pi-send" severity="warn" :loading="sending" @click="send"/>
    </template>
  </pv-dialog>
</template>
