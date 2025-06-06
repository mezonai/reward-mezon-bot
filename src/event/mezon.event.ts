import { MezonClient } from "mezon-sdk";
import { MessageEventHandler } from "./messageEvent";
import { TokenEventHandler } from "./tokenEvent";
import { UserEventHandler } from "./userEvent";
import { EventHandler } from "./eventHandle";

export class MezonBotListener {
  private handlers: Array<{ register: () => void }> = [];

  constructor(private readonly client: MezonClient) {
    this.handlers = [
      new MessageEventHandler(this.client),
      new TokenEventHandler(this.client),
      new UserEventHandler(this.client),
      new EventHandler(this.client),
    ];
  }

  public listentEvent() {
    this.handlers.forEach((handler) => handler.register());
  }
}
