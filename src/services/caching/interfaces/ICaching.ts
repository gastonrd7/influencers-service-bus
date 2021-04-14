import * as subCallback from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';

export default interface ICaching {
    
    init(port: number, host: string) : void;
    set(key: string, value: any) : Promise<boolean>;
    setEx(key: string, expireSeconds: number, value: any) : Promise<boolean>;
    get(key: string) : Promise<any | null>;
    incrementBy(key: string, incrementAmount: number): Promise<void>;
    name:string

}


