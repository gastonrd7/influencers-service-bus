import IMessagingBus from '../interfaces/IMessagingBus';
import { inject } from "inversify";
import TAG from '../constants/tags';
import SERVICE_IDENTIFIER from '../../config/identifiers';
import container from "../../config/ioc_config";
import * as subsCaller from '../specialTypes/functionsTypes';
import requestPayload from '../constants/requestPayload';
import requestResponse from '../constants/requestResponse';
import { Logger } from 'adme-common';
import { MetricNames, MetricsService, SocialMediaRequestResponse } from 'adme-common';
import CachingService, { CACHING_SERVICE_ENUM } from '../../caching/service/CachingService';
import uuid = require('uuid');
import { performance } from 'perf_hooks';
import { propagation, context, trace, Span, Tracer, SpanKind } from '@opentelemetry/api';

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
            throw new Error("Error: Instantiation failed: Use MessagingService.getInstance() instead of new.");
        }

        MessagingService._instance = this;
    }

    public static async init(requestTimeout: number = 100000): Promise<void> {
        const instance = this.getInstance();
        instance._messagingClient = container.getNamed<IMessagingBus>(SERVICE_IDENTIFIER.MESSENGER, TAG.NATS);
        instance._requestTimeout = requestTimeout;

        // Initialize the messaging client
        await instance._messagingClient.init();

    }

    public static async publish(caller: string, subject: string, message, currentSpan: Span): Promise<void> {
        const instance = this.getInstance();
        const tracer = (global as any).tracer as Tracer;
        const span = tracer.startSpan(`${caller}-${subject}`, { kind: SpanKind.PRODUCER }, trace.setSpan(context.active(), currentSpan));

        const payloadOrKeys = await this.splitPayload(caller, subject, message);

        if (!payloadOrKeys) {
            span.end();

            throw new Error(`Error: Payload is empty. ${caller} cannot publish: ${subject}`);
            ;
        }

        context.with(trace.setSpan(context.active(), span), async () => {
            const tracingHeaders = {};
            propagation.inject(context.active(), tracingHeaders);
            payloadOrKeys.tracingHeaders = tracingHeaders;

            span.setAttribute('span.kind', 'producer');
            span.addEvent('publish', { subject, message });

            try {
                await instance._messagingClient.publish(subject, payloadOrKeys);
                MetricsService.incrementCounter(MetricNames.MSG_MESSAGES_PUBLISHED, { service: caller });
                MetricsService.observeHistogram(MetricNames.MSG_MESSAGES_PUBLISHED_RATE, { service: caller }, 1);
                Logger.log(`${caller} has published: ${subject} ****************************************`);
                span.end();
            } catch (error) {
                span.setAttribute('error', true);
                span.addEvent('error', { message: error.message });
                span.end();
                console.log(`Error to publish: ${subject}`, payloadOrKeys);
                throw error;
            }
        });
    }

    public static async subscribe(caller: string, subject: string, callback: subsCaller.subcribeCallback): Promise<void> {
        const instance = this.getInstance();
        MetricsService.incrementCounter(MetricNames.MSG_MICROSERVICES_SUBSCRIPTIONS, { service: caller });

        await instance._messagingClient.subscribe(caller, subject, async (err, payloadOrKeys) => {
            const tracer = (global as any).tracer as Tracer;
            const parentSpanContext = propagation.extract(context.active(), payloadOrKeys.tracingHeaders);
            const span = tracer.startSpan(subject, { kind: SpanKind.CONSUMER }, parentSpanContext);

            context.with(trace.setSpan(context.active(), span), async () => {
                let constructedPayload = await this.reconstructPayload(subject, payloadOrKeys['data'], false);
                constructedPayload.tracingHeaders = span;
                await callback(err, { ...payloadOrKeys, data: constructedPayload });
                constructedPayload = null;
                span.end();
            });

            // Update metric for messages received
            MetricsService.incrementCounter(MetricNames.MSG_MESSAGES_RECEIVED, { service: caller });
            MetricsService.observeHistogram(MetricNames.MSG_MESSAGES_RECEIVED_RATE, { service: caller }, 1); // Assuming this is a rate metric
        });
        Logger.log(`${caller} has been subscribed to ${subject} - OK! ****************************************`);
    }

    public static async request(caller: string, subject: string, message: any, currentSpan: Span): Promise<requestResponse | SocialMediaRequestResponse> {
        const instance = this.getInstance();
        const tracer = (global as any).tracer as Tracer;
        const span: Span = tracer.startSpan(`${caller}-${subject}`, { kind: SpanKind.CLIENT }, trace.setSpan(context.active(), currentSpan));

        const payloadOrKeys = await this.splitPayload(caller, subject, message);
        Logger.log(`Caller: ${caller} sent a request for the Subject: ${subject}. Payload: ${JSON.stringify(payloadOrKeys)} ****************************************`);

        var start = new Date();

        return context.with(trace.setSpan(context.active(), span), async () => {
            const tracingHeaders = {};
            propagation.inject(context.active(), tracingHeaders);
            payloadOrKeys.tracingHeaders = tracingHeaders;

            span.setAttribute('span.kind', 'client');
            span.addEvent('request', { subject, message });

            try {
                let responseOrKeys = await instance._messagingClient.request(subject.toString(), instance._requestTimeout, payloadOrKeys);

                const latency = new Date().valueOf() - start.valueOf();
                Logger.log(`Caller: ${caller} got the response for the Subject: ${subject} in ${latency}ms ****************************************`);

                // Update metric for request count and latency
                MetricsService.incrementCounter(MetricNames.MSG_REQUEST, { route: subject, method: caller });
                MetricsService.observeHistogram(MetricNames.MSG_REQUEST_RATE, { route: subject, method: caller }, 1); // Assuming this is a rate metric
                MetricsService.observeHistogram(MetricNames.MSG_REQUEST_LATENCY_MS, { route: subject, method: caller }, latency);

                span.end();
                return this.reconstructPayload(subject, responseOrKeys, true);
            } catch (error) {
                span.setAttribute('error', true);
                span.addEvent('error', { message: error.message });
                span.addEvent('request', { caller, subject, message });
                console.log(error, { caller, subject, message })
                span.end();
                throw new Error(JSON.stringify({
                    message: `Error in messagingService request method`,
                    caller,
                    subject,
                    Message: message,
                    OriginalErrorMessage: error.message,
                    cause: error
                }, null, 2));
            }
        });
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
