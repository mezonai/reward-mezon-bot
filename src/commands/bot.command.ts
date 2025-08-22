import { RewardCommand } from "./reward.command";
import { TrophyCommand } from "./trophy.command";
import { TopCommand } from "./top.command";
import { SystemCommand } from "./system.command";
import { AwardCommand } from "./award.command";
import { HelpCommand } from "./help.command";
import { FinanceCommand } from "./finance.command";
import dotenv from "dotenv";
import { AdminCommand } from "./admin.command";

dotenv.config();

export const commands = {
  reward: new RewardCommand(),
  trophy: new TrophyCommand(),
  top: new TopCommand(),
  system: new SystemCommand(),
  award: new AwardCommand(),
  help: new HelpCommand(),
  rank: new RewardCommand(),
  top_week: new TopCommand(),
  top_month: new TopCommand(),
  ask: new SystemCommand(),
  rut: new SystemCommand(),
  kttk: new SystemCommand(),
  list_trophy: new TrophyCommand(),
  trophies: new TrophyCommand(),
  list: new RewardCommand(),
  balance: new FinanceCommand(),
  chk: new AdminCommand(),
};
