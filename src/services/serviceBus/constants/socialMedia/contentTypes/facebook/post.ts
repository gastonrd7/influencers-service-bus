export class FacebookPost {
    constructor(){}
    comments: FacebookComment[];
    shares: FacebookShares[];
    likes: FacebookReactions[];
    link: String
}

export class FacebookShares {
    constructor(){}
    userName: String;
}
export class FacebookReactions {
    constructor(){}
        userName: String;
}
export class FacebookComment {
        constructor(){}
        userName:String;
};