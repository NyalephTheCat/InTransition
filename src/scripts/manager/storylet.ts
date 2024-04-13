import { Serializable } from "../utils/serializable";
import { NPC, NPCManager } from "./npc";
import { Requirement, RequirementAlways, RequirementLastName, RequirementStoryletPlayed } from "./requirement";

export class Storylet extends Serializable {
  constructor(
    public id: string = "error:missingId",
    public title: string = "Untitled",
    public author: string = "unkown",
    public passages: Record<string, string|null> = {},
    public startPassage: string = "start",
    public weight: number = 1,
    public priority: number = 0,
    public requirements: Requirement | undefined = undefined,
    public replayable: boolean = true,
    public npcs: Record<string, Requirement> = {},
    public tags: Set<string> = new Set()
  ) { 
    super()

    if (this.id.startsWith("base:")) {
      this.tags.add("base");
    }

    this.passages = Object.keys(passages).reduce((acc, key) => {
      if (Story.has(key)) {
        acc[key] = Story.get(key).text;
      } else {
        acc[key] = passages[key] || "";
      }
      return acc;
    }, {} as Record<string, string>);
  }

  start(npcs: Record<string, NPC>) {
    (State.variables as any).storylet = {
      id: this.id,
      passage: this.startPassage,
      npcs,
    }
  }

  next(passage: string) {
    (State.variables as any).storylet = Object.assign({
      id: this.id,
      passage,      
    }, (State.variables as any).storylet);
  }

  close() {
    delete (State.variables as any).storylet;
  }
}
(window as any).Storylet = Storylet;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB is not supported by this browser.');
    }
    const request = window.indexedDB.open('NarrativeDatabase', 1);

    request.onerror = (event: any) => {
      reject('Database error: ' + event.target.errorCode);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('storylets')) {
        db.createObjectStore('storylets', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
  });
}

function clearDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB is not supported by this browser.');
    }
    const request = window.indexedDB.deleteDatabase('NarrativeDatabase');

    request.onerror = (event: any) => {
      reject('Database error: ' + event.target.errorCode);
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
  });
}

export class NarrativeManager {
  static storylets: Record<string, Storylet> = {};
  static playedStorylets: Set<string> = new Set();

  static getStorylet(id: string): Storylet {
    return NarrativeManager.storylets[id];
  }

  static async init() {
    try {
      const db: IDBDatabase = await openDatabase();
      const transaction = db.transaction(['storylets'], 'readonly');
      const store = transaction.objectStore('storylets');
      const request = store.getAll();

      request.onsuccess = (e: any) => {
        const storylets = e.target.result;
        storylets.forEach((storylet: { id: string, data: string }) => {
          NarrativeManager.storylets[storylet.id] = JSON.parse(storylet.data);
        });
      };
    } catch (error) {
      console.error('Failed to initialize storylets from IndexedDB:', error);
    }
  }

