import { people_relationshipEnum } from "influencers-models";

export class SocialMediaRelationship {
    constructor(public platformObjectId: string, public avatarUrl: string, public displayName: string, public relationship: people_relationshipEnum){}
}