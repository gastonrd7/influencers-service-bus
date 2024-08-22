import * as globalModels from 'influencers-models';
import BasePayload from './baseRequest';

export default class RequestPayload extends BasePayload{
    constructor(){
        super();
    }
    public init(model: globalModels.Model, select?: string[], where?, args?, ids?: any[], limit? : Number, page : Number = 0, computedField?: string, orderBy?: string[], asc = true ){
        this.model = model;
        this.select = select;
        this.where = where;
        this.args = args;
        this.limit = limit;
        this.page = page;
        this.ids = ids;
        this.computedField = computedField;
        this.orderBy = orderBy;
        this.asc = asc;

    }
    
    public model: globalModels.Model;
    public select : string[];
    public args;
    public where;
    public limit? : Number;
    public page: Number;
    public ids?: any[];
    public computedField?: string;
    public orderBy: string[];
    public asc: boolean;
}