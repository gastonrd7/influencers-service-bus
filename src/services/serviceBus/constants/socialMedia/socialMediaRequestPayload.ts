import {LoginRequestContent} from './contentTypes/LoginRequestContent';
import {LogoutRequestContent} from './contentTypes/logoutRequestContent';
import {VerifyCredentialsRequestContent} from './contentTypes/verifyCredentialsRequestContent';
import {ReadPostRequestContent} from './contentTypes/readPostRequestContent';
import { SocialMediaEnum } from './SocialMediaEnum';


export default class SocialMediaRequestPayload{
    constructor(public socialMedia: SocialMediaEnum, 
        public payload?: LoginRequestContent | LogoutRequestContent | VerifyCredentialsRequestContent | ReadPostRequestContent){}
}