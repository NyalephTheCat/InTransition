import { satisfies } from "semver";
import { Serializable } from "../utils/serialize";
import { Storylet } from "./storylet";
import { NPC } from "./npc";

export interface ModData {
  storylets?: Record<string, Storylet>;
  npcs?: Record<string, NPC>;
}

export class Mod extends Serializable {
  constructor(
    public id: string = "unknown_mod",
    public name: string = "Unknown Mod",
    public version: string = "0.0.0",
    public gameVersion: string = ">=0.0.0",
    public description: string = "No description provided.",
    public author: string = "unknown_author",
    public dependencies: string[] = [],
    public conflicts: string[] = [],
    public tags: string[] = [],
    public url: string = "",
    public data: ModData = {},
  ) {
    super();
  }

  get isCompatible(): boolean {
    return satisfies(State.variables.version, this.gameVersion);
  }
}