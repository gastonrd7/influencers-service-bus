import {LogoutResponseContent} from "./contentTypes/logoutResponseContent";
import {LoginResponseContent} from "./contentTypes/LoginResponseContent";
import {VerifyCredentialsResponseContent} from "./contentTypes/verifyCredentialsResponseContent";
import {ReadPostResponseContent} from "./contentTypes/readPostResponseContent";

export default class SocialMediaRequestResponse{
    constructor(public payload: LogoutResponseContent | LoginResponseContent | VerifyCredentialsResponseContent | ReadPostResponseContent,
        public error?: any) {}
}