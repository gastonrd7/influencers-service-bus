export default class RequestResponse{
    public init(entities?:any[], entity?, count?: Number, id?: Number, error?) {
        this.entities = entities;
        this.entity = entity;
        this.count = count;
        this.id = id;
        this.error = error;
    }

    public  entities?:any[];
    public  entity?;
    public  count?: Number;
    public id?: Number;
    public error;
}