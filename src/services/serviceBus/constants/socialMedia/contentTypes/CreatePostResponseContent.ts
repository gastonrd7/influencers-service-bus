import * as globalModels from "influencers-models";

export class CreatePostResponseContent{
    constructor(public advertisementId: string, public platform: globalModels.platformEnum, public postPlatformId: String){}
}
