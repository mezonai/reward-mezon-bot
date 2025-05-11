import dotenv from "dotenv";
import { MezonClient } from "mezon-sdk";
import { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel";

dotenv.config();

if (!process.env.MEZON_TOKEN) {
  throw new Error("MEZON_TOKEN is not defined in .env file");
}

const client = new MezonClient(process.env.MEZON_TOKEN);

client.once("ready", () => {
  console.log("✅ Mezon bot is ready!");
});

async function findClan(clanId?: string) {
  if (!clanId) {
    if (client.clans.size === 1) {
      return client.clans.first()!;
    }
    const clanList = Array.from(client.clans.values())
      .map((g) => `"${g.name}"`)
      .join(", ");

    throw new Error(
      `Bot is in multiple servers. Please specify server name or ID. Available servers: ${clanList}`
    );
  }

  try {
    const clan = await client.clans.fetch(clanId as string);
    if (clan) return clan;
  } catch {
    const clans = client.clans.filter(
      (g) => g.name.toLowerCase() === clanId.toLowerCase()
    );
    if (clans.size === 0) {
      const availableClans = Array.from(client.clans.values())
        .map((g) => `"${g.name}"`)
        .join(", ");
      throw new Error(
        `Clan "${clanId}" not found. Available servers: ${availableClans}`
      );
    }
    if (clans.size > 1) {
      const clanList = clans.map((g) => `${g.name} (ID: ${g.id})`).join(", ");
      throw new Error(
        `Multiple servers found with name "${clanId}": ${clanList}. Please specify the server ID.`
      );
    }
    return clans.first()!;
  }
  throw new Error(`Clan "${clanId}" not found`);
}

export async function findChannel(
  channelId: string,
  clanId?: string
): Promise<TextChannel> {
  const clan = await findClan(clanId);
  try {
    const channel = await client.channels.fetch(channelId);

    if (channel instanceof TextChannel && channel.clan.id === clan.id) {
      return channel;
    }
  } catch {
    const channels = clan.channels.cache.filter(
      (channel): channel is TextChannel =>
        channel instanceof TextChannel &&
        (channel.name?.toLowerCase() === channelId.toLowerCase() ||
          channel.name?.toLowerCase() ===
            channelId.toLowerCase().replace("#", ""))
    );

    if (channels.size === 0) {
      const availableChannels = clan.channels.cache
        .filter((c): c is TextChannel => c instanceof TextChannel)
        .map((c) => `"#${c.name}"`)
        .join(", ");

      throw new Error(
        `Channel "${channelId}" not found in server "${clan.name}". Available channels: ${availableChannels}`
      );
    }
    if (channels.size > 1) {
      const channelList = channels
        .map((c) => `#${c.name} (${c.id})`)
        .join(", ");
      throw new Error(
        `Multiple channels found with name "${channelId}" in server "${clan.name}": ${channelList}. Please specify the channel ID.`
      );
    }
    return channels.first()!;
  }
  throw new Error(
    `Channel "${channelId}" is not a text channel or not found in server "${clan.name}"`
  );
}

export { client };
