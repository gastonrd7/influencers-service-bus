import {ExternalPost} from "./ExternalPost";
import { platformEnum } from "influencers-models";

export class ReadPostInsightsResponseContent{
    constructor(public postId: string, public platform: platformEnum, public externalPost: ExternalPost){}
}