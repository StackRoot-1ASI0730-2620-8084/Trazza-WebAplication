<script setup>
import {useI18n} from "vue-i18n";
import {districtNames} from "../../domain/model/lima-districts.js";

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true }
});
const model = defineModel({ type: Object, required: true });
const { t } = useI18n();
</script>

<template>
  <div>
    <label :for="`${props.id}-street`" class="trazza-label">{{ props.label }} *</label>
    <div class="grid">
      <div class="col-12 md:col-7 pb-0 md:pb-2">
        <pv-input-text :id="`${props.id}-street`" v-model="model.street" :placeholder="t('fields.street-placeholder')" class="w-full"/>
      </div>
      <div class="col-12 md:col-5">
        <pv-select :input-id="`${props.id}-district`" v-model="model.district" :options="districtNames" filter :placeholder="t('fields.district')" class="w-full"/>
      </div>
    </div>
  </div>
</template>
