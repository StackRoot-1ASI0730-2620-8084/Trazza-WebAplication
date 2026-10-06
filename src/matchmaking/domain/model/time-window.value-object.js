/**
 * Immutable value object that represents a time window inside a single day (HH:mm - HH:mm).
 *
 * @class TimeWindow
 */
export class TimeWindow {
    /**
     * Pattern of a 24-hour time.
     * @type {RegExp}
     */
    static PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

    /**
     * @param {Object} params - Value object attributes.
     * @param {string} params.start - Start time (HH:mm).
     * @param {string} params.end - End time (HH:mm).
     * @throws {Error} When a time is invalid or the window is empty.
     */
    constructor({ start, end }) {
        if (!TimeWindow.PATTERN.test(start ?? '') || !TimeWindow.PATTERN.test(end ?? '')) throw new Error('validation.time-window-invalid');
        if (TimeWindow.toMinutes(start) >= TimeWindow.toMinutes(end)) throw new Error('validation.time-window-order');
        this._start = start;
        this._end = end;
        Object.freeze(this);
    }

    /**
     * @param {string} time - Time in HH:mm.
     * @returns {number} Minutes since midnight.
     */
    static toMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /** @returns {string} Start time. */
    get start() {
        return this._start;
    }

    /** @returns {string} End time. */
    get end() {
        return this._end;
    }

    /** @returns {string} Window label, for example "16:00 – 18:00". */
    get label() {
        return `${this._start} – ${this._end}`;
    }

    /**
     * @param {TimeWindow} other - Window to compare.
     * @returns {boolean} True when both windows share at least one minute.
     */
    overlaps(other) {
        return TimeWindow.toMinutes(this._start) < TimeWindow.toMinutes(other.end)
            && TimeWindow.toMinutes(other.start) < TimeWindow.toMinutes(this._end);
    }
}
