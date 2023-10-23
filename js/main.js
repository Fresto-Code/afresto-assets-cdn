$(document)
  .on("pjax:start", function () {
    $(".pjax-loader").show();
  })
  .on("pjax:complete pjax:end", function () {
    $(".pjax-loader").hide();
    try {
      KTComponents.init();
    } catch (e) {}
  });
