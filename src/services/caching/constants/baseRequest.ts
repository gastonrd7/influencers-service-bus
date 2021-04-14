import * as globalModels from 'influencers-models';
import {TraceItem} from './TraceItem';

export default abstract class BasePayload{
    constructor(public traceItem: TraceItem = null) {}
    
}