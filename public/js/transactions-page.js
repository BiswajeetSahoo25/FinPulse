(function initTransactionsPage() {
  const table = document.getElementById("transactionsTable");
  const searchInput = document.getElementById("transactionSearch");
  const typeFilter = document.getElementById("transactionTypeFilter");
  const methodFilter = document.getElementById("transactionMethodFilter");
  const resetButton = document.getElementById("resetTransactionFilters");
  const exportButton = document.getElementById("exportTransactionsBtn");
  const visibleCount = document.getElementById("visibleTransactionCount");
  const visibleIncomeTotal = document.getElementById("visibleIncomeTotal");
  const visibleExpenseTotal = document.getElementById("visibleExpenseTotal");
  const noResults = document.getElementById("transactionNoResults");

  if (!table) {
    return;
  }

  const rows = Array.from(table.querySelectorAll("tbody tr"));

  function formatCurrency(value) {
    return `INR ${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })}`;
  }

  function updateTable() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const selectedType = typeFilter?.value || "all";
    const selectedMethod = methodFilter?.value || "all";
    let visibleRows = 0;
    let income = 0;
    let expense = 0;

    rows.forEach((row) => {
      const matchesQuery = !query || row.dataset.search.includes(query);
      const matchesType = selectedType === "all" || row.dataset.type === selectedType;
      const matchesMethod =
        selectedMethod === "all" || row.dataset.method === selectedMethod;
      const isVisible = matchesQuery && matchesType && matchesMethod;
      const amount = Number.parseFloat(row.dataset.amount || "0");

      row.classList.toggle("d-none", !isVisible);

      if (!isVisible) {
        return;
      }

      visibleRows += 1;
      if (row.dataset.type === "income") {
        income += amount;
      } else {
        expense += amount;
      }
    });

    if (visibleCount) {
      visibleCount.textContent = String(visibleRows);
    }
    if (visibleIncomeTotal) {
      visibleIncomeTotal.textContent = formatCurrency(income);
    }
    if (visibleExpenseTotal) {
      visibleExpenseTotal.textContent = formatCurrency(expense);
    }
    if (noResults) {
      noResults.classList.toggle("d-none", visibleRows !== 0);
    }
  }

  function exportVisibleRows() {
    const visibleRows = rows.filter((row) => !row.classList.contains("d-none"));

    if (visibleRows.length === 0) {
      return;
    }

    const headers = Array.from(table.querySelectorAll("thead th")).map((cell) =>
      cell.textContent.trim(),
    );
    const lines = [headers.join(",")];

    visibleRows.forEach((row) => {
      const values = Array.from(row.querySelectorAll("td")).map((cell) => {
        const text = cell.textContent.replace(/\s+/g, " ").trim();
        return `"${text.replace(/"/g, '""')}"`;
      });
      lines.push(values.join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "finpulse-transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  searchInput?.addEventListener("input", updateTable);
  typeFilter?.addEventListener("change", updateTable);
  methodFilter?.addEventListener("change", updateTable);
  resetButton?.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
    }
    if (typeFilter) {
      typeFilter.value = "all";
    }
    if (methodFilter) {
      methodFilter.value = "all";
    }
    updateTable();
  });
  exportButton?.addEventListener("click", exportVisibleRows);

  updateTable();
})();
