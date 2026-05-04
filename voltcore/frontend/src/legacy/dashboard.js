(function () {
  function planPriceValue(state) {
    return Number(String(state.selectedPlan?.price || "$79").replace(/[^\d.]/g, "")) || 0;
  }

  function vmMonthlyCost(vm) {
    return Math.round(Number(vm.cpu || 0) * 8 + Number(vm.ram || 0) * 3 + Number(vm.disk || 0) * 0.12);
  }

  function currentMonthlySpend(state, vms, signedIn) {
    if (!signedIn) return planPriceValue(state);
    return planPriceValue(state) + vms.reduce((sum, vm) => sum + vmMonthlyCost(vm), 0);
  }

  function renderSpendingChart(state, vms) {
    const formatter = new Intl.DateTimeFormat("en", { month: "short" });
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1));
    const values = months.map((month) => {
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime();
      const vmCost = vms
        .filter((vm) => {
          const created = vm.createdAt ? new Date(vm.createdAt).getTime() : now.getTime();
          return created < end;
        })
        .reduce((sum, vm) => sum + vmMonthlyCost(vm), 0);
      return planPriceValue(state) + vmCost;
    });
    const max = Math.max(...values, 1);
    return months.map((month, index) => {
      const value = values[index];
      const isCurrent = index === months.length - 1;
      const height = Math.max(value > 0 ? 16 : 4, Math.round((value / max) * 88));
      return `<div class="spending-bar ${isCurrent ? "is-current" : ""}">${isCurrent ? `<b>$${value}</b>` : ""}<i style="height:${height}%"></i><span>${isCurrent ? "Now" : formatter.format(month)}</span></div>`;
    }).join("");
  }

  function renderBilling({ $, vms }) {
    const vmCost = vms.reduce((sum, vm) => sum + vmMonthlyCost(vm), 0);
    if ($("#usageBreakdown")) $("#usageBreakdown").textContent = `$${vmCost}/mo`;
    if ($("#usageBreakdownText")) {
      $("#usageBreakdownText").innerHTML = vms
        .map((vm) => `<span class="usage-row">${vm.name}<b>$${vmMonthlyCost(vm)}/mo</b></span>`)
        .join("") || "No VM usage yet.";
    }
    if ($("#invoiceList")) $("#invoiceList").innerHTML = `<span class="invoice-item">No invoices yet<b>$0</b><em>Pending</em></span>`;
  }

  function updateSelectedPlanCards({ $, $$, state }) {
    $$(".price-card").forEach((card) => {
      const selected = card.querySelector(".select-plan")?.dataset.plan === state.selectedPlan.name;
      card.classList.toggle("is-selected", selected);
    });
    if ($("#selectedPlan")) $("#selectedPlan").textContent = `${state.selectedPlan.name} - ${state.selectedPlan.price}/month`;
    const currentPlan = $("#panel-billing .dashboard-panel strong");
    if (currentPlan) currentPlan.textContent = state.selectedPlan.name;
  }

  window.VoltCoreDashboard = {
    currentMonthlySpend,
    renderBilling,
    renderSpendingChart,
    updateSelectedPlanCards,
    vmMonthlyCost
  };
})();
