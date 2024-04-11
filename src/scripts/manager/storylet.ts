import { Serializable } from "../utils/serializable";
import { Requirement } from "./requirement";

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
    public tags: string[] = []
  ) { 
    super()

    if (this.id.startsWith("base:")) {
      this.tags.push("base");
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

  start() {
    (State.variables as any).storylet = {
      id: this.id,
      passage: this.startPassage,
    }
  }

  next(passage: string) {
    (State.variables as any).storylet = {
      id: this.id,
      passage,
    }
  }

  close() {
    delete (State.variables as any).storylet;
  }
}

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
        storylets.forEach((storylet: Storylet) => {
          NarrativeManager.storylets[storylet.id] = (new Storylet())._init(storylet);
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

  static async addStorylet(storylet: Storylet) {
    this.storylets[storylet.id] = storylet;
    try {
      const db: IDBDatabase = await openDatabase();
      const transaction = db.transaction(['storylets'], 'readwrite');
      const store = transaction.objectStore('storylets');

      store.put(storylet);
    } catch (error) {
      console.error('Failed to save storylet to IndexedDB:', error);
    }
  }

  static addStorylets(storylets: any[]) {
    storylets.forEach(async (storylet) => {
      await this.addStorylet(storylet);
    });
  }

  static pickStorylet(context: any = {}): Storylet | undefined {
    // Filter available storylets based on requirements and replayability
    const availableStorylets = Object.values(this.storylets)
      .filter(storylet => {
        const requirementsMet = !storylet.requirements || storylet.requirements.check(context);
        const isReplayableOrNew = storylet.replayable || !this.playedStorylets.has(storylet.id);
        return requirementsMet && isReplayableOrNew;
      });

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
    const totalWeight = highestPriorityStorylets.reduce((sum, storylet) => sum + (storylet.weight || 1), 0);

    // Generate a random number in the range of total weight
    let random = Math.random() * totalWeight;
    for (const storylet of highestPriorityStorylets) {
      random -= storylet.weight || 1;
      if (random <= 0) {
        return storylet;
      }
    }

    let storylet = highestPriorityStorylets[0];
    return storylet;
  }
}
(window as any).NarrativeManager = NarrativeManager;
$(NarrativeManager.init);

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
    if (this.args.length === 1) {
      storyletId = this.args[0];
      storylet = NarrativeManager.getStorylet(storyletId);
    } else {
      storylet = NarrativeManager.pickStorylet();
    }

    if (!storylet) {
      return this.error(`Storylet not found: ${storyletId}`);
    }

    storylet.start();
    $(this.output).wiki("[[Storylet]]");

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

    $(this.output).wiki(`<<link "Close" "Start">><<$storylet.close()>><</link>>`);
    return true;
  }
});

NarrativeManager.addStorylets([
  new Storylet("base:intro", "Introduction", "nyaleph", {
    base_intro_start: null,
    base_intro_end: null,
  }, "base_intro_start"),
]);
