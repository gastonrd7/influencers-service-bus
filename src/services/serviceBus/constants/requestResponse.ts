export default class RequestResponse{
    public init(entities?:any[], entity?, count?: Number, id?: Number, error?, ok?: boolean) {
        this.entities = entities;
        this.entity = entity;
        this.count = count;
        this.id = id;
        this.error = error;
        this.ok = ok
    }

    public  entities?:any[];
    public  entity?;
    public  count?: Number;
    public id?: Number;
    public error;
    public ok?: boolean;
}