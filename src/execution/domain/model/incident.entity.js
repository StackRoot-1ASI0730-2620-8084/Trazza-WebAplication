import {IncidentType} from "./incident-type.value-object.js";

/**
 * Incident entity that belongs to the Shipment aggregate.
 *
 * @class Incident
 */
export class Incident {
    /** @type {number} Minimum description length. */
    static MIN_DESCRIPTION_LENGTH = 10;

    /** @type {number} Maximum description length. */
    static MAX_DESCRIPTION_LENGTH = 500;

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Incident identifier inside the shipment.
     * @param {IncidentType} params.type - Incident category.
     * @param {string} params.description - What happened.
     * @param {number} params.reporterId - User identifier of the reporter.
     * @param {string} params.reporterRole - "carrier" or "merchant".
     * @param {string} params.reportedAt - ISO date-time.
     * @param {string} [params.status='open'] - "open" or "resolved".
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, type, description, reporterId, reporterRole, reportedAt, status = 'open' }) {
        if (!(type instanceof IncidentType)) throw new Error('validation.incident-type-invalid');
        const text = (description ?? '').trim();
        if (text.length < Incident.MIN_DESCRIPTION_LENGTH) throw new Error('validation.incident-description-short');
        if (text.length > Incident.MAX_DESCRIPTION_LENGTH) throw new Error('validation.description-too-long');
        if (reporterId === null || reporterId === undefined) throw new Error('validation.user-required');
        if (!['carrier', 'merchant'].includes(reporterRole)) throw new Error('validation.party-invalid');
        if (!['open', 'resolved'].includes(status)) throw new Error('validation.status-invalid');
        this._id = id;
        this._type = type;
        this._description = text;
        this._reporterId = reporterId;
        this._reporterRole = reporterRole;
        this._reportedAt = reportedAt ?? new Date().toISOString();
        this._status = status;
    }

    /** @returns {?number} Incident identifier. */
    get id() { return this._id; }

    /** @returns {IncidentType} Type. */
    get type() { return this._type; }

    /** @returns {string} Description. */
    get description() { return this._description; }

    /** @returns {number} Reporter user identifier. */
    get reporterId() { return this._reporterId; }

    /** @returns {string} Reporter role. */
    get reporterRole() { return this._reporterRole; }

    /** @returns {string} Report date-time. */
    get reportedAt() { return this._reportedAt; }

    /** @returns {string} Status. */
    get status() { return this._status; }

    /**
     * Assigns the identifier when the incident is added to a shipment.
     *
     * @param {number} id - New identifier.
     * @returns {void}
     */
    assignId(id) {
        this._id = id;
    }

    /**
     * Marks the incident as resolved.
     *
     * @returns {void}
     * @throws {Error} When it is already resolved.
     */
    resolve() {
        if (this._status === 'resolved') throw new Error('validation.incident-already-resolved');
        this._status = 'resolved';
    }
}
