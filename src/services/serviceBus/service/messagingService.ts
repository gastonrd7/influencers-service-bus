import IMessagingBus from '../interfaces/IMessagingBus';
import { inject, injectable, named } from "inversify";
import TAG from '../constants/tags'
import SERVICE_IDENTIFIER from '../../config/identifiers';
import container from "../../config/ioc_config";
import * as subsCaller from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { Logger } from 'adme-common';
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';
import { CachingService } from '../../..';


export default class MessagingService {
   
    //#region Fields

    private static _instance : MessagingService = new MessagingService();
    @inject(SERVICE_IDENTIFIER.MESSENGER) private _messagingClient : IMessagingBus ;
    private _requestTimeout : number;

    //#endregion Fields

    //#region Constructors and Public 

    constructor() {
        if(MessagingService._instance){
            throw new Error("Error: Instantiation failed: Use NatsMessagingBus.getInstance() instead of new.");
        }
        
        MessagingService._instance = this;
    }

    public static async init(requestTimeout: number = 100000):Promise<void>{
        this.getInstance()._messagingClient = container.getNamed<IMessagingBus>(SERVICE_IDENTIFIER.MESSENGER, TAG.NATS);
        this.getInstance()._requestTimeout = requestTimeout;
        await this.getInstance()._messagingClient.init();
    }

    
    public static async publish(caller: string, subject: string, message):Promise<void>
    {
        await CachingService.incrementBy('PublishCounter');
        await this.getInstance()._messagingClient.publish(subject, message);
        Logger.log(`${caller} has published: ${subject} ****************************************`);
        
    }

    public static async subscribe(caller: string, subject: string, callback: subsCaller.subcribeCallback):Promise<void>
    {
        await CachingService.incrementBy('SubscribeCounter');
        await this.getInstance()._messagingClient.subscribe(subject, async (err, msg) => {
            await callback(err, msg);
    
        });
        Logger.log(`${caller} has been subcripted to ${subject} - OK! ****************************************`);
    }

    public static async request(caller: string, subject: string, message: requestPayload | SocialMediaRequestPayload ):Promise<requestResponse | SocialMediaRequestResponse>
    {
        await CachingService.incrementBy('RequestCounter');
        Logger.log(`Caller: ${caller} sent a request for the Subject: ${subject}. Payload: ${JSON.stringify(message)} ****************************************`);
        var start = new Date();
        
        let response = await this.getInstance()._messagingClient.request(subject.toString(), this.getInstance()._requestTimeout, message);
        
        Logger.log(`Caller: ${caller} got the response for the Subject: ${subject} in ${new Date().valueOf() - start.valueOf()}ms ****************************************`);
        return response;
    }

   
    //#endregion Constructors and Public

    //#region Private

    private static getInstance() : MessagingService
    {
        return MessagingService._instance;
    }

    private static async getNewMessagingBudClient() : Promise<IMessagingBus>
    {
        var client = await container.getNamed<IMessagingBus>(SERVICE_IDENTIFIER.MESSENGER, TAG.NATS);
        await client.init();
        return Promise.resolve( client );
    }

    //#endregion Private
    
}