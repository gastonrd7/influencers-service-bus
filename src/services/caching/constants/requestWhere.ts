export class RequestWhere{
    constructor(public type: RequestWhereType, public field: string, public matchValue, public minValue?, public maxValue?){}
}

export enum RequestWhereType {
    IN = "IN",
    NOTIN = "NOTIN",
    LIKE = "LIKE",
    GRATEROREQUALTHAN = "GRATEROREQUALTHAN",
    GRATERTHAN = "GRATERTHAN",
    LESSOREQUALTHAN = "LESSOREQUALTHAN",
    LESSTHAN = "LESSTHAN",
    BETWEEN = "BETWEEN",
    EQUAL = "EQUAL",
    NOTEQUAL = "NOTEQUAL"

}