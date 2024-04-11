import './manager/storylet'
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