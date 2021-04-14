export class TraceItem {
  constructor(
    public traceId: string,
    public traceUseCase: string,
    public traceCauseOnOrigin: string,
    public traceOriginModel: string,
    public traceOriginModelId: string,
    public traceOriginModelField: string = null,
    public traceConsecuenceOnDestination: string = null,
    public traceHandler: string = null,
    public traceHandlerExecutionId: string = null,
    public traceDestinationModel: string = null,
    public traceDestinationModelId: string = null,
    public traceDestinationModelField: string = null,
    public traceCreatedAt: Date = new Date()
  ) {}

  public async ToFormattedString() : Promise<string>{
    const formatedObj = await Object.keys(this).map( async attr => `${attr} ${this[attr]}`).join(', ');
    return Promise.resolve(`{${formatedObj}}`);
  }

  static async getFromObject(obj: any){
    return Promise.resolve(new TraceItem(
      obj.traceId,
      obj.traceUseCase,
      obj.traceCauseOnOrigin,
      obj.traceOriginModel,
      obj.traceOriginModelId,
      obj.traceOriginModelField,
      obj.traceConsecuenceOnDestination,
      obj.traceHandler,
      obj.traceHandlerExecutionId,
      obj.traceDestinationModel,
      obj.traceDestinationModelId, 
      obj.traceDestinationModelField,
      obj.traceCreatedAt,
    ));
  }

  static async getNewTraceItem(previousTraceItem: any, newHandlerExecutionId: string, newHandler: string, newToModel: string){
    return Promise.resolve(new TraceItem(
      previousTraceItem.traceId,
      previousTraceItem.traceUseCase,
      previousTraceItem.traceConsecuenceOnDestination,
      previousTraceItem.traceDestinationModel,
      previousTraceItem.traceDestinationModelId,
      previousTraceItem.traceDestinationModelField,
      previousTraceItem.traceConsecuenceOnDestination,
      newHandler,
      newHandlerExecutionId,
      newToModel,
      // obj.traceDestinationModelId, 
      // obj.traceDestinationModelField,
      // obj.traceCreatedAt,
    ));
  }
}
