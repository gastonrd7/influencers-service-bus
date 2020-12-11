import ImessagingBus from '../../interfaces/IMessagingBus'
import * as subCallback from '../../specialTypes/functionsTypes'
import {Client, connect, SubscriptionOptions} from 'ts-nats'
import { inject, injectable, named } from "inversify";
import requestPayload from '../../constants/requestPayload'
import requestResponse from '../../constants/requestResponse'
import Guid from '../../../../utils/guid';
import { asyncForEach, Logger } from 'adme-common';
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';

enum NatsParamatersEnum {
    TIMEOUT = "NATS_TIMEOUT",
    URL = "NATS_URL",
    PORT = "NATS_PORT",
    USER = "NATS_USER",
    PASSWORD = "NATS_PASSWORD"
}
@injectable()
export default class NatsMessagingBus implements ImessagingBus {
    

    //#region Fields
    
    private _natsClient:Client;
    private _timeout: number;

    

    //#endregion Fields
    
    //#region Constructors
    
    constructor() {
        this.name = "Nats Messaging serevice";
    }

    //#endregion Constructors

    //#region ImessagingBus implementation

    public async init(parameters: any):Promise<void>{

        await asyncForEach(Object.keys(NatsParamatersEnum), async (param, index) =>{
            if (!parameters[NatsParamatersEnum[param]]){
                const msg = `NatsMessagingBus can not be initialized because the ${param} was not provided`;
                console.log(msg);
                Logger.error(msg);
                return Promise.reject(msg);
            }
        });

        var start = new Date();
        this._timeout = Number.parseInt(parameters[NatsParamatersEnum.TIMEOUT]);
        this._natsClient = await connect({'url':`${parameters[NatsParamatersEnum.URL]}:${parameters[NatsParamatersEnum.PORT]}`, 'user':parameters[NatsParamatersEnum.USER], 'pass':parameters[NatsParamatersEnum.PASSWORD]});
        this._natsClient.on('connect', () => {
            Logger.log(`Listener connected to Nats - Duration: ${new Date().valueOf() - start.valueOf()} ms`);
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

    public async request(subject: string, message: requestPayload | SocialMediaRequestPayload):Promise<requestResponse | SocialMediaRequestResponse>
    {
        let responseMsg = await this._natsClient.request(subject, this._timeout, JSON.stringify( message ));

        let response = Object.create(requestResponse.prototype);
        return await Object.assign(response, JSON.parse(responseMsg.data));
        
    }

    public async subscribe(subject: string, callback: subCallback.subcribeCallback, group: string ):Promise<any>
    {
        await this._natsClient.subscribe(subject, callback, { queue: group });
    }

    public async unsubscribe(subscriptionId: number): Promise<any> {
        return Promise.resolve();
    }

    //#endregion ImessagingBus implementation
    
}