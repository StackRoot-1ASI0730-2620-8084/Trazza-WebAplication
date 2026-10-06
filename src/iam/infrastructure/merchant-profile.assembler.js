import {MerchantProfile} from "../domain/model/merchant-profile.entity.js";
import {Ruc} from "../domain/model/ruc.value-object.js";
import {Phone} from "../domain/model/phone.value-object.js";

/**
 * Maps merchant profile resources into domain aggregates and back.
 *
 * @class MerchantProfileAssembler
 */
export class MerchantProfileAssembler {
    /**
     * @param {Object} resource - Merchant profile resource payload.
     * @returns {MerchantProfile} Merchant profile aggregate.
     */
    static toEntityFromResource(resource) {
        return new MerchantProfile({
            id: resource.id,
            userId: resource.userId,
            businessName: resource.businessName,
            contactName: resource.contactName,
            ruc: new Ruc(resource.ruc),
            phone: new Phone(resource.phone),
            verified: resource.verified
        });
    }

    /**
     * Parses merchant profile resources from a response and maps them into aggregates.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {MerchantProfile[]} Merchant profile aggregates.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['merchantProfiles'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {MerchantProfile} entity - Merchant profile aggregate.
     * @returns {Object} Merchant profile resource payload.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            businessName: entity.businessName,
            contactName: entity.contactName,
            ruc: entity.ruc.value,
            phone: entity.phone.value,
            verified: entity.verified
        };
    }
}
