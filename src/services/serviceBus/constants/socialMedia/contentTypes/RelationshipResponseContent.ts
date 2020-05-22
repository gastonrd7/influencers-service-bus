import { SocialMediaRelationship } from "./SocialMediaRelationship";
import { platformEnum } from "influencers-models";

export class RelationshipResponseContent{
    constructor(public person_credentialId: string, public personId: string, public platform: platformEnum, public platformObjects: SocialMediaRelationship[]){}
}
