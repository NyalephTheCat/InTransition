import { Mod, ModData } from '../models/mod';
import { DatabaseManager, ObjectStoreConfig } from '../utils/database';

export class ModManager {
    private static dbManager: DatabaseManager<Mod>;
    private static initialized = false;

    static initialize(dbName: string, dbVersion: number): void {
        if (!this.initialized) {
            const objectStores: ObjectStoreConfig[] = [{
                name: "mods",
                keyPath: "id"
            }];
            this.dbManager = new DatabaseManager<Mod>(dbName, dbVersion, objectStores, new Mod());
            this.initialized = true;
        }
    }

    static async loadMod(modData: ModData): Promise<Mod> {
        const mod = new Mod();
        Object.assign(mod, modData);
        if (mod.isCompatible) {
            await this.dbManager.addItem("mods", mod);
            console.log(`Mod ${mod.name} loaded and added to database.`);
        } else {
            console.error(`Mod ${mod.name} is not compatible with the current game version.`);
        }
        return mod;
    }

    static async getMod(id: string): Promise<Mod | undefined> {
        try {
            const mod = await this.dbManager.getItem("mods", id);
            return mod;
        } catch (error) {
            console.error('Failed to retrieve mod:', error);
            return undefined;
        }
    }

    static async updateMod(modData: ModData): Promise<void> {
        const mod = new Mod();
        Object.assign(mod, modData);
        await this.dbManager.updateItem("mods", mod);
        console.log(`Mod ${mod.name} updated in the database.`);
    }

    static async deleteMod(id: string): Promise<void> {
        await this.dbManager.deleteItem("mods", id);
        console.log(`Mod with id ${id} deleted from the database.`);
    }

    static async listAllMods(): Promise<Mod[]> {
        return await this.dbManager.getAll("mods");
    }
}
$(ModManager.initialize);