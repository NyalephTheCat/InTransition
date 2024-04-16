import { ModManager } from "../managers/modManager";

Macro.add("uploadMod", {
  handler: function () {
    var $wrapper = $("<div>").appendTo(this.output);
    var $input = $('<input type="file" accept=".json">').appendTo($wrapper);
    var $list = $("<ul>").appendTo($wrapper);

    $input.on("change", async function (e) {
      var file = (e.target as HTMLInputElement)?.files?.[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = async function (e) {
          try {
            if (e.target) {
              var modData = JSON.parse(e.target.result as string);
              // Check if the mod is already installed
              if (ModManager.getMod(modData.id)) {
                console.log(`Mod with ID ${modData.id} is already installed.`);
                return;
              }
              await ModManager.addMod(modData);
              console.log(`Mod ${modData.name} installed successfully.`);
              // List all mods loaded after installing a new mod
              listMods($list);
            }
          } catch (error) {
            console.error("Failed to load mod:", error);
          }
        };
        reader.readAsText(file);
      }
    });

    async function listMods($list: JQuery<HTMLElement>) {
      $list.empty();
      if (Object.keys(ModManager.mods).length === 0) { await ModManager.init(); }
      ModManager.listAllMods().forEach(function (mod) {
        var $li = $("<li>").text(mod.name).appendTo($list);
        var $removeBtn = $("<button>").html('<i class="fas fa-times"></i>').appendTo($li);
        $removeBtn.on("click", function () {
          removeMod(mod.id, $li);
        });
      });
    }
    
    async function removeMod(modId: string, $li: JQuery<HTMLElement>) {
      try {
        await ModManager.deleteMod(modId);
        $li.remove();
        console.log(`Mod with ID ${modId} removed successfully.`);
      } catch (error) {
        console.error(`Failed to remove mod with ID ${modId}:`, error);
      }
    }

    // Initial list of mods
    listMods($list);

    $(this.output).append($wrapper);
  },
});
