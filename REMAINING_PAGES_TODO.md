# Remaining Pages Enhancement - Implementation Guide

This document provides step-by-step instructions for completing the enhancement of MapViewPage, SettingsPage, PermissionsPage, and LoginPage.

---

## 1. MapViewPage.tsx

**Status:** 60% Complete (Structure ready, needs interaction)

### Missing Features to Add:

#### A. Group Filtering
```typescript
const [activeGroup, setActiveGroup] = useState<'A' | 'B' | 'C'>('A');
const handleGroupSelect = (group: 'A' | 'B' | 'C') => {
  setActiveGroup(group);
  // Update displayed markers based on group
};
```

#### B. Marker Selection & Highlighting
```typescript
const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

const handleMarkerClick = (markerNumber: number) => {
  setSelectedMarker(markerNumber);
  // Update bottom sheet with shop details
};

// Apply highlighting
className={selectedMarker === marker.number ? 'w-10 h-10 border-4' : ''}
```

#### C. Shop List with Click Handlers
```typescript
const handleShopSelect = (shopId: string) => {
  // Find and select marker for this shop
  const markerNumber = shops.find(s => s.id === shopId)?.markerNumber;
  setSelectedMarker(markerNumber);
};

// In bottom sheet:
<div onClick={() => handleShopSelect(shop.id)}>
  {/* Shop list item */}
</div>
```

#### D. Map Navigation Controls
```typescript
const handleZoomIn = () => console.log('Zoom in');
const handleZoomOut = () => console.log('Zoom out');
const handleCenterMap = () => {
  // Reset map to center view
};
```

### Implementation Priority: HIGH
These are core map interactions users will expect.

---

## 2. SettingsPage.tsx

**Status:** 50% Complete (Layout ready, needs form logic)

### Missing Features to Add:

#### A. Settings Form State
```typescript
const [settings, setSettings] = useState({
  companyName: 'Stock Take Scheduler',
  email: 'admin@example.com',
  phone: '+852 2345 6789',
  timeZone: 'Asia/Hong_Kong',
  defaultLanguage: 'en',
  notificationsEmail: true,
  notificationsSMS: false,
  autoExportReports: true,
  darkMode: false,
});

const handleSettingChange = (key: string, value: any) => {
  setSettings(prev => ({ ...prev, [key]: value }));
};
```

#### B. Save Handler
```typescript
const handleSaveSettings = async () => {
  try {
    // Call API to save settings
    console.log('Saving settings:', settings);
    // Show success notification
  } catch (error) {
    // Show error notification
  }
};
```

#### C. Password Change Modal
```typescript
const [showPasswordModal, setShowPasswordModal] = useState(false);
const [passwordForm, setPasswordForm] = useState({
  current: '',
  new: '',
  confirm: '',
});

const handleChangePassword = async () => {
  if (passwordForm.new !== passwordForm.confirm) {
    // Show error
    return;
  }
  // Call API
};
```

#### D. Logout Handler
```typescript
const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    // Clear auth tokens
    localStorage.removeItem('graphToken');
    sessionStorage.removeItem('currentUser');
    // Navigate to login
    onNavigate?.('login');
  }
};
```

### Implementation Priority: MEDIUM
Important for user account management.

---

## 3. PermissionsPage.tsx

**Status:** 40% Complete (Layout ready, needs user management)

### Missing Features to Add:

#### A. User Data State
```typescript
const [users, setUsers] = useState<User[]>([
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
  },
  // ... more users
]);

const [roles, setRoles] = useState<Role[]>([
  {
    id: 'admin',
    name: 'Admin',
    permissions: ['create', 'read', 'update', 'delete', 'manage_users'],
  },
  // ... more roles
]);
```

#### B. Role Assignment
```typescript
const handleChangeRole = (userId: string, newRole: string) => {
  setUsers(prev =>
    prev.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    )
  );
  // Call API to update
};
```

#### C. User Management
```typescript
const handleDeleteUser = (userId: string) => {
  if (confirm('Delete this user?')) {
    setUsers(prev => prev.filter(u => u.id !== userId));
    // Call API
  }
};

const handleAddUser = (email: string) => {
  // Create new user
  // Call API
};

const handleEditUser = (userId: string, data: Partial<User>) => {
  setUsers(prev =>
    prev.map(u => u.id === userId ? { ...u, ...data } : u)
  );
  // Call API
};
```

#### D. Permission Checkbox Handlers
```typescript
const handlePermissionChange = (roleId: string, permission: string) => {
  setRoles(prev =>
    prev.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: role.permissions.includes(permission)
            ? role.permissions.filter(p => p !== permission)
            : [...role.permissions, permission],
        };
      }
      return role;
    })
  );
};
```

### Implementation Priority: MEDIUM-HIGH
Critical for user & permission management.

---

## 4. LoginPage.tsx

**Status:** 30% Complete (UI ready, needs auth logic)

### Missing Features to Add:

#### A. Form State & Validation
```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  rememberMe: false,
});

const [errors, setErrors] = useState<Record<string, string>>({});
const [isLoading, setIsLoading] = useState(false);

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.email) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email format';
  }

  if (!formData.password) {
    newErrors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### B. Form Submission
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsLoading(true);
  try {
    // Call authentication API
    // Store token in localStorage
    // Redirect to dashboard
    onNavigate?.('dashboard');
  } catch (error) {
    setErrors({ submit: 'Invalid credentials' });
  } finally {
    setIsLoading(false);
  }
};
```

