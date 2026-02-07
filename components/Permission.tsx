import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';
import { User } from '../types';

interface PermissionProps {
  graphToken: string;
  currentUser?: User;
}

const DEFAULT_ROLES = ['Admin', 'Manager', 'Staff', 'Viewer'];

export const Permission: React.FC<PermissionProps> = ({ graphToken, currentUser }) => {
  const [users, setUsers] = useState<User[]>([
    { Id: '1', Name: 'John Doe', EMail: 'john@company.com', UserRole: 'Admin' },
    { Id: '2', Name: 'Jane Smith', EMail: 'jane@company.com', UserRole: 'Manager' },
    { Id: '3', Name: 'Bob Johnson', EMail: 'bob@company.com', UserRole: 'Staff' },
  ]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Staff');

  const handleAddUser = () => {
    if (!newUserEmail) return;
    const newUser: User = {
      Id: Date.now().toString(),
      Name: newUserEmail.split('@')[0],
      EMail: newUserEmail,
      UserRole: newUserRole,
    };
    setUsers([...users, newUser]);
    setNewUserEmail('');
    setShowAddUser(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      setUsers(users.filter(u => u.Id !== userId));
    }
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    setUsers(users.map(u => (u.Id === userId ? { ...u, UserRole: newRole } : u)));
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-600">Manage user roles and access</p>
        </div>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Add New User</h2>
          <div className="grid grid-cols-[1fr_200px_auto] gap-4">
            <input
              type="email"
              value={newUserEmail}
              onChange={e => setNewUserEmail(e.target.value)}
              placeholder="user@company.com"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={newUserRole}
              onChange={e => setNewUserRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {DEFAULT_ROLES.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_200px_auto] gap-4 bg-gray-900 text-white p-4 font-bold text-sm">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Action</div>
        </div>

        <div className="divide-y">
          {users.map(user => (
            <div key={user.Id} className="grid grid-cols-[2fr_1.5fr_200px_auto] gap-4 p-4 hover:bg-gray-50">
              <div className="font-medium text-gray-900">{user.Name}</div>
              <div className="text-sm text-gray-600">{user.EMail}</div>
              <select
                value={user.UserRole || ''}
                onChange={e => handleChangeRole(user.Id, e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {DEFAULT_ROLES.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleDeleteUser(user.Id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete user"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Roles:</strong> Admin (full access), Manager (manage schedules), Staff (view only), Viewer (read-only access)
        </p>
      </div>
    </div>
  );
};

export default Permission;
