import { people_relationshipEnum } from "influencers-models";

export class SocialMediaRelationship {
    constructor(public platformObjectIdentity: string, public picture: string, public displayName: string, public relationship: people_relationshipEnum){}
}