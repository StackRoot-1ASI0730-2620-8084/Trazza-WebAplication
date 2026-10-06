import {Ruc} from "./ruc.value-object.js";
import {Phone} from "./phone.value-object.js";

/**
 * Merchant profile aggregate root. It represents the business that ships goods.
 *
 * @class MerchantProfile
 */
export class MerchantProfile {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Profile identifier.
     * @param {number} params.userId - Identifier of the related user.
     * @param {string} params.businessName - Legal or commercial name.
     * @param {string} params.contactName - Name of the contact person.
     * @param {Ruc} params.ruc - Taxpayer number.
     * @param {Phone} params.phone - Contact phone.
     * @param {boolean} [params.verified=false] - Whether the business was verified.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, userId, businessName, contactName, ruc, phone, verified = false }) {
        if (userId === null || userId === undefined) throw new Error('validation.user-required');
        if ((businessName ?? '').trim().length < 3) throw new Error('validation.business-name-required');
        if ((contactName ?? '').trim().length < 3) throw new Error('validation.full-name-required');
        if (!(ruc instanceof Ruc)) throw new Error('validation.ruc-invalid');
        if (!(phone instanceof Phone)) throw new Error('validation.phone-invalid');
        this._id = id;
        this._userId = userId;
        this._businessName = businessName.trim();
        this._contactName = contactName.trim();
        this._ruc = ruc;
        this._phone = phone;
        this._verified = Boolean(verified);
    }

    /** @returns {?number} Profile identifier. */
    get id() {
        return this._id;
    }

    /** @returns {number} User identifier. */
    get userId() {
        return this._userId;
    }

    /** @returns {string} Business name. */
    get businessName() {
        return this._businessName;
    }

    /** @returns {string} Contact name. */
    get contactName() {
        return this._contactName;
    }

    /** @returns {Ruc} RUC. */
    get ruc() {
        return this._ruc;
    }

    /** @returns {Phone} Phone. */
    get phone() {
        return this._phone;
    }

    /** @returns {boolean} Verification flag. */
    get verified() {
        return this._verified;
    }

    /**
     * Updates the business data of the merchant.
     *
     * @param {Object} params - New data.
     * @param {string} params.businessName - Business name.
     * @param {string} params.contactName - Contact name.
     * @param {Phone} params.phone - Phone.
     * @returns {void}
     */
    updateBusiness({ businessName, contactName, phone }) {
        if ((businessName ?? '').trim().length < 3) throw new Error('validation.business-name-required');
        if ((contactName ?? '').trim().length < 3) throw new Error('validation.full-name-required');
        if (!(phone instanceof Phone)) throw new Error('validation.phone-invalid');
        this._businessName = businessName.trim();
        this._contactName = contactName.trim();
        this._phone = phone;
    }
}
