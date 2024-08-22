import * as subCallback from '../../specialTypes/functionsTypes'
import { injectable} from "inversify";
import ICaching from '../../interfaces/ICaching';

@injectable()
export class OtherCaching implements ICaching {
    

    constructor() {
        this.name = "Other Messaging serevice"
        throw new Error('This provider is not implemented!')
    }
    sadd(key: string, value: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    srem(key: string, value: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    sismember(key: string, value: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    lpush(key: string, value: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    rpop(key: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    llen(key: string): Promise<number> {
        throw new Error('Method not implemented.');
    }
    del(key: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    setEx(key: string, expireSeconds: number, value: any): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    incrementBy(key: string, incrementAmount: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    set(key: string, value: any): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    get(key: string): Promise<any> {
        throw new Error('Method not implemented.');
    }

    public name:string;

    public async init():Promise<void>{
        throw new Error('Method not implemented!');
    }

    
}
