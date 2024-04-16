import { Mod } from "../models/mod";
import { DatabaseManager } from "../utils/database";

export class ModManager {
  static dbManager = new DatabaseManager<Mod>('ModDatabase', 1, [{ name: 'mods', keyPath: 'id' }], new Mod());
  static mods: Record<string, Mod> = {};

  static async init() {
    try {
      const mods = await ModManager.dbManager.getAll('mods');
      mods.forEach((mod: Mod) => {
        ModManager.mods[mod.id] = mod;
      });
      console.log("Mods initialized from database.");
    } catch (error) {
      console.error('Failed to initialize mods from IndexedDB:', error);
    }
  }

  static async clear() {
    try {
      await ModManager.dbManager.clear();
      this.mods = {};
      console.log("Mods cleared from database.");
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  }

  static async addMod(mod: Mod|[key: keyof Mod]) {
    mod = mod instanceof Mod ? mod : new Mod()._init(mod);
    try {
        await ModManager.dbManager.updateItem('mods', mod);
        console.log(`Mod ${mod.name} saved to database.`);
    } catch (error) {
        ModManager.mods[mod.id] = mod;
        console.error('Failed to save mod to IndexedDB:', error);
    }
  }

  static addMods(mods: Mod[]) {
    mods.forEach(async (mod) => {
      await this.addMod(mod);
    });
  }

  static getMod(id: string): Mod | undefined {
    return ModManager.mods[id];
  }

  static async deleteMod(id: string) {
    if (ModManager.mods[id]) {
      delete ModManager.mods[id];
      await ModManager.dbManager.deleteItem("mods", id);
      console.log(`Mod with id ${id} deleted from the database.`);
    } else {
      console.error(`Mod with id ${id} not found.`);
    }
  }

  static listAllMods(): Mod[] {
    return Object.values(ModManager.mods);
  }
}

$(ModManager.init);
window.ModManager = ModManager;
