import * as subCallback from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';

export default interface IMessageBus {
    publish(subject: string, message):Promise<void>;
    request(subject: string, timeout: number, message: requestPayload | SocialMediaRequestPayload):Promise<requestResponse | SocialMediaRequestResponse>;
    subscribe(serviceName: string, subject: string, callback: subCallback.subcribeCallback):Promise<any>;
    unsubscribe(subscriptionId: number):Promise<any>;
    init():void;
    name:string

}


