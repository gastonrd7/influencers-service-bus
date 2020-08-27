import * as sources from './sourcesEnum'
import { DataStorage_Request, SocialMedia_Request } from '../requestEnum';

export default async function formatRequest(source: sources.Source, request: DataStorage_Request | SocialMedia_Request){
    return await `${source.toString().toUpperCase()}_${request.toString().toUpperCase()}`;
}