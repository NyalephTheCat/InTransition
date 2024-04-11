import { Character, Clothes } from "../objects/character";

Macro.add('dialogue', {
  tags: null,
  handler() {
    let character: Character | string = this.args[0];
    // If character is a string, try to find the character by id
    if (typeof character === 'string') {
      const characterInstance = Character.get(character);
      if (!characterInstance) {
        return this.error(`Character with id ${character} not found.`);
      }
      character = characterInstance;
    }
    const dialogue = this.payload[0].contents;

    const $dialogue = $('<div>', {
      class: 'dialogue',
      style: `--dialogue-fg: ${character.color.fg};`
    }).wiki(`<i class="fas fa-quote-left fa-xs"></i> ${dialogue} <i class="fas fa-quote-right fa-xs"></i>`);


    const $tooltip = $('<div>', {
      class: 'tooltip',
      style: `--dialogue-bg: ${character.color.bg};`,
    }).append(`<i class="fa-regular fa-user"></i> ${character.name}`);

    $(this.output).append($dialogue.append($tooltip));

    return this;
  },
});

Macro.add('character', {
  handler() {
    let characterId: string|Character = this.args[0];
    // Try to find the character by id, whether passed directly or as a string
    const character = typeof characterId === 'string' ? Character.get(characterId) : characterId;
    if (!character) {
      return this.error(`Character with id ${characterId} not found.`);
    }

    // Create character link
    const $characterLink = $('<a>', {
      class: 'character-link',
      style: `--character-bg: ${character.color.bg}; --character-fg: ${character.color.fg};`
    }).text(character.name);

    // Container for the character sheet, to be toggled on click
    const $characterSheetSlot = $('<div>', { class: 'character-sheet-slot' });

    $characterLink.on('click', (event) => {
      event.stopPropagation(); // Prevents the click from propagating to document
      if ($characterSheetSlot.is(':empty')) { // Check if character sheet is already open
        const $characterSheet = $('<div>', { class: 'character-sheet', style: `--character-bg: ${character.color.bg}; --character-fg: ${character.color.fg};` }).wiki(`<<set _character = "${character.id}"  >><<include [[CharacterSheet]]>>`);
        $characterSheetSlot.append($characterSheet);
        // Close character sheet when clicking outside
        $(document).on('click', (e) => {
          if (!$(e.target).closest($characterSheet).length) {
            $characterSheet.remove();
          }
        });
      }
    });

    $(this.output).append($characterLink, $characterSheetSlot);
    return true;
  }
});
