import IMessagingBus from '../interfaces/IMessagingBus';
import { inject, injectable, named } from "inversify";
import TAG from '../constants/tags'
import SERVICE_IDENTIFIER from '../../config/identifiers';
import container from "../../config/ioc_config";
import * as subsCaller from '../specialTypes/functionsTypes'
import requestPayload from '../constants/requestPayload'
import requestResponse from '../constants/requestResponse'
import { Logger } from 'adme-common';
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';
import CachingService, { CACHING_SERVICE_ENUM } from '../../caching/service/CachingService';
import uuid = require('uuid');
import { performance } from 'perf_hooks';

const NATS_MAX_PAYLOAD_SIZE_BYTES = Number.parseInt(process.env.NATS_MAX_PAYLOAD_SIZE_KB) * 1024; // (200KB * 1024) => Bytes
const ESB_REDIS_PAYLOAD_SIZE_BYTES = Number.parseInt(process.env.ESB_REDIS_PAYLOAD_SIZE_MB) * 1024 * 1024; // (10 MB * 1024 * 1024) => Bytes
const ESB_REDIS_EXPIRITY_DURATION_SECS = Number.parseInt(process.env.ESB_REDIS_EXPIRITY_DURATION_SECS);
export default class MessagingService {

    //#region Fields

    private static _instance: MessagingService = new MessagingService();
    @inject(SERVICE_IDENTIFIER.MESSENGER) private _messagingClient: IMessagingBus;
    private _requestTimeout: number;


    //#endregion Fields

    //#region Constructors and Public 

    constructor() {
        if (MessagingService._instance) {
            throw new Error("Error: Instantiation failed: Use NatsMessagingBus.getInstance() instead of new.");
        }

        MessagingService._instance = this;
    }

    public static async init(requestTimeout: number = 100000): Promise<void> {
        this.getInstance()._messagingClient = container.getNamed<IMessagingBus>(SERVICE_IDENTIFIER.MESSENGER, TAG.NATS);
        this.getInstance()._requestTimeout = requestTimeout;
        await this.getInstance()._messagingClient.init();
    }


    public static async publish(caller: string, subject: string, message): Promise<void> {
        const payloadOrKeys = await this.splitPayload(caller, subject, message);
        try {
            await this.getInstance()._messagingClient.publish(subject, payloadOrKeys);
            Logger.log(`${caller} has published: ${subject} ****************************************`);

        } catch (error) {
            console.log(`Error to publish: ${subject}`, payloadOrKeys);
            throw error;
        }


    }

    public static async subscribe(caller: string, subject: string, callback: subsCaller.subcribeCallback): Promise<void> {
        await this.getInstance()._messagingClient.subscribe(caller, subject, async (err, payloadOrKeys) => {
            let constructedPayload = await this.reconstructPayload(subject, payloadOrKeys['data'], false);
            await callback(err, { ...payloadOrKeys, data: constructedPayload});
            constructedPayload = null;

        });
        Logger.log(`${caller} has been subcripted to ${subject} - OK! ****************************************`);
    }

    public static async request(caller: string, subject: string, message: requestPayload | SocialMediaRequestPayload): Promise<requestResponse | SocialMediaRequestResponse> {
        const payloadOrKeys = await this.splitPayload(caller, subject, message);
        Logger.log(`Caller: ${caller} sent a request for the Subject: ${subject}. Payload: ${JSON.stringify(payloadOrKeys)} ****************************************`);

        var start = new Date();

        let responseOrKeys = await this.getInstance()._messagingClient.request(subject.toString(), this.getInstance()._requestTimeout, payloadOrKeys);

        Logger.log(`Caller: ${caller} got the response for the Subject: ${subject} in ${new Date().valueOf() - start.valueOf()}ms ****************************************`);
        return this.reconstructPayload(subject, responseOrKeys, true);
    }


    //#endregion Constructors and Public

    //#region Private

    private static getInstance(): MessagingService {
        return MessagingService._instance;
    }

    private static async splitPayload(caller: string, subject: string, payload: any): Promise<any> {

        const startTransmitting = performance.now();
        let stringifiedPayload = JSON.stringify(payload);
        const size = Buffer.byteLength(stringifiedPayload);
        const sizeInMB = (size / 1024 / 1024).toFixed(2);
        if (size <= NATS_MAX_PAYLOAD_SIZE_BYTES) {
            stringifiedPayload = null;
            return payload;  // Return direct payload if size is under limit
        } else {
            const chunks = [];
            chunks.push(startTransmitting);
            let index = 0;
            while (index < stringifiedPayload.length) {
                const chunk = stringifiedPayload.slice(index, index + ESB_REDIS_PAYLOAD_SIZE_BYTES);
                index += ESB_REDIS_PAYLOAD_SIZE_BYTES;
                const key = uuid.v4();
                const startWriting = performance.now();
                await CachingService.setEx(CACHING_SERVICE_ENUM.ESB_REDIS, key, ESB_REDIS_EXPIRITY_DURATION_SECS, chunk);
                Logger.log(`Writting time: ${((performance.now() - startWriting) / 1000).toFixed(2)} secs. Chunk Size: ${(Buffer.byteLength(chunk) / 1024 / 1024).toFixed(2)} MB`);
                chunks.push(key);
            }
            stringifiedPayload = null;
            Logger.log(`Splitting process took ${((performance.now() - startTransmitting) / 1000).toFixed(2)} secs to be finish. Size: ${sizeInMB} MB. Chunks: ${chunks.length - 1} items.`);
            return chunks;
        }
    }

    private static async reconstructPayload(subject: string, payloadOrKeys: any, deleteKeys: boolean): Promise<any> {
        try {
            if (Array.isArray(payloadOrKeys)) {
                
                const startTransmitting = payloadOrKeys.shift();
                const startOverall = performance.now();
                const payloadPromises = payloadOrKeys.map(key =>
                    CachingService.get(CACHING_SERVICE_ENUM.ESB_REDIS, key)
                );

                const payloads = await Promise.all(payloadPromises);

                if (deleteKeys) {
                    const deletePromises = payloadOrKeys.map(key =>
                        CachingService.del(CACHING_SERVICE_ENUM.ESB_REDIS, key)
                    );
                    await Promise.all(deletePromises);
                }

                if (payloads.length !== payloadOrKeys.length || payloads.includes(null) || payloads.includes(undefined) || payloads.includes('')) {

                    const endOverall = performance.now();
                    payloads.forEach((payload, index) => {
                        if (!payload) {
                            console.error(`ReconstructPayload. Payload not found for key: ${payloadOrKeys[index]}`);
                        }
                    });
                    Logger.error(`ReconstructPayload finished in ${((endOverall - startOverall) / 1000).toFixed(2)} ms. Rescue Payloads: ${payloads.length} of ${payloadOrKeys.length} items.`);
                    throw new Error("Error: Some payloads were not found in the cache.");


                }
                let entirePayload = payloads.join('');
                const constructedPayload = await JSON.parse(entirePayload);
                const endOverall = performance.now();
                Logger.log(`ReconstructPayload finished in ${((endOverall - startOverall) / 1000).toFixed(2)} ms. Total process: ${((endOverall - startTransmitting) / 1000).toFixed(2)} secs. Payload Size: ${(Buffer.byteLength(entirePayload) / 1024 / 1024).toFixed(2)} MB`);
                entirePayload = null;
                return constructedPayload;
            } else {
                return payloadOrKeys;
            }

        } catch (error) {
            throw new Error("Error in reconstructPayload.");
        }

    }

    //#endregion Private

}