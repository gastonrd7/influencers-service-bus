export class FacebookPost {
    constructor(){}
    comments: FacebookComment[];
    shares: FacebookShares[];
    likes: FacebookReactions[];
    link: String
}

export class FacebookShares {
    userName: String;
}
export class FacebookReactions {
        userName: String;
}
export class FacebookComment {
        userName:String;
};