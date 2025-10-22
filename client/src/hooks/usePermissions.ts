import { useAuth } from "@/_core/hooks/useAuth";
import { getPermissions, type Permissions } from "@shared/permissions";

export function usePermissions(): Permissions & { role: string | undefined } {
  const { user } = useAuth();
  
  const role = user?.role as any;
  const permissions = role ? getPermissions(role) : getPermissions("readonly");

  return {
    ...permissions,
    role,
  };
}

