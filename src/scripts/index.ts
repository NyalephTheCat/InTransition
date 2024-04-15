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