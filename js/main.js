$(document)
  .on("pjax:start", function () {
    $(".pjax-loader").show();
  })
  .on("pjax:complete pjax:end", function () {
    $(".pjax-loader").hide();

    try {
      $('[data-control="select2"].select2-hidden-accessible')
        .removeClass("select2-hidden-accessible")
        .next()
        .remove();
      $('[data-control="select2"]').select2();
    } catch (e) {}

    try {
      $(".drawer-overlay").remove();
      KTComponents.init();
    } catch (e) {}
  });

$("[data-persistent-size=1]").height($("[data-persistent-size=1]").height());

function initLoader(text) {
  const loadingEl = document.createElement("div");
  document.body.prepend(loadingEl);
  loadingEl.classList.add("page-loader");
  loadingEl.classList.add("flex-column");
  loadingEl.classList.add("bg-dark");
  loadingEl.classList.add("bg-opacity-25");
  loadingEl.innerHTML = `
            <div class="align-items-center card d-flex flex-column p-5">
                <span class="spinner-border text-primary" role="status"></span>
                <span class="text-gray-800 fs-6 fw-semibold mt-5">${text}</span>
            </div>
        
    `;

  // Show page loading
  KTApp.showPageLoading();
  return loadingEl;
}

function removeLoader(el) {
  el.remove();
  KTApp.hidePageLoading();
}
