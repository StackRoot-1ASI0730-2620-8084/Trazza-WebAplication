import {User} from "../domain/model/user.entity.js";
import {Email} from "../domain/model/email.value-object.js";
import {Phone} from "../domain/model/phone.value-object.js";
import {UserRole} from "../domain/model/user-role.value-object.js";

/**
 * Maps IAM user resources into domain entities and back.
 *
 * @class UserAssembler
 */
export class UserAssembler {
    /**
     * @param {Object} resource - User resource payload.
     * @returns {User} User entity.
     */
    static toEntityFromResource(resource) {
        return new User({
            id: resource.id,
            fullName: resource.fullName,
            email: new Email(resource.email),
            phone: new Phone(resource.phone),
            role: new UserRole(resource.role),
            createdAt: resource.createdAt ?? null
        });
    }

    /**
     * Parses user resources from a response and maps them into entities.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with user resources.
     * @returns {User[]} User entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['users'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {User} entity - User entity.
     * @returns {Object} User resource without credentials.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            fullName: entity.fullName,
            email: entity.email.value,
            phone: entity.phone.value,
            role: entity.role.value,
            createdAt: entity.createdAt
        };
    }
}
