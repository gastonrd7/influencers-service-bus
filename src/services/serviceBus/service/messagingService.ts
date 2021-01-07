import IMessagingBus from '../interfaces/IMessagingBus';
import { inject, injectable, named } from "inversify";
import TAG from '../constants/tags'
import SERVICE_IDENTIFIER from '../../config/identifiers';
import container from "../../config/ioc_config";
import * as subsCaller from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { asyncForEach, Logger } from 'adme-common';
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';


export default class MessagingService {
   
    //#region Fields

    private static _instance : MessagingService = new MessagingService();
    @inject(SERVICE_IDENTIFIER.MESSENGER) private _messagingClients : { [key: string]: IMessagingBus; } = {};
    private _requestTimeout : number;

    //#endregion Fields

    //#region Constructors and Public 

    constructor() {
        if(MessagingService._instance){
            throw new Error("Error: Instantiation failed: Use NatsMessagingBus.getInstance() instead of new.");
        }
        
        MessagingService._instance = this;
    }

    // public static async init(requestTimeout: number = 100000):Promise<void>{
    public static async init(messengersAttributes: {chanelName: string, parameters: any}[]):Promise<void>{
        await asyncForEach(messengersAttributes, async messenger => {
            try{
                this.getInstance()._messagingClients[messenger.chanelName] = container.getNamed<IMessagingBus>(SERVICE_IDENTIFIER.MESSENGER, TAG.NATS);
                await this.getInstance()._messagingClients[messenger.chanelName].init(messenger.parameters);
            }
            catch(e){
                return Promise.reject(e);
            }
            
        });
        return Promise.resolve();
    }

    
    public static async publish(chanelName: string, caller: string, subject: string, message):Promise<void>
    {
        await this.getInstance()._messagingClients[chanelName].publish(subject, message);
        Logger.log(`${caller} has published: ${subject} to '${chanelName}' chanel  ****************************************`);
        
    }

    public static async subscribe(chanelName: string, caller: string, subject: string, callback: subsCaller.subcribeCallback):Promise<void>
    {
        await this.getInstance()._messagingClients[chanelName].subscribe(subject, async (err, msg) => {
            await callback(err, msg);
    
        }, caller);
        Logger.log(`${caller} has been subcripted to ${subject} of '${chanelName}' chanel - OK! ****************************************`);
    }

    public static async request(chanelName: string, caller: string, subject: string, message: requestPayload | SocialMediaRequestPayload ):Promise<requestResponse | SocialMediaRequestResponse>
    {
        Logger.log(`Caller: ${caller} sent a request for the Subject: ${subject} of the '${chanelName} channel. Payload: ${JSON.stringify(message)} ****************************************`);
        var start = new Date();
        
        let response = await this.getInstance()._messagingClients[chanelName].request(subject.toString(), message);
        
        Logger.log(`Caller: ${caller} got the response for the Subject: ${subject} of the '${chanelName} channel, in ${new Date().valueOf() - start.valueOf()}ms ****************************************`);
        return response;
    }

   
    //#endregion Constructors and Public

    //#region Private

    private static getInstance() : MessagingService
    {
        return MessagingService._instance;
    }

    //#endregion Private
    
}