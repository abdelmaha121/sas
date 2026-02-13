'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
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

interface AuditLog {
  id: string;
  action_type: 'suspend' | 'ban' | 'disable' | 'enable' | 'delete';
  target_type: 'user' | 'provider';
  target_id: string;
  target_name: string;
  admin_id: string;
  admin_name: string;
  reason: string;
  duration_days: number | null;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminAuditPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTargetType, setFilterTargetType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadAuditLogs();
    }
  }, [user, pagination.page, pagination.limit, searchQuery, filterAction, filterTargetType, filterDateFrom, filterDateTo]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterAction && filterAction !== 'all') params.append('action', filterAction);
      if (filterTargetType && filterTargetType !== 'all') params.append('target_type', filterTargetType);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);

      const data = await api.get<{ logs: AuditLog[], pagination: PaginationInfo }>(
        `/admin/audit?${params.toString()}`
      );

      setAuditLogs(data.logs);
      setPagination(data.pagination);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل سجل الإجراءات' : 'Failed to load audit logs'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actions: any = {
      suspend: {
        label: language === 'ar' ? 'تعليق' : 'Suspend',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      ban: {
        label: language === 'ar' ? 'حظر' : 'Ban',
        className: 'bg-red-50 text-red-700 border-red-200'
      },
      disable: {
        label: language === 'ar' ? 'تعطيل' : 'Disable',
        className: 'bg-gray-50 text-gray-700 border-gray-200'
      },
      enable: {
        label: language === 'ar' ? 'تفعيل' : 'Enable',
        className: 'bg-green-50 text-green-700 border-green-200'
      },
      delete: {
        label: language === 'ar' ? 'حذف' : 'Delete',
        className: 'bg-red-50 text-red-700 border-red-200'
      }
    };
    return actions[action] || { label: action, variant: 'secondary' };
  };

  const getTargetTypeBadge = (type: string) => {
    return type === 'user'
      ? { label: language === 'ar' ? 'مستخدم' : 'User', className: 'bg-blue-50 text-blue-700 border-blue-200' }
      : { label: language === 'ar' ? 'مقدم خدمة' : 'Provider', className: 'bg-purple-50 text-purple-700 border-purple-200' };
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const exportAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        search: searchQuery,
        action: filterAction,
        target_type: filterTargetType,
        date_from: filterDateFrom,
        date_to: filterDateTo
      });

      // For now, just show a message that export is not implemented
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'ميزة التصدير قيد التطوير' : 'Export feature is under development'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تصدير السجل' : 'Failed to export audit logs'
      });
    }
  };

  if (loading && auditLogs.length === 0) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="w-8 h-8" />
                {language === 'ar' ? 'سجل الإجراءات الإدارية' : 'Administrative Actions Log'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? `إجمالي السجلات: ${pagination.total}`
                  : `Total Records: ${pagination.total}`}
              </p>
            </div>
            <Button onClick={exportAuditLogs} variant="outline" size="lg">
              <Download className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تصدير السجل' : 'Export Logs'}
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

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالاسم أو السبب...' : 'Search by name or reason...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'نوع الإجراء' : 'Action Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  <SelectItem value="suspend">{language === 'ar' ? 'تعليق' : 'Suspend'}</SelectItem>
                  <SelectItem value="ban">{language === 'ar' ? 'حظر' : 'Ban'}</SelectItem>
                  <SelectItem value="disable">{language === 'ar' ? 'تعطيل' : 'Disable'}</SelectItem>
                  <SelectItem value="enable">{language === 'ar' ? 'تفعيل' : 'Enable'}</SelectItem>
                  <SelectItem value="delete">{language === 'ar' ? 'حذف' : 'Delete'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTargetType} onValueChange={setFilterTargetType}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'نوع الهدف' : 'Target Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                  <SelectItem value="provider">{language === 'ar' ? 'مقدم خدمة' : 'Provider'}</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'}
                />
              </div>

              <div>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                />
              </div>
            </div>
          </Card>

          {/* Audit Logs List */}
          <div className="space-y-4">
            {/* Table Header */}
            {auditLogs.length > 0 && (
              <div className="sticky top-0 z-10 bg-background">
                <Card className="p-4 shadow-sm border-b-2">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {language === 'ar' ? 'الإجراء' : 'Action'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {language === 'ar' ? 'نوع الهدف' : 'Target Type'}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {language === 'ar' ? 'الاسم المستهدف' : 'Target Name'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {language === 'ar' ? 'المدير' : 'Admin'}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {auditLogs.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterAction !== 'all' || filterTargetType !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا توجد سجلات إجراءات حتى الآن' : 'No audit records yet'}
                </p>
              </Card>
            ) : (
              auditLogs.map((log) => {
                const actionBadge = getActionBadge(log.action_type);
                const targetTypeBadge = getTargetTypeBadge(log.target_type);

                return (
                  <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-12 gap-4">
                      {/* Action */}
                      <div className="col-span-2">
                        <Badge variant="outline" className={actionBadge.className}>
                          {actionBadge.label}
                        </Badge>
                      </div>

                      {/* Target Type */}
                      <div className="col-span-2">
                        <Badge variant="outline" className={targetTypeBadge.className}>
                          {targetTypeBadge.label}
                        </Badge>
                      </div>

                      {/* Target Name */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{log.target_name}</span>
                        </div>
                      </div>

                      {/* Admin */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">{log.admin_name}</span>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {language === 'ar' ? 'السبب:' : 'Reason:'}
                          </p>
                          <p className="text-sm">{log.reason}</p>
                          {log.duration_days && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === 'ar'
                                ? `المدة: ${log.duration_days} يوم`
                                : `Duration: ${log.duration_days} days`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `الصفحة ${pagination.page} من ${pagination.totalPages}`
                  : `Page ${pagination.page} of ${pagination.totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
