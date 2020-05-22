import IMessageBus from '../../interfaces/IMessagingBus'
import * as subCallback from '../../specialTypes/functionsTypes'
import { injectable} from "inversify";

@injectable()
export default class OtherMessagingBus implements IMessageBus {
    

    constructor() {
        this.name = "Other Messaging serevice"
        throw new Error('This provider is not implemented!')
    }

    public name:string;

    public async init():Promise<void>{
        throw new Error('Method not implemented!');
    }

    public async publish(subject: string, message):Promise<void>
    {
       
    }

    public async request(subject: string, timeout: number, message):Promise<any>
    {
        throw new Error('Method not implemented!');
    }

    public async subscribe(subject: string, callback: subCallback.subcribeCallback):Promise<void>
    {
        throw new Error('Method not implemented!')
    }

    public async unsubscribe(subscriptionId: number): Promise<any> {
        throw new Error("Method not implemented.");
    }
    
}