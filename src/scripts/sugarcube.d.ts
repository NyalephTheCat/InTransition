import { NarrativeManager } from "./managers/narrativeManager";
import { NPCManager } from "./managers/npcManager";
import { NPC } from "./models/npc"
import { Storylet } from "./models/storylet";

declare module "twine-sugarcube" {
  export interface SugarCubeStoryVariables {
    storylet?: {
      id: string,
      passage: string,
      npcs:  Record<string, NPC>,
    };
    playableStorylets: Set<string>;
    npcManager: NPCManager;
    version: string;
 }

 export interface SugarCubeSettingVariables {
  clearStorylets?: boolean;
 }
}

declare global {
  interface Window {
    NarrativeManager: typeof NarrativeManager;
    NPCManager: typeof NPCManager;
    NPC: typeof NPC;
    Storylet: typeof Storylet;
  }
}

export {}