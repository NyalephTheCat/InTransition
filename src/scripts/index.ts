import { SaveDetails, SaveObject } from "twine-sugarcube";
import { NarrativeManager } from "./managers/narrativeManager";

/// Import all the important things
import './models/npc';
import './models/requirement';
import './models/storylet';
import './managers/npcManager';
import './managers/narrativeManager';
import './utils/database';
import './utils/serialize';
import './utils/arrays';

import './macros/storylets';
import './macros/note';
import './macros/tabs';
import { Storylet } from "./models/storylet";
import { RequirementLastName, RequirementAlways, RequirementStoryletPlayed } from "./models/requirement"; 

Save.onSave.add((save: SaveObject, details: SaveDetails) => {
  // Save all storylet informations
  save.metadata = { 
    playedStorylets: NarrativeManager.playedStorylets,
  };
})

Save.onLoad.add((save: SaveObject) => {
  // Load all storylet informations
  NarrativeManager.playedStorylets = save.metadata.playedStorylets;
});

NarrativeManager.addStorylets([
  new Storylet("base:intro", "Introduction", "nyaleph", {
    base_intro_start: null,
    base_intro_end: null,
  }, "base_intro_start", 1, 0, undefined, false, {
    npc1: new RequirementLastName("Blofis"),
    npc2: new RequirementAlways(true),
  }, new Set(["base", "intro"]))
], true);

NarrativeManager.addStorylet(
  new Storylet("base:outro", "Outro", "nyaleph", {
    base_outro_start: null,
    base_outro_end: null,
  }, "base_outro_start", 1, 0, new RequirementStoryletPlayed("base:intro")),
  true
);
