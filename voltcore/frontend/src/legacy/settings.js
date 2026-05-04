(function () {
  function renderSettings({ $, state, updateSelectedPlanCards }) {
    const user = state.user || { name: "Guest", email: "" };
    if ($("#settingsUserName")) $("#settingsUserName").textContent = user.name;
    if ($("#settingsUserEmail")) $("#settingsUserEmail").textContent = user.email;
    if ($("#settingsNameInput")) $("#settingsNameInput").value = user.name;
    if ($("#settingsEmailInput")) $("#settingsEmailInput").value = user.email;
    if ($("#workspaceIndicator")) $("#workspaceIndicator").textContent = `Workspace: ${user.name}`;
    if ($("#settingsSshKey") && document.activeElement !== $("#settingsSshKey")) $("#settingsSshKey").value = state.defaultSshKey;
    if ($("#vmKey") && !$("#vmKey").value.trim()) $("#vmKey").value = state.defaultSshKey;
    if ($("#settingsApiKey")) $("#settingsApiKey").textContent = state.apiKey;
    updateSelectedPlanCards();
  }

  window.VoltCoreSettings = { renderSettings };
})();
