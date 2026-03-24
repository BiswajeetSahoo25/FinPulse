(function initTransactionForm() {
  const submitButton = document.getElementById("submitTransaction");
  const form = document.getElementById("transactionForm");
  const errorElement = document.getElementById("formError");

  if (!submitButton || !form || !errorElement) {
    return;
  }

  submitButton.addEventListener("click", async () => {
    const formData = Object.fromEntries(new FormData(form));
    const amount = Number.parseFloat(formData.amount);

    errorElement.classList.add("d-none");
    submitButton.disabled = true;

    if (!formData.type || !Number.isFinite(amount) || amount <= 0) {
      errorElement.textContent =
        "Type and a valid amount greater than 0 are required.";
      errorElement.classList.remove("d-none");
      submitButton.disabled = false;
      return;
    }

    try {
      const response = await fetch("/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        errorElement.textContent = result.error || "Something went wrong.";
        errorElement.classList.remove("d-none");
        submitButton.disabled = false;
        return;
      }

      window.location.reload();
    } catch (_error) {
      errorElement.textContent =
        "Network error. Please check your connection and try again.";
      errorElement.classList.remove("d-none");
      submitButton.disabled = false;
    }
  });
})();
