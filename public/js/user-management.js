(function initUserImageForms() {
  const imageForms = document.querySelectorAll("[data-image-form]");

  if (imageForms.length === 0) {
    return;
  }

  function setPreview(preview, dataUrl) {
    if (!preview) {
      return;
    }

    if (!dataUrl) {
      return;
    }

    preview.classList.add("has-image");
    preview.innerHTML = "";

    const image = document.createElement("img");
    image.src = dataUrl;
    image.alt = "Profile preview";
    preview.appendChild(image);
  }

  imageForms.forEach((form) => {
    const fileInput = form.querySelector("[data-image-input]");
    const hiddenInput = form.querySelector("[data-image-hidden]");
    const preview = form.querySelector("[data-image-preview]");

    if (!fileInput || !hiddenInput || !preview) {
      return;
    }

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];

      fileInput.setCustomValidity("");

      if (!file) {
        hiddenInput.value = "";
        return;
      }

      if (file.size > 700 * 1024) {
        hiddenInput.value = "";
        fileInput.value = "";
        fileInput.setCustomValidity("Choose an image smaller than 700 KB.");
        fileInput.reportValidity();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        hiddenInput.value = result;
        setPreview(preview, result);
      };
      reader.readAsDataURL(file);
    });
  });
})();

