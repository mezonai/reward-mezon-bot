import { MezonClient } from "mezon-sdk";
import { addUser } from "../services/system.service";

export class UserEventHandler {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onAddClanUser(this.onAddClanUser.bind(this));
    this.client.onRoleAssign(this.onRoleAssign.bind(this));
    this.client.onRoleEvent(this.onRoleEvent.bind(this));
  }

  public async onAddClanUser(data: any) {
    await addUser(data.user.user_id, data.user.username!, 0, data.clan_id);
  }

  public async onRoleAssign(data: any) {}

  public async onRoleEvent(data: any) {}
}
