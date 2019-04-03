export class LoginResponseContent {
    constructor(
        public firstName?: string, 
        public lastName?: string,
        public picture?: string,
        public platformObjectIdentity?: string,
        public access_token?: string,
        public expires?: number,
        public birthday?: Date,
        public email?: string
        ) { }
}
