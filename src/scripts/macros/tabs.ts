Macro.add("tabs", {
  tags: ["tab"],
  handler: function () {
    var initialTab = this.args[0] || 0; // Default to the first tab if no argument provided
    var $wrapper = $('<div class="tab-wrapper"></div>');
    var $tabList = $('<ul class="tab-list"></ul>');
    $wrapper.append($tabList);

    // Create tabs
    this.payload.slice(1).forEach(function (tab, index) {
      var title = tab.args[0];
      var $tabContent = $(
        `<div class="tab-content" data-tab-index="${index}">`
      ).wiki(tab.contents);
      var $tabItem = $(
        `<li class="tab-item" data-tab-index="${index}">${title}</li>`
      );

      if (index === initialTab) {
        $tabItem.addClass("active");
        $tabContent.show();
      }

      $tabList.append($tabItem);
      $wrapper.append($tabContent);

      $tabItem.on("click", function () {
        $wrapper.find(".tab-content").hide();
        $wrapper.find(".tab-item").removeClass("active");
        $wrapper.find(`.tab-content[data-tab-index="${index}"]`).show();
        $(this).addClass("active");
      });
    });

    $(this.output).append($wrapper);
    // Set initial active tab
    $wrapper.find(`.tab-item[data-tab-index="${initialTab}"]`).trigger("click");
  },
});
