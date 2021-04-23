import { injectable } from "inversify";
import { Logger } from 'adme-common';
import ICaching from '../../interfaces/ICaching';
import asyncRedis from "async-redis";
import { RedisClient } from "redis";
import RedisClustr from 'redis-clustr';



@injectable()
export default class RedisCaching implements ICaching {
    

    //#region Fields
    
    private _cachingClient;
    private _cachingClientAsyncGet: { get: (key: string) => any ; };

    //#endregion Fields
    
    //#region Constructors
    
    constructor() {
        this.name = "Redis Caching serevice";
    }
    
    

    //#endregion Constructors

    //#region ImessagingBus implementation

    public async init(port: number, host: string): Promise<void>{

        var start = new Date();
        try{
            // this._cachingClient = asyncRedis.createClient(
            //     port,
            //     host,
            //     {
            //         retry_strategy: function (options) {
            //             if (options.error && options.error.code === "ECONNREFUSED") {
            //                 // End reconnecting on a specific error and flush all commands with
            //                 // a individual error
            //                 return new Error("The server refused the connection");
            //             }
            //             if (options.total_retry_time > 1000 * 60 * 60) {
            //                 // End reconnecting after a specific timeout and flush all commands
            //                 // with a individual error
            //                 return new Error("Retry time exhausted");
            //             }
            //             if (options.attempt > 10) {
            //                 // End reconnecting with built in error
            //                 return undefined;
            //             }
            //             // reconnect after
            //             return Math.min(options.attempt * 100, 3000);
            //         },
            //     }
            // );

            this._cachingClient = new RedisClustr({
                servers: [{
                    host,
                    port
                  }],
                slotInterval: 1000, // default: none. Interval to repeatedly re-fetch cluster slot configuration
                maxQueueLength: 100, // default: no limit. Maximum length of the getSlots queue (basically number of commands that can be queued whilst connecting to the cluster)
                queueShift: false, // default: true. Whether to shift the getSlots callback queue when it's at max length (error oldest callback), or to error on the new callback
                wait: 5000, // default: no timeout. Max time to wait to connect to cluster before sending an error to all getSlots callbacks
                slaves: 'share', // default: 'never'. How to direct readOnly commands: 'never' to use masters only, 'share' to distribute between masters and slaves or 'always' to  only use slaves (if available)
                createClient: function(port, host, options) {
                  return require('redis').createClient(port, host, options);
                }, // default: redis.createClient. Function used to connect to redis, called with arguments above
                redisOptions: {
                  // options passed to the node_redis client https://github.com/NodeRedis/node_redis#options-is-an-object-with-the-following-possible-properties
                  retry_max_delay: 500
                  // etc
                }
              });
    
            this._cachingClient.on("error", function(err) {
                // assert(err instanceof Error);
                // assert(err instanceof AbortError);
                // assert(err instanceof AggregateError);
               
                // // The set and get are aggregated in here
                // assert.strictEqual(err.errors.length, 2);
                // assert.strictEqual(err.code, "NR_CLOSED");
                const msg = `Error on Redis communication`;
                console.error(msg, err);
                Logger.error(msg, err);
            });

            
    
            // this._cachingClientAsyncGet = promisify(this._cachingClient.get).bind(this._cachingClient);
    
            //return await this._cachingClientAsync.then(console.log).catch(console.error);
    
            Logger.log(`Cache connected to Redis - Duration: ${new Date().valueOf() - start.valueOf()}ms`);
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