import {
  ChannelMessage,
  EMarkdownType,
  MezonClient,
  TokenSentEvent,
} from "mezon-sdk";
import { addUser, sendMessage, updateMessage } from "../ultis/fn";
import User from "../models/User";
import { commands } from "../commands/bot.command";
import Reward from "../models/Reward";
import RoleReward from "../models/Role_rewards";

export class MezonBotListener {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onChannelMessage(this.onChannelMessage.bind(this));
    this.client.onTokenSend(this.onTokenSend.bind(this));
    this.client.onAddClanUser(this.onAddClanUser.bind(this));
    this.client.onMessageButtonClicked(this.onMessageButtonClicked.bind(this));
  }

  private async onChannelMessage(data: ChannelMessage) {
    await addUser(data.sender_id, data.username!, 0, 0);
    if (data.sender_id === process.env.BOT) return;

    if (
      typeof data?.content?.t === "string" &&
      data.content.t.startsWith("!")
    ) {
      const args = data.content.t.slice(1).trim().split(/ +/);
      const command = args.shift()?.toLowerCase();
      const user_id = data?.mentions?.[0]?.user_id ?? null;

      if (!command || !(command in commands)) return;

      try {
        await commands[command as keyof typeof commands].execute(
          data,
          user_id!,
          args
        );
      } catch (err) {
        await sendMessage(
          data.channel_id,
          "⚠️ Lỗi cú pháp, vui lòng xem lại lệnh `!help`.",
          data.clan_id!
        );
      }
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
      const textDailySuccess =
        "```" + "The " + name + " has been cancelled" + "```";
      const message = {
        t: textDailySuccess,
        mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: textDailySuccess.length }],
      };
      await updateMessage(message, data.channel_id, data?.message_id!);
    }

    if (!data?.extra_data) {
      return;
    }
    const dataForm = JSON.parse(data?.extra_data);

    if (action === "submit") {
      if (name === "trophy") {
        if (handle === "new") {
          const existingReward = await Reward.findOne({
            where: { name: dataForm.name },
          });

          if (existingReward) {
            const text =
              "```" +
              "🏆 The " +
              name +
              " " +
              dataForm.name +
              " already exists" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
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
            const text =
              "```" +
              "🏆 The " +
              name +
              " " +
              dataForm.name +
              " create successfully" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const text =
              "```" +
              "Value must be a positive integer greater than or equal to 0" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
            await updateMessage(message, data.channel_id, data?.message_id!);
          }
        }
        if (handle === "upd") {
          console.log(id);
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
            const text =
              "```" +
              "🏆 The " +
              name +
              " " +
              dataForm.name +
              " update successfully" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const text =
              "```" +
              "Value must be a positive integer greater than or equal to 0" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
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
            const text =
              "```" +
              "🏆 The " +
              name +
              " " +
              dataForm.role_name +
              " already exists" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
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
            const text =
              "```" +
              "🏆 The " +
              name +
              " " +
              dataForm.role_name +
              " create successfully" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const text =
              "```" +
              "Value must be a positive integer greater than or equal to 0" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
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
            const text =
              "```" +
              "🏆 The " +
              name +
              " " +
              dataForm.role_name +
              " update successfully" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
            await updateMessage(message, data.channel_id, data?.message_id!);
          } else {
            const text =
              "```" +
              "Value must be a positive integer greater than or equal to 0" +
              "```";
            const message = {
              t: text,
              mk: [{ type: EMarkdownType.TRIPLE, s: 0, e: text.length }],
            };
            await updateMessage(message, data.channel_id, data?.message_id!);
          }
        }
      }
    }
  }
}
