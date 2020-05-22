import "reflect-metadata";
import { Container } from "inversify";
import IMessagingBus from "../serviceBus/interfaces/IMessagingBus";
import NatsMessagingBus from '../serviceBus/implementation/nats/NatsMessagingBus';
import { OtherMessagingBus } from '../serviceBus/implementation/other/OtherMessagingBus';
import SERVICE_IDENTIFIER from "./identifiers";
import MESSAGING_TAG from "../serviceBus/constants/tags";

let container = new Container();

container.bind<IMessagingBus>(SERVICE_IDENTIFIER.MESSENGER).to(NatsMessagingBus).whenTargetNamed(MESSAGING_TAG.NATS);
container.bind<IMessagingBus>(SERVICE_IDENTIFIER.MESSENGER).to(OtherMessagingBus).whenTargetNamed(MESSAGING_TAG.OTHER);


export default container;
