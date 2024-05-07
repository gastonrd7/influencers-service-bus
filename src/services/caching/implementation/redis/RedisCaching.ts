// import { injectable } from "inversify";
// import { Logger } from 'adme-common';
// import ICaching from '../../interfaces/ICaching';
// import Redis from 'ioredis';

// @injectable()
// export default class RedisCaching implements ICaching {
    
//     //#region Fields
    
//     private redisClient: Redis.Redis;

//     //#endregion Fields
    
//     //#region Constructors
    
//     constructor() {
//         this.name = "Redis Caching service";
//     }
    
//     //#endregion Constructors

//     //#region ImessagingBus implementation

//     public async init(port: number, host: string): Promise<void>{
//         try {
//             console.log(`Initializing Redis connection to ${host}:${port}`);
//             this.redisClient = new Redis({
//                 port: port,
//                 host: host,
//                 retryStrategy: function (times) {
//                     const delay = Math.min(times * 50, 2000);
//                     if (times > 10) {
//                         console.error("Retry time exhausted");
//                         throw new Error("Retry time exhausted");
//                     }
//                     return delay;
//                 }
//             });

//             this.redisClient.on("connect", () => {
//                 console.log(`Redis connected to ${host}:${port}`);
//             });

//             this.redisClient.on("ready", () => {
//                 console.log(`Redis is ready`);
//             });

//             this.redisClient.on("error", (err) => {
//                 console.error("Redis error", err);
//             });

//             this.redisClient.on("close", () => {
//                 console.log("Redis connection closed");
//             });

//         } catch (e) {
//             console.error("Failed to initialize Redis", e);
//             throw e;
//         }
//     }

//     public name: string;

//     public async set(key: string, value: any): Promise<boolean> {
//         try {
//             const result = await this.redisClient.set(key, value);
//             return result === 'OK';
//         } catch (e) {
//             Logger.error(`Error setting key ${key} in Redis`, e);
//             throw e;
//         }
//     }

//     public async setEx(key: string, expireSeconds: number, value: any): Promise<boolean> {
//         try {
//             const result = await this.redisClient.set(key, value, 'EX', expireSeconds);
//             return result === 'OK';
//         } catch (e) {
//             Logger.error(`Error setting key ${key} with expiration in Redis`, e);
//             throw e;
//         }
//     }

//     public async get(key: string): Promise<any | null> {
//         try {
//             return await this.redisClient.get(key);
//         } catch (e) {
//             Logger.error(`Error getting key ${key} from Redis`, e);
//             throw e;
//         }
//     }

//     public async del(key: string): Promise<void> {
//         try {
//             const result = await this.redisClient.del(key);
//             if (result !== 1) {
//                 console.log(`Key ${key} not found to delete.`);
//             }
//         } catch (e) {
//             Logger.error(`Error deleting key ${key}`, e);
//             throw e;
//         }
//     }

//     public async incrementBy(key: string, incrementAmount: number = 1): Promise<void> {
//         try {
//             await this.redisClient.incrby(key, incrementAmount);
//         } catch (e) {
//             Logger.error(`Error incrementing key ${key} by ${incrementAmount}`, e);
//             throw e;
//         }
//     }
    
//     //#endregion ImessagingBus implementation
    
// }



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
                        const msg = `Redis connectedion failed. Attempting one more time!`;
                        console.error(msg, options);
                        Logger.error(msg, options);
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
                const msg = `redis Connected`;
                console.info(msg);
                Logger.log(msg);
            });
    
            this._cachingClient.on("error", function(err) {
                const msg = `Error on Redis communication`;
                console.error(msg, err);
                Logger.error(msg, err);
            });

            console.log(`Cache connected to ${this.name} Redis - Duration: ${new Date().valueOf() - start.valueOf()}ms`);
            return Promise.resolve();

        } catch (e){
            console.error(`${this.name} redis error`, e);
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

    public async del(key: string): Promise<void> {
        try {
            const result = await this._cachingClient.del(key);
            if (result === 1) {
            } else {
                Logger.log(`Key ${key} does not exist.`);
                throw new Error("Key does not exist.");
                
            }
        } catch (err) {
            console.error(`Error deleting key ${key}:`, err);
            throw err;  // Propagate the error if needed.
        }
        
    }
    

    //#endregion ImessagingBus implementation
    
}