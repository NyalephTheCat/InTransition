import './manager/storylet'
import './manager/npc'
import './save'

Macro.add('note', {
  tags: null,
  handler () {
    const messageType = this.args[0];
    const content = this.payload[0].contents;

    $(this.output)
      .append($('<div>', {
        class: `message ${messageType}`,
      }).append(
        $('<div>', { class: 'message-type' }).text(messageType),
        $('<div>', { class: 'message-content' }).wiki(content)
      )
    );
  }
});

(State.variables as any).version = '0.0.1';

Setting.addToggle('debug', {
  label: 'Debug Mode',
  default: false,
  onChange: () => {
    Config.debug = (settings as any).debug;
  }
});