  static async clear() {
    try {
      await clearDatabase();
      this.storylets = {};
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  }

  static async addStorylet(storylet: Storylet, asPlayable: boolean = false) {
    this.storylets[storylet.id] = storylet;
    try {
      const db: IDBDatabase = await openDatabase();
      const transaction = db.transaction(['storylets'], 'readwrite');
      const store = transaction.objectStore('storylets');

      const toStore = {
        id: storylet.id,
        data: JSON.stringify(storylet),
      }

      store.put(toStore);
    } catch (error) {
      console.error('Failed to save storylet to IndexedDB:', error);
    }

    if (asPlayable) {
      (State.variables as any).playableStorylets.add(storylet.id);
    }
  }

  static addStorylets(storylets: any[], asPlayable: boolean = false) {
    storylets.forEach(async (storylet) => {
      await this.addStorylet(storylet, asPlayable);
    });
  }

  static get available(): Set<string> {
    return new Set(Array.from((State.variables as any).playableStorylets as Set<string>)
    .map(id => this.storylets[id])
    .filter(storylet => {
      const requirementsMet = !storylet.requirements || storylet.requirements.check();
      const npcRequirementsMet = storylet.npcs ? (State.variables as any).npcManager.findNPCs(storylet.npcs) !== null : true;
      const isReplayableOrNew = storylet.replayable || !this.playedStorylets.has(storylet.id);
      return requirementsMet && npcRequirementsMet && isReplayableOrNew;
    }).map(storylet => storylet.id))
  }

  static pickStorylet(context: any = {}): { storylet: Storylet, assignedNPCs: Record<string, NPC> } | undefined {
    if ((State.variables as any).playableStorylets.size === 0) {
      return undefined;
    }
    const availableStorylets = Array.from((State.variables as any).playableStorylets as Set<string>).map(id => this.storylets[id]);

    if (availableStorylets.length === 0) {
      return undefined;
    }

    // Group by priority to identify the highest available priority
    const groupedByPriority = availableStorylets.reduce((acc: Record<number, Array<Storylet>>, storylet: Storylet) => {
      const priority = storylet.priority || 0; // Default priority is 0 if not specified
      if (!acc[priority]) acc[priority] = [];
      acc[priority].push(storylet);
      return acc;
    }, {});

    const highestPriority = Math.max(...Object.keys(groupedByPriority).map(Number));

    // Select among the highest priority storylets based on weight
    const highestPriorityStorylets = groupedByPriority[highestPriority];
    const totalWeight = highestPriorityStorylets.reduce((sum: any, storylet: { weight: any; }) => sum + (storylet.weight || 1), 0);

    // Generate a random number in the range of total weight
    let random = Math.random() * totalWeight;
    for (const storylet of highestPriorityStorylets) {
      random -= storylet.weight || 1;
      if (random <= 0) {
        const assignedNPCs = (State.variables as any).npcManager.findNPCs(storylet.npcs);
        return { storylet, assignedNPCs };
      }
    }

    let storylet = highestPriorityStorylets[0];  // Assuming random selection logic results in this storylet
    const assignedNPCs = (State.variables as any).npcManager.findNPCs(storylet.npcs);
    return { storylet, assignedNPCs };
  }
}
(window as any).NarrativeManager = NarrativeManager;
$(NarrativeManager.init);
(State.variables as any).playableStorylets = new Set();

Setting.addToggle("clearStorylets", {
  label: "Clear Storylets",
  default: false,
  onChange: () => {
    if ((settings as any).clearStorylets) {
      NarrativeManager.clear();
    }
    (settings as any).clearStorylets = false;
  },
});

Macro.add("storylet", {
  handler() {
    let storyletId;
    let storylet;
    let npcs: Record<string, NPC> = {};
    let message = this.args[0] ?? "Continue";
    if (this.args.length >= 2) {
      storyletId = this.args[1];
      storylet = NarrativeManager.getStorylet(storyletId);
      npcs = (State.variables as any).npcManager.findNPCs(storylet.npcs)
    } else {
      let _res = NarrativeManager.pickStorylet();
      if (!_res) {
        return this.error("No available storylets found.");
      }
      storylet = _res.storylet;
      npcs = _res.assignedNPCs;
    }
    let passage = null;
    if (this.args.length >= 3) {
      passage = this.args[2];
    }

    if (!storylet) {
      return this.error(`Storylet not found: ${storyletId}`);
    }

    $(this.output).append(
      $('<a>', { class: 'macro-link', text: message, click: () => {
        storylet.start(npcs);
        
        if (passage)
          storylet.next(passage);

        Engine.play("Storylet");
      } })
    );

    return true;
  },
});

Macro.add("storyletLink", {
  handler() {
    if (!(State.variables as any).storylet) {
      return this.error("No active storylet found.");
    }

    const passageId = this.args[0];
    const displayText = this.args[1];
    
    $(this.output).wiki(`<<link "${displayText}" "Storylet">><<run $storylet.passage = "${passageId}">><</link>>`);
    return true;
  },
});

Macro.add("storyletClose", {
  handler() {
    if (!(State.variables as any).storylet) {
      return this.error("No active storylet found.");
    }

    $(this.output).wiki(`<<link "Close" "Start">><<= NarrativeManager.getStorylet($storylet.id).close()>><</link>>`);
    return true;
  }
});

NarrativeManager.addStorylets([
  new Storylet("base:intro", "Introduction", "nyaleph", {
    base_intro_start: null,
    base_intro_end: null,
  }, "base_intro_start", 1, 0, undefined, false, {
    npc1: new RequirementLastName("Smith"),
    npc2: new RequirementAlways(true),
  }, new Set(["base", "intro"])),
], true);

NarrativeManager.addStorylet(
  new Storylet("base:outro", "Outro", "nyaleph", {
    base_outro_start: null,
    base_outro_end: null,
  }, "base_outro_start", 1, 0, new RequirementStoryletPlayed("base:intro")),
  true
);