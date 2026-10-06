<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import LanguageSwitcher from "./language-switcher.vue";
import useIamStore from "../../../iam/application/iam.store.js";
import useNotificationStore from "../../application/notification.store.js";
import {formatTime, initialsOf} from "../formatters.js";

const emit = defineEmits(['toggle-menu']);
const { t, locale } = useI18n();
const route = useRoute();
const iamStore = useIamStore();
const notificationStore = useNotificationStore();
const alertsPanel = ref();

const title = computed(() => route.meta?.title ? t(route.meta.title) : '');
const userName = computed(() => iamStore.state.currentUser?.fullName ?? '');
const roleLabel = computed(() => iamStore.isCarrier.value ? t('roles.carrier') : t('roles.merchant'));

/**
 * Opens the alerts panel and marks every alert as read.
 * @param {Event} event - Click event.
 */
const toggleAlerts = (event) => {
  alertsPanel.value.toggle(event);
  notificationStore.markAllAsRead();
};
</script>

<template>
  <header class="top-bar flex align-items-center justify-content-between gap-3 px-3 md:px-4">
    <div class="flex align-items-center gap-2">
      <pv-button icon="pi pi-bars" text rounded class="lg:hidden" :aria-label="t('menu.open')" @click="emit('toggle-menu')"/>
      <span class="font-semibold text-lg">{{ title }}</span>
    </div>
    <div class="flex align-items-center gap-2 md:gap-3">
      <language-switcher/>
      <pv-button text rounded :aria-label="t('menu.alerts')" @click="toggleAlerts">
        <pv-overlay-badge v-if="notificationStore.unreadCount.value" :value="notificationStore.unreadCount.value" severity="danger">
          <i class="pi pi-bell text-xl"></i>
        </pv-overlay-badge>
        <i v-else class="pi pi-bell text-xl"></i>
      </pv-button>
      <pv-popover ref="alertsPanel">
        <div class="alerts-panel">
          <div class="flex justify-content-between align-items-center mb-2">
            <span class="font-semibold">{{ t('menu.alerts') }}</span>
            <pv-button v-if="notificationStore.state.notifications.length" :label="t('menu.clear')" text size="small" @click="notificationStore.clear()"/>
          </div>
          <p v-if="!notificationStore.state.notifications.length" class="trazza-muted m-0">{{ t('menu.no-alerts') }}</p>
          <div v-for="notification in notificationStore.state.notifications" :key="notification.id" class="py-2 border-bottom-1 surface-border">
            <div class="flex justify-content-between gap-2">
              <span class="font-semibold text-sm">{{ t(notification.summaryKey, notification.params) }}</span>
              <span class="text-xs trazza-muted">{{ formatTime(notification.createdAt, locale) }}</span>
            </div>
            <div v-if="notification.detailKey" class="text-sm trazza-muted">{{ t(notification.detailKey, notification.params) }}</div>
          </div>
        </div>
      </pv-popover>
      <div class="hidden md:flex align-items-center gap-2">
        <pv-avatar :label="initialsOf(userName)" shape="circle" class="avatar"/>
        <div class="flex flex-column line-height-2">
          <span class="text-sm font-semibold">{{ userName }}</span>
          <span class="text-xs trazza-muted">{{ roleLabel }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  height: 4rem;
  background: var(--trazza-surface);
  border-bottom: 1px solid var(--trazza-line);
  position: sticky;
  top: 0;
  z-index: 5;
}

.avatar {
  background: var(--trazza-soft);
  color: var(--trazza-accent);
  font-weight: 700;
}

.alerts-panel {
  width: 20rem;
  max-width: 80vw;
}
</style>
