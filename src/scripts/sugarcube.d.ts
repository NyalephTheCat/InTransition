import { ModManager } from "./managers/modManager";
import { NarrativeManager } from "./managers/narrativeManager";
import { NPCManager } from "./managers/npcManager";
import { Mod } from "./models/mod";
import { NPC } from "./models/npc"
import { Requirement, RequirementAlways, RequirementComposite, RequirementCompositeOperator, RequirementLastName, RequirementStoryletPlayed, RequirementVariable, RequirementVariableComp } from "./models/requirement";
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
    ModManager: typeof ModManager;
    Mod: typeof Mod;
    Requirement: typeof Requirement;
    RequirementComposite: typeof RequirementComposite;
    RequirementVariable: typeof RequirementVariable;
    RequirementVariableComp: typeof RequirementVariableComp;
    RequirementCompositeOperator: typeof RequirementCompositeOperator;
    RequirementStoryletPlayed: typeof RequirementStoryletPlayed;
    RequirementLastName: typeof RequirementLastName;
    RequirementAlways: typeof RequirementAlways;
  }
}

export {}