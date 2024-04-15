Macro.add(
  'note',
  {
    tags: null,
    handler() {
      const type = this.args[0] ?? 'note';
      const message = this.payload[0].contents;
      $(this.output).append(
        $('<div>', { class: `message ${type}` })
          .append(
            $('<div>', { class: 'message-type', text: type }),
            $('<div>', { class: 'message-content' }).wiki(message)
          )
      );
    }
  }
)