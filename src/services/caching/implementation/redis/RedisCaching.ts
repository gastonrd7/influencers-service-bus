import { injectable } from "inversify";
import { Logger } from 'adme-common';
import ICaching from '../../interfaces/ICaching';
import asyncRedis from "async-redis";

// import { promisifyAll } from 'bluebird';
// import { promisify } from 'util';



@injectable()
export default class RedisCaching implements ICaching {
    
    //#region Fields
    
    private _cachingClient;

    //#endregion Fields
    
    //#region Constructors
    
    constructor() {
        this.name = "Redis Caching service";
    }
    
    

    //#endregion Constructors

    //#region ImessagingBus implementation

    public async init(port: number, host: string): Promise<void>{

        var start = new Date();
        try{
            this._cachingClient = asyncRedis.createClient(
                port,
                host,
                {
                    retry_strategy: function (options) {
                        console.log('a');
                        if (options.error && options.error.code === "ECONNREFUSED") {
                            // End reconnecting on a specific error and flush all commands with
                            // a individual error
                            return new Error("The server refused the connection");
                        }
                        if (options.total_retry_time > 1000 * 60 * 60) {
                            // End reconnecting after a specific timeout and flush all commands
                            // with a individual error
                            return new Error("Retry time exhausted");
                        }
                        if (options.attempt > 10) {
                            // End reconnecting with built in error
                            return undefined;
                        }
                        // reconnect after
                        return Math.min(options.attempt * 100, 3000);
                    },
                }
            );

            this._cachingClient.on("ready", function(err) {
                const msg = `Redis is ready`;
                console.info(msg);
                Logger.log(msg);
            });

            this._cachingClient.on("connect", function(err) {
                const msg = `Connected`;
                console.info(msg);
                Logger.log(msg);
            });
    
            this._cachingClient.on("error", function(err) {
                const msg = `Error on Redis communication`;
                console.error(msg, err);
                Logger.error(msg, err);
            });

            console.log(`Cache connected to Redis - Duration: ${new Date().valueOf() - start.valueOf()}ms`);
            return Promise.resolve();

        } catch (e){
            console.error(e);
        }

        
        
    }

    public name:string;

    public async set(key: string, value: any): Promise<boolean> {
        return await this._cachingClient.set(key, value);
    }

    public async setEx(key: string, expireSeconds: number, value: any): Promise<boolean> {
        return await this._cachingClient.setex(key, expireSeconds, value);
    }
    public async get(key: string): Promise<any | null> {
        return await this._cachingClient.get(key);
    }

    public async incrementBy(key: string, incrementAmount: number = 1): Promise<void> {
        return await this._cachingClient.incrby(key, incrementAmount);
    }
    

    //#endregion ImessagingBus implementation
    
}