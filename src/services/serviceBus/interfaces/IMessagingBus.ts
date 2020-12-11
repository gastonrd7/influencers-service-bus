import * as subCallback from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';

export default interface IMessageBus {
    publish(subject: string, message):Promise<void>;
    request(subject: string, message: requestPayload | SocialMediaRequestPayload):Promise<requestResponse | SocialMediaRequestResponse>;
    subscribe(subject: string, callback: subCallback.subcribeCallback, group: string):Promise<any>;
    unsubscribe(subscriptionId: number):Promise<any>;
    init(paramenters: any):void;
    name:string

}


