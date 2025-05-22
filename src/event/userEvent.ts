import { MezonClient } from "mezon-sdk";
import { addUser } from "../ultis/fn";

export class UserEventHandler {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onAddClanUser(this.onAddClanUser.bind(this));
    this.client.onRoleAssign(this.onRoleAssign.bind(this));
    this.client.onRoleEvent(this.onRoleEvent.bind(this));
  }

  public async onAddClanUser(data: any) {
    await addUser(data.user.user_id, data.user.username!, 0, 0);
  }

  public async onRoleAssign(data: any) {}

  public async onRoleEvent(data: any) {}
}
