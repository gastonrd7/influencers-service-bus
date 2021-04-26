import ICaching from '../interfaces/ICaching';
import { inject, injectable, named } from "inversify";
import TAG from '../constants/tags'
import SERVICE_IDENTIFIER from '../../config/identifiers';
import container from "../../config/ioc_config";
import * as subsCaller from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { Logger } from 'adme-common';
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';
import uuid = require('uuid');


export default class CachingService {
   
    //#region Fields

    private static _instance : CachingService = new CachingService();
    @inject(SERVICE_IDENTIFIER.CACHING) private _cachingClient : ICaching ;
    private _requestTimeout : number;

    //#endregion Fields

    //#region Constructors and Public 

    constructor() {
        if(CachingService._instance){
            throw new Error("Error: Instantiation failed: Use CachingService.getInstance() instead of new.");
        }
        
        CachingService._instance = this;
    }

    public static async init(port: number, host: string):Promise<void>{
        this.getInstance()._cachingClient = container.getNamed<ICaching>(SERVICE_IDENTIFIER.CACHING, TAG.REDIS);
        await this.getInstance()._cachingClient.init(port, host);
    }

    public static async set(key: string, value: any): Promise<boolean> {
        try{
            const response = await this.getInstance()._cachingClient.set(key, value);
            return Promise.resolve(response);
        }
        catch (e){
            console.error(e);
            throw e;
        }
        
    }
    public static async get(key: string): Promise<any | null> {
        try{
            return await this.getInstance()._cachingClient.get(key);
        }
        catch (e){
            console.error(e);
            throw e;
        }
    }

    public static async incrementBy(key: string, incrementAmount?: number): Promise<void> {
        return await this.getInstance()._cachingClient.incrementBy(key, incrementAmount);
    }

    public static async getExecutionToken(serviceName: string) : Promise<string> {
        const token = uuid.v4();
        await this.getInstance()._cachingClient.set(serviceName, token);
        return Promise.resolve(token);
    }
    
    public static async isThisInstanceTheLastExecution(serviceName: string, executionTokenPermission: string) : Promise<boolean> {
        const token = await this.getInstance()._cachingClient.get(serviceName);
        return Promise.resolve(token === executionTokenPermission);
    }

    public static async amITheFirstOfThelastUpdate(key: string, expireSeconds: number, value: string): Promise<boolean>{
        const valueFromCache = await this.getInstance()._cachingClient.get(key);
        if(!valueFromCache){
            await this.getInstance()._cachingClient.setEx(key, expireSeconds, value);
            return Promise.resolve(true);
        }
        else{
            const needUpdate = value > valueFromCache;
            if (needUpdate){
                Logger.log('key updated');
                await this.getInstance()._cachingClient.setEx(key, expireSeconds, value);
                return Promise.resolve(true);
            }
            else{
                Logger.log('updated must be stopped!');
                return Promise.resolve(false);
            }
        }
        
    }

   
    //#endregion Constructors and Public

    //#region Private

    private static getInstance() : CachingService
    {
        return CachingService._instance;
    }

    //#endregion Private
    
}