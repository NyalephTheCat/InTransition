import { Serializable } from "../utils/serialize";
import { NPC } from "./npc";
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
    State.variables.storylet = {
      id: this.id,
      passage: this.startPassage,
      npcs,
    }
  }

  next(passage: string) {
    if (!State.variables.storylet) {
      throw new Error("Storylet not started");
    }
    
    State.variables.storylet = {
      id: this.id,
      passage,      
      npcs: State.variables.storylet.npcs,
    };
  }

  close() {
    delete State.variables.storylet;
  }
}