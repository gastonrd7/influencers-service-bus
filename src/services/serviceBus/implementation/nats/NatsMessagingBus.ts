import ImessagingBus from '../../interfaces/IMessagingBus'
import * as subCallback from '../../specialTypes/functionsTypes'
import {Client, connect, Payload, SubscriptionOptions} from 'ts-nats'
import { inject, injectable, named } from "inversify";
import requestPayload from '../../constants/requestPayload'
import requestResponse from '../../constants/requestResponse'
import Guid from '../../../../utils/guid';
import { Logger } from 'adme-common';
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';


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

    public init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const start = new Date();
            console.log(`Connecting to Nats....`);
            
            connect({
                'url': `${process.env.NATS_URL}:${process.env.NATS_PORT}`,
                'user': process.env.NATS_USER,
                'pass': process.env.NATS_PASSWORD,
                "payload": Payload.JSON,
            }).then((natsClient) => {
                this._natsClient = natsClient;
                
                this._natsClient.on('connect', () => {
                    console.log(`Listener connected to Nats - Duration: ${new Date().valueOf() - start.valueOf()}ms`);
                    resolve();
                });
                
                this._natsClient.on('close', () => {
                    console.log(`Stopped`);
                });
                
                this._natsClient.on('error', (e) => {
                    const msg = 'Error connecting to NATS';
                    console.log(msg, e);
                    console.error(msg, e);
                    reject(e); // Rechazar la promesa en caso de error
                });
            }).catch((error) => {
                console.error('Error connecting to NATS:', error);
                reject(error); // Rechazar la promesa en caso de error en la conexión
            });
        });
    }

    public name:string;
    
    public async publish(subject: string, message):Promise<void>
    {
        await this._natsClient.publish(subject, message);
    }

    public async request(subject: string, timeout: number, message: requestPayload | SocialMediaRequestPayload):Promise<requestResponse | SocialMediaRequestResponse>
    {
        try {
            let responseMsg = await this._natsClient.request(subject, timeout, message );

            return responseMsg.data;
            
        } catch (error) {
            console.log(`Error to request: ${subject}`, message);
        }
    }

    public async subscribe(serviceName: string, subject: string, callback: subCallback.subcribeCallback):Promise<any>
    {
        await this._natsClient.subscribe(subject, callback, { queue: serviceName });
    }

    public async unsubscribe(subscriptionId: number): Promise<any> {
        return Promise.resolve();
    }

    //#endregion ImessagingBus implementation
    
}