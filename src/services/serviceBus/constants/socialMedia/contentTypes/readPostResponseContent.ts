import {FacebookPost} from "./facebook/post";
import {InstagramPost} from "./instagram/post";
import {TwitterPost} from "./twitter/post";

export class ReadPostResponseContent{
    constructor(public post: FacebookPost | TwitterPost | InstagramPost){}
}