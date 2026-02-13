'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Mail, 
  Phone,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  CheckSquare,
  X,
  AlertTriangle,
  Save
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[] | null;
  is_active: number;
  created_at: string;
}

export default function ProviderStaffPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    role: 'technician',
    permissions: [] as string[],
    isActive: true
  });

  useEffect(() => {
    if (user) {
      loadStaff();
    }
  }, [user]);

  useEffect(() => {
    filterStaffMembers();
  }, [staff, searchQuery, filterRole, filterStatus]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ staff: StaffMember[] }>('/provider/staff');
      setStaff(data.staff);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'فشل تحميل قائمة الفريق' : 'Failed to load staff list' 
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStaffMembers = () => {
    let filtered = [...staff];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.first_name.toLowerCase().includes(query) ||
          member.last_name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.phone.includes(query)
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter((member) => member.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (member) => member.is_active === (filterStatus === 'active' ? 1 : 0)
      );
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = async () => {
    if (!formData.userId.trim()) {
      setMessage({ 
        type: 'error', 
        text: language === 'ar' ? 'يرجى إدخال معرف المستخدم' : 'Please enter user ID' 
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/provider/staff', {
        userId: formData.userId,
        role: formData.role,
        permissions: formData.permissions.length > 0 ? formData.permissions : null,
        isActive: formData.isActive ? 1 : 0
      });
      
      setMessage({ 
        type: 'success', 
        text: language === 'ar' ? 'تم إضافة العضو بنجاح' : 'Staff member added successfully' 
      });
      setShowAddDialog(false);
      resetForm();
      await loadStaff();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || (language === 'ar' ? 'فشل إضافة العضو' : 'Failed to add staff member') 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStaff = async () => {
    if (!currentStaff) return;
    
    try {
      setActionLoading(true);
      await api.put('/provider/staff', {
        id: currentStaff.id,
        role: formData.role,
        permissions: formData.permissions.length > 0 ? formData.permissions : null,
        isActive: formData.isActive ? 1 : 0
      });
      
      setMessage({ 
        type: 'success', 
        text: language === 'ar' ? 'تم تحديث بيانات العضو بنجاح' : 'Staff member updated successfully' 
      });
      setShowEditDialog(false);
      setCurrentStaff(null);
      resetForm();
      await loadStaff();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || (language === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update staff member') 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    const idsToDelete = selectedStaff.size > 0 
      ? Array.from(selectedStaff) 
      : currentStaff ? [currentStaff.id] : [];

    if (idsToDelete.length === 0) return;

    try {
      setActionLoading(true);
      await api.delete('/provider/staff', { ids: idsToDelete });
      
      setMessage({ 
        type: 'success', 
        text: language === 'ar' 
          ? `تم حذف ${idsToDelete.length} عضو بنجاح` 
          : `Successfully deleted ${idsToDelete.length} member(s)` 
      });
      setShowDeleteDialog(false);
      setSelectedStaff(new Set());
      setCurrentStaff(null);
      await loadStaff();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || (language === 'ar' ? 'فشل حذف الأعضاء' : 'Failed to delete staff members') 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      role: 'technician',
      permissions: [],
      isActive: true
    });
  };

  const openEditDialog = (member: StaffMember) => {
    setCurrentStaff(member);
    setFormData({
      userId: member.user_id,
      role: member.role || 'technician',
      permissions: member.permissions || [],
      isActive: member.is_active === 1
    });
    setShowEditDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedStaff.size === filteredStaff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(filteredStaff.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStaff(newSelected);
  };

  const getRoleBadge = (role: string) => {
    const roles: any = {
      manager: { label: language === 'ar' ? 'مدير' : 'Manager', variant: 'default' },
      technician: { label: language === 'ar' ? 'فني' : 'Technician', variant: 'secondary' },
      support: { label: language === 'ar' ? 'دعم' : 'Support', variant: 'outline' }
    };
    return roles[role] || { label: role, variant: 'secondary' };
  };

  const availablePermissions = [
    { value: 'view_bookings', label: language === 'ar' ? 'عرض الحجوزات' : 'View Bookings' },
    { value: 'manage_bookings', label: language === 'ar' ? 'إدارة الحجوزات' : 'Manage Bookings' },
    { value: 'manage_staff', label: language === 'ar' ? 'إدارة الفريق' : 'Manage Staff' },
    { value: 'view_reports', label: language === 'ar' ? 'عرض التقارير' : 'View Reports' },
    { value: 'manage_services', label: language === 'ar' ? 'إدارة الخدمات' : 'Manage Services' }
  ];

  const togglePermission = (permission: string) => {
    if (formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permission)
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission]
      });
    }
  };

  if (loading) {
    return (
      <ProviderLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="w-8 h-8" />
                {language === 'ar' ? 'إدارة الفريق' : 'Staff Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' 
                  ? `إجمالي الأعضاء: ${staff.length}` 
                  : `Total Members: ${staff.length}`}
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة عضو جديد' : 'Add New Member'}
            </Button>
          </div>

          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم، البريد أو الهاتف...' : 'Search by name, email or phone...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الدور' : 'Role'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</SelectItem>
                  <SelectItem value="manager">{language === 'ar' ? 'مدير' : 'Manager'}</SelectItem>
                  <SelectItem value="technician">{language === 'ar' ? 'فني' : 'Technician'}</SelectItem>
                  <SelectItem value="support">{language === 'ar' ? 'دعم' : 'Support'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedStaff.size > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar' 
                    ? `حذف المحدد (${selectedStaff.size})` 
                    : `Delete Selected (${selectedStaff.size})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStaff(new Set())}
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إلغاء التحديد' : 'Clear Selection'}
                </Button>
              </div>
            )}
          </Card>

          {/* Staff List */}
          <div className="space-y-4">
            {filteredStaff.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد أعضاء فريق حتى الآن' : 'No staff members yet'}
                </p>
                {!searchQuery && filterRole === 'all' && filterStatus === 'all' && (
                  <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة أول عضو' : 'Add First Member'}
                  </Button>
                )}
              </Card>
            ) : (
              <>
                {filteredStaff.length > 1 && (
                  <div className="flex items-center gap-2 px-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors"
                    >
                      <CheckSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {selectedStaff.size === filteredStaff.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {filteredStaff.map((member) => (
                  <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedStaff.has(member.id)}
                        onChange={() => toggleSelect(member.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 cursor-pointer"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold">
                                {member.first_name} {member.last_name}
                              </h3>
                              <Badge variant={getRoleBadge(member.role).variant as any}>
                                {getRoleBadge(member.role).label}
                              </Badge>
                              {member.is_active ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {language === 'ar' ? 'نشط' : 'Active'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <UserX className="w-3 h-3 mr-1" />
                                  {language === 'ar' ? 'غير نشط' : 'Inactive'}
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{member.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span dir="ltr">{member.phone}</span>
                              </div>
                            </div>

                            {member.permissions && member.permissions.length > 0 && (
                              <div className="flex items-start gap-2 flex-wrap">
                                <Shield className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {member.permissions.map((perm) => (
                                    <Badge key={perm} variant="secondary" className="text-xs">
                                      {availablePermissions.find(p => p.value === perm)?.label || perm}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentStaff(member);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'حذف' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Add Staff Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إضافة عضو جديد للفريق' : 'Add New Staff Member'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' 
                    ? 'أدخل معلومات العضو الجديد وحدد الدور والصلاحيات' 
                    : 'Enter new staff member information and set role and permissions'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'معرف المستخدم' : 'User ID'}
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  <Input
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    placeholder={language === 'ar' ? 'أدخل معرف المستخدم' : 'Enter user ID'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' 
                      ? 'يجب أن يكون المستخدم مسجلاً في النظام' 
                      : 'User must be registered in the system'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                  </label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">{language === 'ar' ? 'مدير' : 'Manager'}</SelectItem>
                      <SelectItem value="technician">{language === 'ar' ? 'فني' : 'Technician'}</SelectItem>
                      <SelectItem value="support">{language === 'ar' ? 'دعم' : 'Support'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">
                    {language === 'ar' ? 'الصلاحيات' : 'Permissions'}
                  </label>
                  <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                    {availablePermissions.map((perm) => (
                      <label key={perm.value} className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.value)}
                          onChange={() => togglePermission(perm.value)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                    {language === 'ar' ? 'تفعيل العضو' : 'Activate Member'}
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleAddStaff} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Staff Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعديل بيانات العضو' : 'Edit Staff Member'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' 
                    ? 'قم بتحديث الدور والصلاحيات للعضو' 
                    : 'Update role and permissions for the staff member'}
                </DialogDescription>
              </DialogHeader>

              {currentStaff && (
                <div className="py-4">
                  <div className="bg-muted p-3 rounded-md mb-4">
                    <p className="font-medium">{currentStaff.first_name} {currentStaff.last_name}</p>
                    <p className="text-sm text-muted-foreground">{currentStaff.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === 'ar' ? 'الدور الوظيفي' : 'Role'}
                      </label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">{language === 'ar' ? 'مدير' : 'Manager'}</SelectItem>
                          <SelectItem value="technician">{language === 'ar' ? 'فني' : 'Technician'}</SelectItem>
                          <SelectItem value="support">{language === 'ar' ? 'دعم' : 'Support'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">
                        {language === 'ar' ? 'الصلاحيات' : 'Permissions'}
                      </label>
                      <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                        {availablePermissions.map((perm) => (
                          <label key={perm.value} className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.value)}
                              onChange={() => togglePermission(perm.value)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="editIsActive" className="text-sm font-medium cursor-pointer">
                        {language === 'ar' ? 'تفعيل العضو' : 'Activate Member'}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleEditStaff} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
                </DialogTitle>
                <DialogDescription>
                  {selectedStaff.size > 0 
                    ? language === 'ar' 
                      ? `هل أنت متأكد من حذف ${selectedStaff.size} عضو؟ هذا الإجراء لا يمكن التراجع عنه.`
                      : `Are you sure you want to delete ${selectedStaff.size} member(s)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف هذا العضو؟ هذا الإجراء لا يمكن التراجع عنه.'
                      : 'Are you sure you want to delete this member? This action cannot be undone.'}
                </DialogDescription>
              </DialogHeader>

              {currentStaff && selectedStaff.size === 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">{currentStaff.first_name} {currentStaff.last_name}</p>
                  <p className="text-sm text-muted-foreground">{currentStaff.email}</p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteStaff}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProviderLayout>
  );
}