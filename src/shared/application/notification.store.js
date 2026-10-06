import {computed, reactive} from "vue";

/**
 * Reactive state of in-app alerts shared by every bounded context.
 *
 * @type {{notifications: Array<{id: number, severity: string, summaryKey: string, detailKey: string, params: Object, read: boolean, createdAt: string}>}}
 */
const state = reactive({
    notifications: []
});

/** @type {import('vue').ComputedRef<number>} Number of unread notifications. */
const unreadCount = computed(() => state.notifications.filter(notification => !notification.read).length);

/**
 * Publishes a new in-app alert.
 *
 * @param {Object} params - Notification data.
 * @param {string} [params.severity='info'] - PrimeVue severity (info, success, warn, error).
 * @param {string} params.summaryKey - I18n key of the summary.
 * @param {string} [params.detailKey=''] - I18n key of the detail.
 * @param {Object} [params.params={}] - Interpolation parameters for the i18n messages.
 * @returns {void}
 */
function notify({ severity = 'info', summaryKey, detailKey = '', params = {} }) {
    state.notifications.unshift({
        id: Date.now() + state.notifications.length,
        severity,
        summaryKey,
        detailKey,
        params,
        read: false,
        createdAt: new Date().toISOString()
    });
}

/**
 * Marks every notification as read.
 * @returns {void}
 */
function markAllAsRead() {
    state.notifications.forEach(notification => notification.read = true);
}

/**
 * Removes every notification.
 * @returns {void}
 */
function clear() {
    state.notifications.splice(0, state.notifications.length);
}

const notificationStore = { state, unreadCount, notify, markAllAsRead, clear };

/**
 * Application service store for cross-context in-app notifications.
 *
 * @returns {{state: Object, unreadCount: import('vue').ComputedRef<number>, notify: Function, markAllAsRead: Function, clear: Function}}
 */
const useNotificationStore = () => notificationStore;

export default useNotificationStore;
