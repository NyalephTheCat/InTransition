import { Requirement } from "./requirement";

export interface NPC {
  id: string;
  firstName: string;
  lastName: string;
}

export class NPCManager {
  static NPCs: Record<string, NPC> = {};

  static getNPC(id: string): NPC {
    return NPCManager.NPCs[id];
  }

  static findValidNPCs(requirement: Requirement): string[] {
    return Object.values(NPCManager.NPCs).filter((npc) => requirement.check(npc)).map((npc) => npc.id);
  }
}