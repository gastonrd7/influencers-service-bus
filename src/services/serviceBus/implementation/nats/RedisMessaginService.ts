import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as subCallback from '../../specialTypes/functionsTypes';
import { SocialMediaRequestPayload, SocialMediaRequestResponse } from 'adme-common';
import IMessageBus from '../../interfaces/IMessagingBus';
import requestResponse from '../../constants/requestResponse';
import requestPayload from '../../constants/requestPayload';
import { injectable } from 'inversify';

interface PromisePair {
    resolve: (value?: requestResponse | SocialMediaRequestResponse) => void;
    reject: (reason?: any) => void;
}

@injectable()
export default class RedisMessagingBus implements IMessageBus {
    private redisPublisher: Redis.Redis;
    private redisSubscriber: Redis.Redis;
    private requestsListeners: Map<string, PromisePair>;
    private subscriptions: Map<number, string>;
    private nextSubscriptionId: number;
    private messagingExchangeTimeout: number;
    public name: string = 'RedisMessagingBus';

    constructor() {
        this.messagingExchangeTimeout = 5000; // Default value of 5 seconds
        this.requestsListeners = new Map<string, PromisePair>();
        this.subscriptions = new Map<number, string>();
        this.nextSubscriptionId = 0;
    }

    public async init(): Promise<void> {
        // Configuración inicial de los clientes de Redis
        this.redisPublisher = new Redis(6381, 'localhost', {
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        this.redisSubscriber = new Redis(6381, 'localhost', {
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        // Esperar a que ambos clientes estén listos
        await Promise.all([
            new Promise<void>((resolve) => this.redisPublisher.once('ready', resolve)),
            new Promise<void>((resolve) => this.redisSubscriber.once('ready', resolve)),
        ]);

        this.initializeRequestListener();
    }

    private initializeRequestListener(): void {
        this.redisSubscriber.on('message', (channel, message) => {
            const parsedMessage = JSON.parse(message);
            const requestId = parsedMessage.requestId;
            if (requestId && this.requestsListeners.has(requestId)) {
                const { resolve } = this.requestsListeners.get(requestId)!;
                resolve(parsedMessage.data);
                this.requestsListeners.delete(requestId);
            }
        });
    }

    public async publish(subject: string, message: any): Promise<void> {
        await this.redisPublisher.publish(subject, JSON.stringify(message));
    }

    public async request(subject: string, timeout: number, message: requestPayload | SocialMediaRequestPayload): Promise<requestResponse | SocialMediaRequestResponse> {
        const requestId = uuidv4();
        const responseChannel = `response-${requestId}`;

        return new Promise(async (resolve, reject) => {
            this.requestsListeners.set(requestId, { resolve, reject });

            await this.redisSubscriber.subscribe(responseChannel);
            this.redisPublisher.publish(subject, JSON.stringify({ ...message, requestId, responseChannel }));

            setTimeout(() => {
                if (this.requestsListeners.has(requestId)) {
                    this.requestsListeners.get(requestId)?.reject(new Error('Request timed out'));
                    this.requestsListeners.delete(requestId);
                    this.redisSubscriber.unsubscribe(responseChannel);
                }
            }, timeout || this.messagingExchangeTimeout);
        });
    }

    public async subscribe(serviceName: string, subject: string, callback: subCallback.subcribeCallback): Promise<number> {
        const subscriptionId = this.nextSubscriptionId++;
        this.subscriptions.set(subscriptionId, subject);

        await this.redisSubscriber.subscribe(subject);
        this.redisSubscriber.on('message', (receivedChannel, message) => {
            if (subject === receivedChannel) {
                const parsedMessage = JSON.parse(message);
                callback(null, parsedMessage); // Fix: Pass null as the first argument
            }
        });

        return subscriptionId;
    }

    public async unsubscribe(subscriptionId: number): Promise<void> {
        const subject = this.subscriptions.get(subscriptionId);
        if (subject) {
            await this.redisSubscriber.unsubscribe(subject);
            this.subscriptions.delete(subscriptionId);
        }
    }

    public async close(): Promise<void> {
        await this.redisPublisher.quit();
        await this.redisSubscriber.quit();
    }
}
