import { NPC } from "../models/npc";
import { Requirement } from "../models/requirement";
import { shuffleArray } from "../utils/arrays";
import { Serializable } from "../utils/serialize";

export class NPCManager extends Serializable {
  npcs: Record<string, NPC> = {};

  addNPC(npc: NPC) {
    this.npcs[npc.id] = npc;
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs[id];
  }

  findNPC(requirement: Requirement): NPC[] {
    return Object.values(this.npcs).filter(npc => requirement.check(npc));
  }

  findNPCs(requirements: Record<string, Requirement>): Record<string, NPC> | null {
    const keys = Object.keys(requirements);
    const result: Record<string, NPC> = {};
    const assignedNPCs: Set<string> = new Set();

    if (this.assignNPCs(0, keys, requirements, result, assignedNPCs)) {
      return result;
    } else {
      return null; // No valid assignment was found
    }
  }

  private assignNPCs(
    index: number,
    keys: string[],
    requirements: Record<string, Requirement>,
    result: Record<string, NPC>,
    assignedNPCs: Set<string>
  ): boolean {
    if (index === keys.length) {
      return true; // All requirements have been successfully assigned
    }

    const key = keys[index];
    let possibleNPCs = this.findNPC(requirements[key]).filter(npc => !assignedNPCs.has(npc.id));

    // Shuffle possibleNPCs to randomize selection
    shuffleArray(possibleNPCs);

    for (const npc of possibleNPCs) {
      assignedNPCs.add(npc.id);
      result[key] = npc;
      if (this.assignNPCs(index + 1, keys, requirements, result, assignedNPCs)) {
        return true; // Found a valid assignment for all
      }
      // Backtrack
      assignedNPCs.delete(npc.id);
    }

    return false; // No valid assignment for this requirement
  }
}
window.NPCManager = NPCManager;