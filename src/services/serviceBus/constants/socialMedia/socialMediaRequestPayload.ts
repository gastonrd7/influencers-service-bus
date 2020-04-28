import {LoginRequestContent} from './contentTypes/LoginRequestContent';
import {LogoutRequestContent} from './contentTypes/logoutRequestContent';
import {VerifyCredentialsRequestContent} from './contentTypes/verifyCredentialsRequestContent';
import {ReadPostInsightsRequestContent} from './contentTypes/ReadPostInsightsRequestContent';
import { CreatePostRequestContent } from './contentTypes/CreatePostRequestContent';
import { RelationshipRequestContent } from './contentTypes/RelationshipRequestContent';
import { platformEnum } from 'influencers-models';


export default class SocialMediaRequestPayload{
    constructor(public socialMedia: platformEnum, 
        public payload?: LoginRequestContent 
                | LogoutRequestContent 
                | VerifyCredentialsRequestContent 
                | ReadPostInsightsRequestContent 
                | CreatePostRequestContent
                | RelationshipRequestContent
            ){}
}