import * as subCallback from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'

export default interface IMessageBus {
    publish(subject: string, message):Promise<void>;
    request(subject: string, timeout: number, message: requestPayload):Promise<requestResponse>;
    subscribe(subject: string, callback: subCallback.subcribeCallback):Promise<any>;
    unsubscribe(subscriptionId: number):Promise<any>;
    init():void;
    name:string

}


