import ImessagingBus from '../../interfaces/IMessagingBus'
import * as subCallback from '../../specialTypes/functionsTypes'
import {Client, connect, SubscriptionOptions} from 'ts-nats'
import { inject, injectable, named } from "inversify";
import requestPayload from '../../constants/requestPayload'
import requestResponse from '../../constants/requestResponse'
import Guid from '../../../../utils/guid';
import Logger from '../../../../utils/logger';
import SocialMediaRequestPayload from '../../constants/socialMedia/socialMediaRequestPayload';
import SocialMediaRequestResponse from '../../constants/socialMedia/socialMediaRequestResponse';


@injectable()
export default class NatsMessagingBus implements ImessagingBus {
    

    //#region Fields
    
    private _natsClient:Client;

    //#endregion Fields
    
    //#region Constructors
    
    constructor() {
        this.name = "Nats Messaging serevice";
    }

    //#endregion Constructors

    //#region ImessagingBus implementation

    public async init():Promise<void>{

        var start = new Date();
        this._natsClient = await connect({'url':`${process.env.NATS_URL}:${process.env.NATS_PORT}`, 'user':process.env.NATS_USER, 'pass':process.env.NATS_PASSWORD});
        this._natsClient.on('connect', () => {
            Logger.log(`Listener connected to Nats - Duration: ${new Date().valueOf() - start.valueOf()}ms`);
        });
        this._natsClient.on('close', () => {
            Logger.log(`Stopped`);
        });
        this._natsClient.on('error', (e) => {
            const msg = 'Error connecting to NATS';
            console.log(msg, e);
            Logger.error(msg, e);
        });
    }

    public name:string;
    
    public async publish(subject: string, message):Promise<void>
    {
        await this._natsClient.publish(subject, JSON.stringify( message));
    }

    public async request(subject: string, timeout: number, message: requestPayload | SocialMediaRequestPayload):Promise<requestResponse | SocialMediaRequestResponse>
    {
        let responseMsg = await this._natsClient.request(subject, timeout, JSON.stringify( message ));

        let response = Object.create(requestResponse.prototype);
        return await Object.assign(response, JSON.parse(responseMsg.data));
        
    }

    public async subscribe(subject: string, callback: subCallback.subcribeCallback):Promise<any>
    {
        await this._natsClient.subscribe(subject, callback);
    }

    public async unsubscribe(subscriptionId: number): Promise<any> {
        return Promise.resolve();
    }

    //#endregion ImessagingBus implementation
    
}