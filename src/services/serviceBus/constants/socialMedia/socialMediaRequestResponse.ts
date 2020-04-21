import {LogoutResponseContent} from "./contentTypes/logoutResponseContent";
import {LoginResponseContent} from "./contentTypes/LoginResponseContent";
import {VerifyCredentialsResponseContent} from "./contentTypes/verifyCredentialsResponseContent";
import {ReadPostResponseContent} from "./contentTypes/readPostResponseContent";
import { CreatePostResponseContent } from "./contentTypes/createPostResponseContent";
import { RelationshipResponseContent } from "./contentTypes/RelationshipResponseContent";

export default class SocialMediaRequestResponse{
    constructor(public payload: LogoutResponseContent 
        | LoginResponseContent 
        | VerifyCredentialsResponseContent 
        | ReadPostResponseContent 
        | CreatePostResponseContent
        | RelationshipResponseContent,
        public error?: any) {}
}