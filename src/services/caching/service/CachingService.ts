import ICaching from '../interfaces/ICaching';
import { inject, injectable } from "inversify";
import TAG from '../constants/tags'
import SERVICE_IDENTIFIER from '../../config/identifiers';
import container from "../../config/ioc_config";
import { Logger } from 'adme-common';
import uuid = require('uuid');
import { getCircularReplacer } from '../../../utils';

export enum CACHING_SERVICE_ENUM {
    MODEL_HANDLING_REDIS = "ModelHandlingRedis",
    ESB_REDIS = "EsbRedis"
}

@injectable()
export default class CachingService {
   
    //#region Fields

    private static _modelHandlingInstance: CachingService = new CachingService(CACHING_SERVICE_ENUM.MODEL_HANDLING_REDIS);
    private static _esbInstance: CachingService = new CachingService(CACHING_SERVICE_ENUM.ESB_REDIS);

    private _cachingClient: ICaching;

    //#endregion Fields

    //#region Constructors

    private constructor(service: CACHING_SERVICE_ENUM) {
        if (service === CACHING_SERVICE_ENUM.MODEL_HANDLING_REDIS && CachingService._modelHandlingInstance ||
            service === CACHING_SERVICE_ENUM.ESB_REDIS && CachingService._esbInstance) {
            throw new Error(`Error: Instantiation failed: Use CachingService.getInstance(serviceIdentifier) instead of new.`);
        }

        this._cachingClient = container.getNamed<ICaching>(this.getServiceIdentifier(service), TAG.REDIS);
        this._cachingClient.name = service;
    }

    
    //#endregion Constructors

    //#region Public Static Methods

    public static async init(serviceIdentifier: CACHING_SERVICE_ENUM, port: number, host: string): Promise<void> {
        const instance = this.getInstance(serviceIdentifier);
        await instance._cachingClient.init(port, host);
    }

    public static async set(serviceIdentifier: CACHING_SERVICE_ENUM, key: string, value: any): Promise<boolean> {
        const instance = this.getInstance(serviceIdentifier);
        return await instance._cachingClient.set(key, value);
    }

    public static async setEx(serviceIdentifier: CACHING_SERVICE_ENUM, key: string, expireSeconds: number, value: any): Promise<boolean> {
        const instance = this.getInstance(serviceIdentifier);
        return await instance._cachingClient.setEx(key, expireSeconds, value);
    }

    public static async get(serviceIdentifier: CACHING_SERVICE_ENUM, key: string): Promise<any | null> {
        const instance = this.getInstance(serviceIdentifier);
        return await instance._cachingClient.get(key);
    }

    public static async del(serviceIdentifier: CACHING_SERVICE_ENUM, key: string): Promise<any | null> {
        const instance = this.getInstance(serviceIdentifier);
        return await instance._cachingClient.del(key);
    }

    public static async incrementBy(serviceIdentifier: CACHING_SERVICE_ENUM, key: string, incrementAmount?: number): Promise<void> {
        return await this.getInstance(serviceIdentifier)._cachingClient.incrementBy(key, incrementAmount);
    }

    public static async getExecutionToken(serviceIdentifier: CACHING_SERVICE_ENUM, serviceName: string) : Promise<string> {
        const token = uuid.v4();
        await this.getInstance(serviceIdentifier)._cachingClient.setEx(serviceName, 3600 /** 60 minutes */, token);
        return Promise.resolve(token);
    }
    
    public static async isThisInstanceTheLastExecution(serviceIdentifier: CACHING_SERVICE_ENUM, serviceName: string, executionTokenPermission: string) : Promise<boolean> {
        const token = await this.getInstance(serviceIdentifier)._cachingClient.get(serviceName);
        return Promise.resolve(token === executionTokenPermission);
    }

    public static async amITheFirstOfThelastUpdate(serviceIdentifier: CACHING_SERVICE_ENUM, key: string, expireSeconds: number, value: string): Promise<boolean>{
        const valueFromCache = await this.getInstance(serviceIdentifier)._cachingClient.get(key);
        if(!valueFromCache){
            await this.getInstance(serviceIdentifier)._cachingClient.setEx(key, expireSeconds, value);
            return Promise.resolve(true);
        }
        else{
            const needUpdate = value > valueFromCache;
            if (needUpdate){
                Logger.log('key updated');
                await this.getInstance(serviceIdentifier)._cachingClient.setEx(key, expireSeconds, value);
                return Promise.resolve(true);
            }
            else{
                Logger.log('updated must be stopped!');
                return Promise.resolve(false);
            }
        }
        
    }

    static async queuePush(serviceIdentifier: CACHING_SERVICE_ENUM, key: string, value: any): Promise<void> {
        const instance = this.getInstance(serviceIdentifier);
        const setKey = `${key}:set`;
        let valueStr;
        try {
            valueStr = JSON.stringify(value, getCircularReplacer());
        } catch (error) {
            console.error(`Error parsing value to JSON:`, error, value);
            throw error;
            
        }
    
        // Verificar si el valor ya existe en el conjunto
        const isMember = await instance._cachingClient.sismember(setKey, valueStr);
    
        if (!isMember) {
            // Agregar el valor al conjunto y a la lista
            await instance._cachingClient.sadd(setKey, valueStr);
            await instance._cachingClient.lpush(key, valueStr);
        }
    }

    static async queuePop(serviceIdentifier: CACHING_SERVICE_ENUM, key: string): Promise<any> {
        const instance = this.getInstance(serviceIdentifier);
        const setKey = `${key}:set`;
    
        const result = await instance._cachingClient.rpop(key);
        if (result) {
            // Eliminar el valor del conjunto
            await instance._cachingClient.srem(setKey, result);
            return JSON.parse(result);
        }
        return null;
    }

    static async queueLength(serviceIdentifier: CACHING_SERVICE_ENUM, key: string): Promise<number> {
        const instance = this.getInstance(serviceIdentifier);
        return await instance._cachingClient.llen(key);
    }

   
    //#endregion Constructors and Public

    //#region Private

    public static getInstance(serviceIdentifier: CACHING_SERVICE_ENUM): CachingService {
        if (serviceIdentifier === CACHING_SERVICE_ENUM.MODEL_HANDLING_REDIS) {
            return this._modelHandlingInstance;
        } else if (serviceIdentifier === CACHING_SERVICE_ENUM.ESB_REDIS) {
            return this._esbInstance;
        }
        throw new Error("Invalid service identifier for CachingService singleton instance.");
    }

    private getServiceIdentifier(service: CACHING_SERVICE_ENUM) {
        switch (service) {
            case CACHING_SERVICE_ENUM.ESB_REDIS:
                return SERVICE_IDENTIFIER.ESB_REDIS;
        
            case  CACHING_SERVICE_ENUM.MODEL_HANDLING_REDIS:
                return SERVICE_IDENTIFIER.MODEL_HANDLING_REDIS;
            default:
                break;
        }
    }

    // private getCircularReplacer() {
    //     const seen = new WeakSet();
    //     return (key, value) => {
    //         if (typeof value === "object" && value !== null) {
    //             if (seen.has(value)) {
    //                 return;
    //             }
    //             seen.add(value);
    //         }
    //         if (key === 'tracingHeaders' && value._currentContext) {
    //             const span = value._currentContext.get(Symbol.for('OpenTelemetry Context Key SPAN'));
    //             if (span && span.constructor.name === 'Span') {
    //                 return { ...value, _currentContext: '[Span]' }; // Representar el Span sin eliminarlo
    //             }
    //         }
    //         return value;
    //     };
    // }
    

    //#endregion Private
    
}