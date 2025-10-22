export type UserRole = "admin" | "manager" | "shop_floor" | "sales" | "readonly";

export interface Permissions {
  canViewProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canUpdateStock: boolean;
  canViewStock: boolean;
  canManagePOs: boolean;
  canViewPOs: boolean;
  canManageUsers: boolean;
  canViewUsers: boolean;
  canAccessAI: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
  canManageForms: boolean;
  canFillForms: boolean;
}

export function getPermissions(role: UserRole): Permissions {
  switch (role) {
    case "admin":
      return {
        canViewProducts: true,
        canEditProducts: true,
        canDeleteProducts: true,
        canUpdateStock: true,
        canViewStock: true,
        canManagePOs: true,
        canViewPOs: true,
        canManageUsers: true,
        canViewUsers: true,
        canAccessAI: true,
        canExportData: true,
        canViewAnalytics: true,
        canManageForms: true,
        canFillForms: true,
      };

    case "manager":
      return {
        canViewProducts: true,
        canEditProducts: true,
        canDeleteProducts: false,
        canUpdateStock: true,
        canViewStock: true,
        canManagePOs: true,
        canViewPOs: true,
        canManageUsers: false,
        canViewUsers: true,
        canAccessAI: true,
        canExportData: true,
        canViewAnalytics: true,
        canManageForms: true,
        canFillForms: true,
      };

    case "shop_floor":
      return {
        canViewProducts: true,
        canEditProducts: false,
        canDeleteProducts: false,
        canUpdateStock: true,
        canViewStock: true,
        canManagePOs: false,
        canViewPOs: false,
        canManageUsers: false,
        canViewUsers: false,
        canAccessAI: false,
        canExportData: false,
        canViewAnalytics: false,
        canManageForms: false,
        canFillForms: true,
      };

    case "sales":
      return {
        canViewProducts: true,
        canEditProducts: false,
        canDeleteProducts: false,
        canUpdateStock: false,
        canViewStock: true,
        canManagePOs: false,
        canViewPOs: false,
        canManageUsers: false,
        canViewUsers: false,
        canAccessAI: true,
        canExportData: false,
        canViewAnalytics: false,
        canManageForms: false,
        canFillForms: false,
      };

    case "readonly":
    default:
      return {
        canViewProducts: true,
        canEditProducts: false,
        canDeleteProducts: false,
        canUpdateStock: false,
        canViewStock: true,
        canManagePOs: false,
        canViewPOs: false,
        canManageUsers: false,
        canViewUsers: false,
        canAccessAI: false,
        canExportData: false,
        canViewAnalytics: false,
        canManageForms: false,
        canFillForms: false,
      };
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "manager":
      return "Manager";
    case "shop_floor":
      return "Shop Floor";
    case "sales":
      return "Sales";
    case "readonly":
      return "Read-Only";
    default:
      return role;
  }
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Full system access including user management";
    case "manager":
      return "Manage products, stock, and purchase orders";
    case "shop_floor":
      return "Update stock levels and fill forms";
    case "sales":
      return "Search products and view inventory";
    case "readonly":
      return "View-only access to products and stock";
    default:
      return "";
  }
}

