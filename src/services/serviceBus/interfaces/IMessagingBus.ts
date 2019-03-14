import * as subCallback from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import SocialMediaRequestResponse from '../constants/socialMedia/socialMediaRequestResponse';
import SocialMediaRequestPayload from '../constants/socialMedia/socialMediaRequestPayload';

export default interface IMessageBus {
    publish(subject: string, message):Promise<void>;
    request(subject: string, timeout: number, message: requestPayload | SocialMediaRequestPayload):Promise<requestResponse | SocialMediaRequestResponse>;
    subscribe(subject: string, callback: subCallback.subcribeCallback):Promise<any>;
    unsubscribe(subscriptionId: number):Promise<any>;
    init():void;
    name:string

}


