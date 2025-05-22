import { MezonClient } from "mezon-sdk";
import { MessageEventHandler } from "./messageEvent";
import { TokenEventHandler } from "./tokenEvent";
import { UserEventHandler } from "./userEvent";
import { EventHandler } from "./eventHandle";

export class MezonBotListener {
  private handlers: Array<{ register: () => void }> = [];

  constructor(private readonly client: MezonClient) {
    this.handlers = [
      new MessageEventHandler(client),
      new TokenEventHandler(client),
      new UserEventHandler(client),
      new EventHandler(client),
    ];
  }

  public listentEvent() {
    this.handlers.forEach((handler) => handler.register());
  }
}
