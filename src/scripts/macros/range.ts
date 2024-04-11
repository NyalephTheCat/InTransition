Macro.add('range', {
  handler() {
    if (this.args.length < 3) {
      return this.error('The "range" macro requires at least 3 arguments: value, min, and max.');
    }

    const value: number = parseFloat(this.args[0]);
    const min: number = parseFloat(this.args[1]);
    const max: number = parseFloat(this.args[2]);
    const step: number = this.args.length > 3 ? parseFloat(this.args[3]) : 1;
    const editable: boolean = this.args.length > 4 ? this.args[4] === true : true;

    // Create the slider element and labels for min, max, and current value
    const $wrapper = $('<div/>', { 'class': 'range-slider-wrapper' });
    const $slider = $('<input/>', {
      type: 'range',
      id: 'range-slider',
      min: min,
      max: max,
      step: step,
      value: value,
      disabled: !editable
    });
    const $valueDisplay = $('<span/>', { 'text': `Current Value: ${value}` });
    const $minDisplay = $('<span/>', { 'text': `Min: ${min}` });
    const $maxDisplay = $('<span/>', { 'text': `Max: ${max}` });

    // Append elements to the wrapper
    $wrapper.append($minDisplay, $slider, $valueDisplay, $maxDisplay);
    $(this.output).append($wrapper);

    // Update current value display on slider change
    $slider.on('input change', function() {
      $valueDisplay.text(`Current Value: ${(this as any).value}`);
    });

    return true;
  },
});
