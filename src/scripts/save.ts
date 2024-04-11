import { SaveDetails, SaveObject } from "twine-sugarcube";
import { NarrativeManager } from "./manager/storylet";

Save.onSave.add((save: SaveObject, details: SaveDetails) => {
  // Save all storylet informations
  save.metadata = { 
    playedStorylets: NarrativeManager.playedStorylets
  };
})

Save.onLoad.add((save: SaveObject) => {
  // Load all storylet informations
  NarrativeManager.playedStorylets = save.metadata.playedStorylets;
});