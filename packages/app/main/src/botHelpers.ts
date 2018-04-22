
import { BotConfig } from 'msbot';

import { IBotInfo, getBotId } from '@bfemulator/app-shared';
import { IBotConfig } from '@bfemulator/sdk-shared';
import { mainWindow } from './main';
import * as BotActions from './data-v2/action/bot';

export function getActiveBot(): IBotConfig {
  const state = mainWindow && mainWindow.store.getState();
  return state && state.bot.activeBot;
}

export function getBotInfoById(id: string): IBotInfo {
  const state = mainWindow.store.getState();
  return state.bot.botFiles.find(bot => bot && bot.id === id);
}

export function pathExistsInRecentBots(path: string): boolean {
  const state = mainWindow.store.getState();
  return state.bot.botFiles.some(bot => bot && bot.path === path);
}

/** Will attempt to load the bot, using the secret if specified.
 *
 *  If the bot is encrypted and the secret is invalid or missing,
 *  then the user will be prompted with a dialog allowing him / her
 *  to keep retrying until the correct secret is entered or the popup
 *  is dismissed.
 */
export async function loadBotWithRetry(botPath: string, secret?: string): Promise<BotConfig> {
  try {
    const bot = await BotConfig.Load(botPath, secret);

    // Bot was either decrypted on first try, or we used a new secret
    // entered via the secret prompt dialog. In the latter case, we should
    // update the secret for the bot that we have on record with the correct secret.
    const botId = getBotId(bot);
    if (botId) {
      const botInfo = getBotInfoById(botId);
      if (botInfo && botInfo.secret && botInfo.secret !== secret) {
        // update the secret in bots.json with the valid secret
        const updatedBot = { ...botInfo, secret };
        patchBotsJson(botId, updatedBot);
      }
    }

    return bot;
  } catch (e) {
    // TODO: Only prompt for password if we know for a fact we need it. Lots of different errors can arrive here, like ENOENT, if the file wasn't found.
    // Add easily discernable errors / error codes to msbot package
    if (typeof e === 'string' && (e.includes('secret') || e.includes('crypt'))) {
      // bot requires a secret to decrypt properties
      const newSecret = await mainWindow.commandService.remoteCall('secret-prompt:show');
      if (newSecret === null)
        // pop-up was dismissed; stop trying to prompt for secret
        return null;
      // try again with new secret
      return await loadBotWithRetry(botPath, newSecret);
    } else {
      throw e;
    }
  }
}

/** Converts an IBotConfig to a BotConfig */
export function toSavableBot(bot: IBotConfig, secret?: string): BotConfig {
  const botCopy = cloneBot(bot);
  const newBot: BotConfig = new BotConfig(secret);
  newBot.description = botCopy.description;
  newBot.name = botCopy.name;
  newBot.services = botCopy.services;
  return newBot;
}

/** Clones a bot */
export function cloneBot(bot: IBotConfig): IBotConfig {
  return JSON.parse(JSON.stringify(bot));
}

/** Patches a bot record in bots.json, and updates the list
 *  in the store and on disk.
 */
export function patchBotsJson(botId: string, bot: IBotInfo): IBotInfo[] {
  const state = mainWindow.store.getState();
  const bots = [...state.bot.botFiles];
  const botIndex = bots.findIndex(bot => bot.id === botId);
  if (botIndex > -1) {
    bots[botIndex] = { ...bots[botIndex], ...bot };
  }

  mainWindow.store.dispatch(BotActions.load(bots));
  return bots;
}

/** Saves a bot to disk */
export async function saveBot(bot: IBotConfig): Promise<void> {
  const botId = getBotId(bot);
  const botInfo = getBotInfoById(botId);
  
  if (botInfo && botInfo.path) {
    const saveableBot = toSavableBot(bot, botInfo.secret);

    if (botInfo.secret)
      saveableBot.validateSecretKey();
    return await saveableBot.Save(botInfo.path);
  }
}
