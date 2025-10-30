import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Shield, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getRoleDisplayName, getRoleDescription } from "@shared/permissions";
import type { UserRole } from "@shared/permissions";

export default function UserManagement() {
  const permissions = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);

  // Fetch users (you'll need to add this route)
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

  const updateUserRole = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      setEditingUser(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    }
  });

  const filteredUsers = users?.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!permissions.canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <p className="text-red-200">You don't have permission to manage users.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              User Management
            </h1>
            <p className="text-gray-400 mt-2">Manage user roles and permissions</p>
          </div>
        </div>

        {/* Search */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
        </Card>

        {/* Role Legend */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            User Roles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(['admin', 'manager', 'shop_floor', 'sales', 'readonly'] as UserRole[]).map(role => (
              <div key={role} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className={`font-semibold mb-1 ${
                  role === 'admin' ? 'text-red-400' :
                  role === 'manager' ? 'text-blue-400' :
                  role === 'shop_floor' ? 'text-green-400' :
                  role === 'sales' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {getRoleDisplayName(role)}
                </div>
                <div className="text-xs text-gray-400">
                  {getRoleDescription(role)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Users Table */}
        {isLoading ? (
          <Card className="bg-white/5 border-white/10 p-8 text-center">
            <p className="text-gray-400">Loading users...</p>
          </Card>
        ) : (
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Last Sign In
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-white">{user.name || "Unknown"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-300">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-400">
                            {user.lastSignedIn
                              ? new Date(user.lastSignedIn).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(user)}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(role) => {
            updateUserRole.mutate({ userId: editingUser.id, role });
          }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400',
    manager: 'bg-blue-500/20 text-blue-400',
    shop_floor: 'bg-green-500/20 text-green-400',
    sales: 'bg-yellow-500/20 text-yellow-400',
    readonly: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[role] || colors.readonly}`}>
      {getRoleDisplayName(role as UserRole)}
    </span>
  );
}

function EditUserDialog({ user, onClose, onSave }: any) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit User Role</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-400">User</Label>
            <p className="text-white mt-1">{user.name}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>

          <div>
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['admin', 'manager', 'shop_floor', 'sales', 'readonly'] as UserRole[]).map(role => (
                  <SelectItem key={role} value={role}>
                    {getRoleDisplayName(role)} - {getRoleDescription(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={() => onSave(selectedRole)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600"
            >
              Save Changes
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
