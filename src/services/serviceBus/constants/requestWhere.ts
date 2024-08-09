export class RequestWhere {
    constructor(
        public type: RequestWhereType, 
        public field: string, 
        public matchValue: any, 
        public minValue?: any, 
        public maxValue?: any,
        public extraCondition?: any
    ) {}
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
    NOTEQUAL = "NOTEQUAL",
    OR = "OR",
    EXPR = "EXPR",
    EXPR_LESSTHAN = "EXPR_LESSTHAN",
    LOOKUP = "LOOKUP",
    LOOKUP_IN = "LOOKUP_IN",
    LOOKUP_EQUAL = "LOOKUP_EQUAL",
    EXISTS = "EXISTS",
    ADD_FIELDS = "ADD_FIELDS",
    SIZE = "SIZE",
    SOME = "SOME",
    AND = "AND"

}