export class FacebookPost {
    constructor(){}
    insigths: Insight[];
    link: String
}

export enum InsightType {
    COMMENT = "Comment",
    SHARE = "Shared",
    LIKE = "Like"
}

export class Insight {
    constructor(public type: InsightType, public userName: String){}
}

