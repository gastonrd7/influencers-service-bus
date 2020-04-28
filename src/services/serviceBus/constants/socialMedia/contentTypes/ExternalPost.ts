import { insightTypeEnum } from "influencers-models";

export class ExternalPost {
    constructor(){}
    insigths: Insight[];
    link: string
}

export class Insight {
    constructor(public type: insightTypeEnum, public userName: string){}
}

