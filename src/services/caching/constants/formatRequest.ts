import * as sources from './sourcesEnum';
import * as requestEnum from './requestEnum';
import * as models from 'influencers-models';

export default async function formatRequest(source: sources.Source, request: requestEnum.DataStorage_Request | requestEnum.SocialMedia_Request){
    return await `${source.toString().toUpperCase()}_${request.toString().toUpperCase()}`;
}