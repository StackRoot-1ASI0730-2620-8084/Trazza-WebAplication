<script setup>
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import SideMenu from "./side-menu.vue";
import TopBar from "./top-bar.vue";
import LanguageSwitcher from "./language-switcher.vue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfileStore from "../../../iam/application/profile.store.js";
import useMatchmakingStore from "../../../matchmaking/application/matchmaking.store.js";
import useExecutionStore from "../../../execution/application/execution.store.js";
import useBillingStore from "../../../billing/application/billing.store.js";
import useReputationStore from "../../../reputation/application/reputation.store.js";

const { t } = useI18n();
const route = useRoute();
const iamStore = useIamStore();
const drawer = ref(false);

const isPublicRoute = computed(() => route.meta?.public === true);

/**
 * Loads the data of every bounded context once a session is available.
 */
const loadContexts = () => {
  useProfileStore().fetchProfiles();
  useMatchmakingStore().fetchAll();
  useExecutionStore().fetchShipments();
  useBillingStore().fetchBilling();
  useReputationStore().fetchRatings();
};

watch(() => iamStore.isSignedIn.value, signedIn => { if (signedIn) loadContexts(); }, { immediate: true });
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
  <div v-if="isPublicRoute" class="auth-shell min-h-screen flex flex-column">
    <header class="flex justify-content-between align-items-center px-4 py-3">
      <div class="flex align-items-center gap-2">
        <img src="/trazza-logo.svg" alt="Trazza" width="32" height="32"/>
        <span class="text-xl font-bold" style="color: var(--trazza-accent)">Trazza</span>
      </div>
      <language-switcher/>
    </header>
    <main class="flex-1 flex align-items-start md:align-items-center justify-content-center p-3">
      <router-view/>
    </main>
    <footer class="text-center text-sm trazza-muted p-3">{{ t('footer.copyright') }}</footer>
  </div>
  <div v-else class="app-shell flex min-h-screen">
    <aside class="hidden lg:block sidebar">
      <side-menu/>
    </aside>
    <pv-drawer v-model:visible="drawer" class="mobile-drawer" :show-close-icon="false">
      <side-menu @navigate="drawer = false"/>
    </pv-drawer>
    <div class="flex-1 flex flex-column min-w-0">
      <top-bar @toggle-menu="drawer = !drawer"/>
      <main class="flex-1">
        <router-view/>
      </main>
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  background: #f7f8ff;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  background: #ffffff;
}

:global(.mobile-drawer.p-drawer) {
  width: var(--trazza-sidebar-width) !important;
}

:global(.mobile-drawer .p-drawer-content) {
  padding: 0;
  background: #ffffff;
}

:global(.mobile-drawer .p-drawer-header) {
  display: none;
}
</style>