#### C. Microsoft OAuth Integration
```typescript
const handleMicrosoftSignIn = async () => {
  setIsLoading(true);
  try {
    // Call Microsoft OAuth flow
    // Get access token
    // Store in localStorage
    // Redirect to dashboard
    onNavigate?.('dashboard');
  } catch (error) {
    setErrors({ submit: 'Microsoft sign-in failed' });
  } finally {
    setIsLoading(false);
  }
};
```

#### D. Forgot Password Link
```typescript
const [showForgotPassword, setShowForgotPassword] = useState(false);

const handleForgotPassword = () => {
  setShowForgotPassword(true);
  // Show modal or redirect to forgot password page
};
```

### Implementation Priority: CRITICAL
Required for application access.

---

## 🔧 Implementation Order

### Order by Priority:
1. **LoginPage** (CRITICAL) - Users need to authenticate
2. **SettingsPage** (MEDIUM-HIGH) - Core account management
3. **PermissionsPage** (MEDIUM-HIGH) - Admin functionality
4. **MapViewPage** (HIGH) - Key user feature

### Recommended Timeline:
- **Day 1:** LoginPage + basic authentication
- **Day 2:** SettingsPage + password change
- **Day 3:** PermissionsPage + user management
- **Day 4:** MapViewPage + full interactions

---

## 🧩 Integration with Existing Services

### For LoginPage:
```typescript
// Use your authentication service
import { AuthService } from '@/services/AuthService';

const handleLogin = async () => {
  const result = await AuthService.login(email, password);
  localStorage.setItem('graphToken', result.token);
  // ... redirect
};
```

### For SettingsPage:
```typescript
// Use SharePointService
import { SharePointService } from '@/services/SharePointService';

const loadSettings = async () => {
  const userSettings = await SharePointService.getUserSettings();
  setSettings(userSettings);
};
```

### For PermissionsPage:
```typescript
// Use SharePointService or dedicated permissions API
const loadUsers = async () => {
  const users = await SharePointService.getAllUsers();
  setUsers(users);
};

const updateUserRole = async (userId: string, role: string) => {
  await SharePointService.updateUserRole(userId, role);
};
```

### For MapViewPage:
```typescript
// Use AMap JS API
import { useAMap } from '@/hooks/useAMap';

const { map, markers } = useAMap();

const handleMarkerClick = (markerId: number) => {
  // Use AMap API to highlight marker
  map.setFitView([markers[markerId]]);
};
```

---

## 📊 Testing Checklist

Before considering each page complete:

### LoginPage
- [ ] Email validation works
- [ ] Password validation works
- [ ] Error messages display correctly
- [ ] Loading state shows during submission
- [ ] Microsoft OAuth flow works
- [ ] Remember me checkbox stores preference
- [ ] Forgot password link works

### SettingsPage
- [ ] All settings load on mount
- [ ] Settings update locally
- [ ] Save button works
- [ ] Success notification shows
- [ ] Password change modal appears
- [ ] Password validation works
- [ ] Logout clears auth tokens

### PermissionsPage
- [ ] Users load on mount
- [ ] Role dropdown works
- [ ] Permission checkboxes toggle
- [ ] Add user button works
- [ ] Delete user confirmation shows
- [ ] Edit user modal works
- [ ] Changes save to API

### MapViewPage
- [ ] Markers display correctly
- [ ] Group filters work
- [ ] Marker selection highlights properly
- [ ] Bottom sheet updates with selection
- [ ] Zoom buttons work
- [ ] Shop list synchronizes with markers
- [ ] Navigation works smoothly

---

## 🎓 Code Templates

### Standard Form Component Template
```typescript
const [data, setData] = useState(initialData);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
  setIsLoading(true);
  setError(null);
  try {
    // Validation
    // API call
    // Success handling
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Standard Modal Template
```typescript
const [showModal, setShowModal] = useState(false);
const [modalData, setModalData] = useState({});

const handleOpenModal = (data?: any) => {
  if (data) setModalData(data);
  setShowModal(true);
};

const handleCloseModal = () => {
  setShowModal(false);
  setModalData({});
};

// In JSX:
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    {/* Modal content */}
  </div>
)}
```

### Standard Data Loading Template
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

---

## 💡 Tips & Best Practices

1. **State Organization:** Group related state with `useReducer` for complex forms
2. **Performance:** Use `useMemo` and `useCallback` to prevent unnecessary re-renders
3. **Error Handling:** Always provide user-friendly error messages
4. **Loading States:** Show loading indicators for async operations
5. **Validation:** Validate on both client and server side
6. **Confirmation:** Ask for confirmation before destructive actions
7. **Accessibility:** Include proper ARIA labels and keyboard navigation
8. **Testing:** Test with real data scenarios before deployment

---

## 📞 Support References

- **React Hooks:** https://react.dev/reference/react
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/icons

---

**Created:** February 7, 2026
**Last Updated:** February 7, 2026
**Status:** Ready for Implementation
