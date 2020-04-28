import {LogoutResponseContent} from "./contentTypes/logoutResponseContent";
import {LoginResponseContent} from "./contentTypes/LoginResponseContent";
import {VerifyCredentialsResponseContent} from "./contentTypes/verifyCredentialsResponseContent";
import {ReadPostInsightsResponseContent} from "./contentTypes/ReadPostInsightsResponseContent";
import { CreatePostResponseContent } from "./contentTypes/CreatePostResponseContent";
import { RelationshipResponseContent } from "./contentTypes/RelationshipResponseContent";

export default class SocialMediaRequestResponse{
    constructor(public payload: LogoutResponseContent 
        | LoginResponseContent 
        | VerifyCredentialsResponseContent 
        | ReadPostInsightsResponseContent 
        | CreatePostResponseContent
        | RelationshipResponseContent,
        public error?: any) {}
}