/**
 * Formats an ISO date (YYYY-MM-DD or full ISO string) as a short localized date.
 *
 * @param {string|Date|null} value - Date to format.
 * @param {string} [locale='en'] - Active locale.
 * @returns {string} Formatted date or a dash when empty.
 */
export const formatDate = (value, locale = 'en') => {
    if (!value) return '—';
    const date = typeof value === 'string' && value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
    return date.toLocaleDateString(locale === 'es' ? 'es-PE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Formats an ISO date-time as a localized time (HH:mm).
 *
 * @param {string|Date|null} value - Date-time to format.
 * @param {string} [locale='en'] - Active locale.
 * @returns {string} Formatted time or a dash when empty.
 */
export const formatTime = (value, locale = 'en') => {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString(locale === 'es' ? 'es-PE' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a number with thousands separator.
 *
 * @param {number} value - Number to format.
 * @returns {string} Formatted number.
 */
export const formatNumber = value => Number(value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 1 });

/**
 * Converts a Date into an ISO local date string (YYYY-MM-DD).
 *
 * @param {Date} date - Date to convert.
 * @returns {string} ISO local date.
 */
export const toIsoDate = date => {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * Returns the initials of a full name.
 *
 * @param {string} name - Full name.
 * @returns {string} Up to two uppercase initials.
 */
export const initialsOf = name => (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

/**
 * PrimeVue severity used to render a lifecycle status as a tag.
 *
 * @type {Readonly<Record<string, string>>}
 */
const STATUS_SEVERITIES = Object.freeze({
    active: 'success',
    open: 'info',
    draft: 'secondary',
    pending: 'warn',
    counteroffer: 'warn',
    accepted: 'info',
    matched: 'success',
    rejected: 'danger',
    closed: 'secondary',
    cancelled: 'danger',
    picked_up: 'info',
    in_transit: 'info',
    delivered: 'success',
    paid: 'success',
    failed: 'danger'
});

/**
 * @param {string} status - Status value.
 * @returns {string} PrimeVue severity.
 */
export const statusSeverity = status => STATUS_SEVERITIES[status] ?? 'secondary';

/**
 * Builds the list of selectable half-hour times between two hours.
 *
 * @param {number} [fromHour=6] - First hour.
 * @param {number} [toHour=22] - Last hour.
 * @returns {string[]} Times in HH:mm.
 */
export const halfHourSlots = (fromHour = 6, toHour = 22) => {
    const slots = [];
    for (let hour = fromHour; hour <= toHour; hour++) {
        slots.push(`${String(hour).padStart(2, '0')}:00`);
        if (hour < toHour) slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
};
