import {
  ChannelMessage,
  EMarkdownType,
  MezonClient,
  TokenSentEvent,
} from "mezon-sdk";
import { addUser } from "../ultis/fn";
import User from "../models/User";
import { commands } from "../commands/bot.command";
import Reward from "../models/Reward";
import RoleReward from "../models/Role_rewards";
import { sendMessage, updateMessage } from "../ultis/message";

export class MezonBotListener {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onChannelMessage(this.onChannelMessage.bind(this));
    this.client.onTokenSend(this.onTokenSend.bind(this));
    this.client.onAddClanUser(this.onAddClanUser.bind(this));
    this.client.onMessageButtonClicked(this.onMessageButtonClicked.bind(this));
  }

  private async onChannelMessage(data: ChannelMessage) {
    await addUser(data.sender_id, data.username!, 0, 0, data?.content?.t!);
    if (data.sender_id === process.env.BOT) return;

    if (
      typeof data?.content?.t === "string" &&
      data.content.t.startsWith("@bot-reward")
    ) {
      const args = data.content.t.replace("@bot-reward", "").trim().split(/ +/);
      const user_id = data?.mentions?.[0]?.user_id ?? null;
      try {
        await commands["ask"].execute(data, user_id!, args);
      } catch (error) {}
    }

    if (
      typeof data?.content?.t === "string" &&
      data.content.t.startsWith("!")
    ) {
      const text = data.content.t;
      await this.handleExclamationCommand(data, text);
    }
  }

  private async onTokenSend(data: TokenSentEvent) {
    if (data.amount <= 0) return;
    if (data.receiver_id === process.env.BOT && data.sender_id) {
      try {
        let [user, bot] = await Promise.all([
          User.findOne({ where: { user_id: data.sender_id } }),
          User.findOne({ where: { user_id: process.env.BOT } }),
        ]);

        if (bot) {
          bot.amount = (Number(bot.amount) || 0) + Number(data.amount);
          await bot.save();
        } else {
          await addUser(process.env.BOT, process.env.BOT_NAME!, data.amount, 0);
        }

        if (!user) {
          await addUser(data.sender_id, data.sender_name!, data.amount, 0);
          user = await User.findOne({ where: { user_id: data.sender_id } });
          if (!user) throw new Error("User creation failed");
        }

        user.amount = (Number(user.amount) || 0) + Number(data.amount);
        await user.save();
      } catch (e) {
        console.error("❌ TokenSentEvent Error:", e);
      }
    }
  }

  private async onAddClanUser(data: any) {
    await addUser(data.user.user_id, data.user.username!, 0, 0);
  }

  private async onMessageButtonClicked(data: any) {
    const [action, name, handle, id] = data.button_id.split("_");

    if (action === "cancel") {
      const message: string = "The " + name + " has been cancelled";
      await updateMessage(message, data?.channel_id, data?.message_id!);
    }

    if (!data?.extra_data) {
      return;
    }
    const dataForm = JSON.parse(data?.extra_data);

    if (action === "submit") {
      if (name === "trophy") {
        if (handle === "new") {
          const existingReward = await Reward.findOne({
            where: { name: dataForm?.name },
          });
          if (existingReward) {
            const message: string =
              "🏆 The " + name + " " + dataForm.name + " already exists";
            await updateMessage(message, data.channel_id, data?.message_id!);
            return;
          }
          if (Number.isInteger(+dataForm.points) && +dataForm.points >= 0) {
            await Reward.create({
              name: dataForm.name,
              description: dataForm.description,
              points: dataForm.points,
              createdBy: data.user_id,
            });
            const message: string =
              "🏆 The " + name + " " + dataForm.name + " create successfully";
            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const message =
              "Value must be a positive integer greater than or equal to 0";

            await updateMessage(message, data.channel_id, data?.message_id!);
          }
        }
        if (handle === "upd") {
          if (!id) return;
          if (Number.isInteger(+dataForm.points) && +dataForm.points >= 0) {
            await Reward.update(
              {
                name: dataForm.name,
                description: dataForm.description,
                points: dataForm.points,
                createdBy: data.user_id,
                updatedAt: new Date(),
              },
              { where: { id } }
            );
            const message =
              "🏆 The " + name + " " + dataForm.name + " update successfully";

            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const message =
              "Value must be a positive integer greater than or equal to 0";
            await updateMessage(message, data.channel_id, data?.message_id!);
          }
        }
      }
      // reward
      if (name === "reward") {
        if (handle === "new") {
          const existingReward = await RoleReward.findOne({
            where: { role_name: dataForm.role_name },
          });

          if (existingReward) {
            const message =
              "🏆 The " + name + " " + dataForm.role_name + " already exists";

            await updateMessage(message, data.channel_id, data?.message_id!);
            return;
          }
          if (
            Number.isInteger(+dataForm.point_threshold) &&
            +dataForm.point_threshold >= 0
          ) {
            await RoleReward.create({
              role_name: dataForm.role_name,
              point_threshold: dataForm.point_threshold,
            });
            const message =
              "🏆 The " +
              name +
              " " +
              dataForm.role_name +
              " create successfully";

            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const message =
              "Value must be a positive integer greater than or equal to 0";
            await updateMessage(message, data.channel_id, data?.message_id!);
          }
        }
        if (handle === "upd") {
          if (!id) return;
          if (
            Number.isInteger(+dataForm.point_threshold) &&
            +dataForm.point_threshold >= 0
          ) {
            await RoleReward.update(
              {
                role_name: dataForm.role_name,
                point_threshold: dataForm.point_threshold,
                updatedAt: new Date(),
              },
              { where: { id } }
            );
            const message =
              "🏆 The " +
              name +
              " " +
              dataForm.role_name +
              " update successfully";

            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const message =
              "Value must be a positive integer greater than or equal to 0";

            await updateMessage(message, data.channel_id, data?.message_id!);
          }
        }
      }
    }
  }

  private async handleExclamationCommand(data: ChannelMessage, text: string) {
    const args = text.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (!command || !(command in commands)) return;

    const userId = data?.mentions?.[0]?.user_id ?? data.sender_id;

    try {
      await commands[command as keyof typeof commands].execute(
        data,
        userId,
        args
      );
    } catch (error) {
      await sendMessage(
        data.channel_id,
        "⚠️ Lỗi cú pháp, vui lòng xem lại lệnh `!help`."
      );
    }
  }
}
