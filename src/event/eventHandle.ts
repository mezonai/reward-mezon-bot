import { MezonClient } from "mezon-sdk";
import Reward from "../models/Reward";
import RoleReward from "../models/Role_rewards";
import { updateMessage } from "../ultis/message";

const isValidPoints = (points: any): boolean =>
  Number.isInteger(+points) && +points >= 0;

const getSuccessMessage = (
  type: string,
  name: string,
  action: string
): string => `🏆 The ${type} ${name} ${action} successfully`;

const getExistsMessage = (type: string, name: string): string =>
  `🏆 The ${type} ${name} already exists`;

const getInvalidPointsMessage = (): string =>
  `Value must be a positive integer greater than or equal to 0`;

export class EventHandler {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onMessageButtonClicked(this.onMessageButtonClicked.bind(this));
  }

  public async onMessageButtonClicked(data: any) {
    try {
      if (!data?.button_id) return;

      const [action, name, handle, id] = data.button_id.split("_");

      switch (action) {
        case "cancel":
          await updateMessage(
            `The ${name} has been cancelled`,
            data?.channel_id,
            data?.message_id!
          );
          return;

        case "submit":
          if (!data?.extra_data) return;

          let dataForm;
          try {
            dataForm = JSON.parse(data.extra_data);
          } catch (e) {
            console.error("JSON parse error:", e);
            await updateMessage(
              "Invalid form data",
              data.channel_id,
              data.message_id!
            );
            return;
          }

          const channelId = data.channel_id;
          const messageId = data.message_id;
          const userId = data.user_id;

          switch (name) {
            case "trophy":
              await this.processTrophyForm(
                handle,
                id,
                dataForm,
                userId,
                channelId,
                messageId
              );
              break;

            case "reward":
              await this.processRewardForm(
                handle,
                id,
                dataForm,
                channelId,
                messageId
              );
              break;
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Error in onMessageButtonClicked:", error);
      if (data?.channel_id && data?.message_id) {
        await updateMessage(
          "An error occurred while processing your request.",
          data.channel_id,
          data.message_id
        );
      }
    }
  }

  private async processTrophyForm(
    handle: string,
    id: string | undefined,
    dataForm: any,
    userId: string,
    channelId: string,
    messageId: string
  ) {
    switch (handle) {
      case "new": {
        if (!isValidPoints(dataForm.points)) {
          await updateMessage(getInvalidPointsMessage(), channelId, messageId);
          return;
        }

        const existingReward = await Reward.findOne({
          where: { name: dataForm?.name },
        });

        if (existingReward) {
          await updateMessage(
            getExistsMessage("trophy", dataForm.name),
            channelId,
            messageId
          );
          return;
        }

        await Reward.create({
          name: dataForm.name,
          description: dataForm.description,
          points: dataForm.points,
          createdBy: userId,
        });

        await updateMessage(
          getSuccessMessage("trophy", dataForm.name, "create"),
          channelId,
          messageId
        );
        break;
      }

      case "upd": {
        if (!id) return;

        if (!isValidPoints(dataForm.points)) {
          await updateMessage(getInvalidPointsMessage(), channelId, messageId);
          return;
        }

        await Reward.update(
          {
            name: dataForm.name,
            description: dataForm.description,
            points: dataForm.points,
            createdBy: userId,
            updatedAt: new Date(),
          },
          { where: { id } }
        );

        await updateMessage(
          getSuccessMessage("trophy", dataForm.name, "update"),
          channelId,
          messageId
        );
        break;
      }
    }
  }

  private async processRewardForm(
    handle: string,
    id: string | undefined,
    dataForm: any,
    channelId: string,
    messageId: string
  ) {
    switch (handle) {
      case "new": {
        if (!isValidPoints(dataForm.point_threshold)) {
          await updateMessage(getInvalidPointsMessage(), channelId, messageId);
          return;
        }

        const existingReward = await RoleReward.findOne({
          where: { role_name: dataForm.role_name },
        });

        if (existingReward) {
          await updateMessage(
            getExistsMessage("reward", dataForm.role_name),
            channelId,
            messageId
          );
          return;
        }

        await RoleReward.create({
          role_name: dataForm.role_name,
          point_threshold: dataForm.point_threshold,
        });

        await updateMessage(
          getSuccessMessage("reward", dataForm.role_name, "create"),
          channelId,
          messageId
        );
        break;
      }

      case "upd": {
        if (!id) return;

        if (!isValidPoints(dataForm.point_threshold)) {
          await updateMessage(getInvalidPointsMessage(), channelId, messageId);
          return;
        }

        await RoleReward.update(
          {
            role_name: dataForm.role_name,
            point_threshold: dataForm.point_threshold,
            updatedAt: new Date(),
          },
          { where: { id } }
        );

        await updateMessage(
          getSuccessMessage("reward", dataForm.role_name, "update"),
          channelId,
          messageId
        );
        break;
      }
    }
  }
}
