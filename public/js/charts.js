(function initCharts() {
  if (typeof Chart === "undefined") {
    return;
  }

  function readJson(id) {
    const element = document.getElementById(id);

    if (!element) {
      return null;
    }

    try {
      return JSON.parse(element.textContent || "{}");
    } catch (_error) {
      return null;
    }
  }

  function formatMonthLabel(key) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const [year, month] = key.split("-");
    return `${monthNames[Number(month) - 1]} ${year}`;
  }

  const monthlyData = readJson("monthly-data") || {};
  const monthlyKeys = Object.keys(monthlyData).sort();
  const monthlyCanvas = document.getElementById("monthlyChart");

  if (monthlyCanvas && monthlyKeys.length > 0) {
    new Chart(monthlyCanvas, {
      type: "bar",
      data: {
        labels: monthlyKeys.map(formatMonthLabel),
        datasets: [
          {
            label: "Income",
            data: monthlyKeys.map((key) => monthlyData[key].income),
            backgroundColor: "#2ecc71",
            borderRadius: 8,
          },
          {
            label: "Expense",
            data: monthlyKeys.map((key) => monthlyData[key].expense),
            backgroundColor: "#e74c3c",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  const categoryData = readJson("category-data") || {};
  const categoryCanvas = document.getElementById("categoryChart");
  const categories = Object.keys(categoryData);

  if (categoryCanvas && categories.length > 0) {
    new Chart(categoryCanvas, {
      type: "doughnut",
      data: {
        labels: categories,
        datasets: [
          {
            data: categories.map((category) => categoryData[category]),
            backgroundColor: [
              "#3498db",
              "#e74c3c",
              "#2ecc71",
              "#f39c12",
              "#1abc9c",
              "#9b59b6",
              "#e67e22",
            ],
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }
})();
