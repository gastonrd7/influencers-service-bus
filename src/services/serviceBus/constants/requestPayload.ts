import * as universalModels from 'influencers-models';

export default class RequestPayload{
    public init(model: universalModels.Model, select?: string[], where?, args?, id?, limit? : Number, page : Number = 0, computedField?: string, orderBy?: string[], asc = true ){
        this.model = model;
        this.select = select;
        this.where = where;
        this.args = args;
        this.limit = limit;
        this.page = page;
        this.id = id;
        this.computedField = computedField;
        this.orderBy = orderBy;
        this.asc = asc;

    }
    
    public model: universalModels.Model;
    public select : string[];
    public args;
    public where;
    public limit? : Number;
    public page: Number;
    public id?;
    public computedField?: string;
    public orderBy: string[];
    public asc: boolean;
}