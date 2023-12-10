$(document)
  .on("pjax:start", function () {
    $(".pjax-loader").show();
  })
  .on("pjax:complete pjax:end", function () {
    $(".pjax-loader").hide();
    
    try {
      $('[data-control="select2"].select2-hidden-accessible')
      .removeClass('select2-hidden-accessible')
      .next().remove();
      $('[data-control="select2"]').select2()
    } catch (e) {}

    try {
      $(".drawer-overlay").remove();
      KTComponents.init();
    } catch (e) {}
  });

  