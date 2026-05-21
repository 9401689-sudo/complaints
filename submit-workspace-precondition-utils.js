export function deriveSubmitActionGate(input = {}) {
  const isAuthenticated = Boolean(input.isAuthenticated);
  const hasCurrentCase = Boolean(input.hasCurrentCase);

  if (!isAuthenticated) {
    return { canRun: false, blockingReason: "unauthenticated" };
  }
  if (!hasCurrentCase) {
    return { canRun: false, blockingReason: "missing_case" };
  }

  return { canRun: true, blockingReason: null };
}

export function deriveOpenSubmitTabDecision(input = {}) {
  const hasSubmitData = Boolean(input.hasSubmitData);
  const currentFsmState = String(input.currentFsmState || "");
  const requiresPackageBuild = currentFsmState !== "package_ready";

  return {
    shouldRenderExistingSubmitData: hasSubmitData,
    requiresPackageBuild,
    submitProgressLabel: requiresPackageBuild ? "Собираем пакет..." : "Подготавливаем отправку..."
  };
}

export function deriveWorkspaceTabLeavePersistenceDecision(input = {}) {
  const currentWorkspaceTab = String(input.currentWorkspaceTab || "");
  const targetTab = String(input.targetTab || "");

  return {
    shouldPersistSubmitMetaOnLeave: currentWorkspaceTab === "submit" && targetTab !== "submit",
    shouldPersistResultCommentOnLeave: currentWorkspaceTab === "result" && targetTab !== "result"
  };
}
