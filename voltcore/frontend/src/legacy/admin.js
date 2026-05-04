(function () {
  function renderAdmin({ $, state, spend, vmRow }) {
    if ($("#adminRows")) {
      const empty = `<div class="empty-state"><div><strong>No virtual machines found</strong><span>Create a VM or adjust filters to see infrastructure here.</span></div></div>`;
      $("#adminRows").innerHTML = state.vms.length ? state.vms.map(vmRow).join("") : empty;
    }
    if ($("#adminUsers")) {
      const users = state.users.length ? state.users : (state.user ? [state.user] : []);
      $("#adminUsers").innerHTML = `<div class="admin-list">${users.map((user) => `<div class="admin-list-row"><span><strong>${user.name}</strong><br><small>${user.email}</small></span><span>${user.role}</span><span>${user.plan}</span><span>${state.vms.filter((vm) => vm.owner === user.email).length} VMs</span></div>`).join("")}</div>`;
    }
    if ($("#adminRevenueRows")) {
      const users = state.users.length ? state.users : (state.user ? [state.user] : []);
      $("#adminRevenueRows").innerHTML = `<div class="admin-list">${users.map((user) => `<div class="admin-list-row"><span><strong>${user.plan}</strong><br><small>${user.email}</small></span><span>${user.role === "admin" ? "$0" : spend}</span><span>${user.role}</span><span>${user.name}</span></div>`).join("")}</div>`;
    }
    if ($("#adminUserCount")) $("#adminUserCount").textContent = `${state.users.length || (state.user ? 1 : 0)} Users`;
    if ($("#adminRevenue")) $("#adminRevenue").textContent = spend;
    if ($("#latestSignup")) $("#latestSignup").textContent = (state.users.at(-1) || state.user)?.email || "client@voltcore.local";
  }

  window.VoltCoreAdmin = { renderAdmin };
})();
