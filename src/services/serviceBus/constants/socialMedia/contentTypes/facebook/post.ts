export class FacebookPost {
    constructor(){}
    insigths: Insigth[];
    // comments: FacebookComment[];
    // shares: FacebookShares[];
    // likes: FacebookReactions[];
    link: String
}

export enum InsigthType {
    COMMENT = "COMMENT",
    SHARE = "SHARE",
    LIKE = "LIKE"
}

export class Insigth {
    constructor(type: InsigthType, userName: String){}
}

// export class FacebookShares {
//     constructor(){}
//     userName: String;
// }
// export class FacebookReactions {
//     constructor(){}
//         userName: String;
// }
// export class FacebookComment {
//         constructor(){}
//         userName:String;
// };

