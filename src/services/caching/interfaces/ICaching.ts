import * as subCallback from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';

export default interface ICaching {
    
    init(port: number, host: string) : void;
    set(key: string, value: any) : Promise<boolean>;
    setEx(key: string, expireSeconds: number, value: any) : Promise<boolean>;
    get(key: string) : Promise<any | null>;
    del(key: string) : Promise<void>;
    incrementBy(key: string, incrementAmount: number): Promise<void>;
    lpush(key: string, value: string): Promise<void> ;
    rpop(key: string): Promise<string>;
    llen(key: string): Promise<number>;
    sadd(key: string, value: string): Promise<void>;
    srem(key: string, value: string): Promise<void>;
    sismember(key: string, value: string): Promise<boolean>;
    name:string

}


