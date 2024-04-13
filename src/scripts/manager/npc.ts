import { Serializable } from "../utils/serializable";
import { Requirement } from "./requirement";

export class NPC extends Serializable {
  constructor(
    public id: string,
    public firstName: string,
    public lastName: string,
    public experiences: string[] = [],
    public traits: Record<string, any> = {},
  ) {
    super();
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
(window as any).NPC = NPC;

export class NPCManager extends Serializable {
  npcs: Record<string, NPC> = {};

  addNPC(npc: NPC) {
    this.npcs[npc.id] = npc;
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs[id];
  }

  findNPC(requirement: Requirement): NPC[] {
    return Object.values(this.npcs).filter(npc => requirement?.check(npc));
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
    this.shuffleArray(possibleNPCs);

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

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // swap elements
    }
  }
}

(window as any).NPCManager = NPCManager;
// Create an npc manager inside of the state variables
$(() => {
  if (!(State.variables as any).npcManager) {
    (State.variables as any).npcManager = new NPCManager();

    // Add some default NPCs
    (State.variables as any).npcManager.addNPC(new NPC('1', 'Alice', 'Smith'));
    (State.variables as any).npcManager.addNPC(new NPC('2', 'Bob', 'Johnson'));
    (State.variables as any).npcManager.addNPC(new NPC('3', 'Charlie', 'Brown'));
    (State.variables as any).npcManager.addNPC(new NPC('4', 'David', 'Davis'));

  }
});