import { NarrativeManager } from "../managers/narrativeManager";
import { NPC } from "../models/npc";

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