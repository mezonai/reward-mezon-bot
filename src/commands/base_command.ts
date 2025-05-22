import { ChannelMessage, MezonClient } from "mezon-sdk";

export abstract class CommandMessage {
  abstract execute(
    args: string[],
    message: ChannelMessage,
    commandName?: string
  ): any;
}
