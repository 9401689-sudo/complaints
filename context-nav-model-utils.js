export function deriveContextNavModel(input = {}) {
  const currentScreen = String(input.currentScreen || "");
  const currentWorkspaceTab = String(input.currentWorkspaceTab || "");
  const adminSection = String(input.adminSection || "");
  const isAuthenticated = Boolean(input.isAuthenticated);
  const institutionsScopeFilter = String(input.institutionsScopeFilter || "");
  const institutionsCategoryFilter = String(input.institutionsCategoryFilter || "");
  const templatesScopeFilter = String(input.templatesScopeFilter || "");
  const templatesCategoryFilter = String(input.templatesCategoryFilter || "");
  const directoryCategories = Array.isArray(input.directoryCategories) ? input.directoryCategories : [];
  const institutionsScopeOptions = Array.isArray(input.institutionsScopeOptions) ? input.institutionsScopeOptions : [];
  const templatesScopeOptions = Array.isArray(input.templatesScopeOptions) ? input.templatesScopeOptions : [];

  if (currentScreen === "case-workspace") {
    return {
      title: "Обращение",
      items: [
        { action: "tab:variables", label: "Переменные", active: currentWorkspaceTab === "variables" },
        { action: "tab:text", label: "Текст", active: currentWorkspaceTab === "text" },
        { action: "tab:files", label: "Файлы", active: currentWorkspaceTab === "files" },
        { action: "tab:submit", label: "Отправка", active: currentWorkspaceTab === "submit" },
        { action: "tab:result", label: "Ответ", active: currentWorkspaceTab === "result" }
      ]
    };
  }

  if (currentScreen === "institutions") {
    return {
      title: "Фильтры",
      items: deriveScopedCategoryItems({
        scopeOptions: institutionsScopeOptions,
        scopePrefix: "institutions-scope",
        scopeActiveValue: institutionsScopeFilter,
        categoryOptions: directoryCategories,
        categoryPrefix: "institutions-category",
        categoryActiveValue: institutionsCategoryFilter
      })
    };
  }

  if (currentScreen === "templates") {
    return {
      title: "Фильтры",
      items: deriveScopedCategoryItems({
        scopeOptions: templatesScopeOptions,
        scopePrefix: "templates-scope",
        scopeActiveValue: templatesScopeFilter,
        categoryOptions: directoryCategories,
        categoryPrefix: "templates-category",
        categoryActiveValue: templatesCategoryFilter
      })
    };
  }

  if (currentScreen === "admin") {
    return {
      title: "Панель администратора",
      items: [
        { action: "admin-section:users", label: "Пользователи", active: adminSection === "users" },
        { action: "admin-section:private_institutions", label: "Личные организации", active: adminSection === "private_institutions" },
        { action: "admin-section:private_templates", label: "Личные шаблоны", active: adminSection === "private_templates" },
        { action: "admin-section:deleted", label: "Просмотр помеченных", active: adminSection === "deleted" },
        { action: "admin-action:purge-deleted", label: "Удаление помеченных", active: false },
        { action: "admin-section:backups", label: "Резервные копии", active: adminSection === "backups" }
      ]
    };
  }

  if (isAuthenticated) {
    return {
      title: "Обращения",
      items: [
        { action: "dashboard:create-case", label: "Создать обращение", active: false }
      ]
    };
  }

  return {
    title: "О сервисе",
    items: []
  };
}

function deriveScopedCategoryItems(input = {}) {
  const scopeOptions = Array.isArray(input.scopeOptions) ? input.scopeOptions : [];
  const categoryOptions = Array.isArray(input.categoryOptions) ? input.categoryOptions : [];
  const scopePrefix = String(input.scopePrefix || "");
  const scopeActiveValue = String(input.scopeActiveValue || "");
  const categoryPrefix = String(input.categoryPrefix || "");
  const categoryActiveValue = String(input.categoryActiveValue || "");

  const scopeItems = scopeOptions.map((item) => ({
    action: `${scopePrefix}:${item.value}`,
    label: item.label,
    active: scopeActiveValue === item.value
  }));

  const categoryItems = categoryOptions.map((item) => ({
    action: `${categoryPrefix}:${item.value}`,
    label: item.label,
    active: categoryActiveValue === item.value
  }));

  return scopeItems
    .concat(scopeItems.length ? [{ action: "__divider__", label: "", active: false }] : [])
    .concat(categoryItems);
}
