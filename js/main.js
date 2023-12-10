$(document)
  .on("pjax:start", function () {
    $(".pjax-loader").show();
  })
  .on("pjax:complete pjax:end", function () {
    $(".pjax-loader").hide();
    
    try {
      $(".drawer-overlay").remove();
      $('[data-control="select2"].select2-hidden-accessible').select2("destroy")
      KTComponents.init();
    } catch (e) {}
  });
