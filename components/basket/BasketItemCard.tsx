'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Trash2, Zap, Repeat, Calendar as CalendarIcon, Clock,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { BasketItem } from '@/lib/contexts/BasketContext';

interface BasketItemCardProps {
  item: BasketItem;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BasketItem>) => void;
}

export function BasketItemCard({ item, onRemove, onUpdate }: BasketItemCardProps) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(true);

  const serviceName = language === 'ar' ? (item.serviceNameAr || item.serviceName) : item.serviceName;

  // Recalculate final price when options change
  const recalculatedPrice = useMemo(() => {
    let price = item.basePrice;
    if (item.isUrgent && item.urgentFee) {
      price += item.urgentFee;
    }
    if (item.addons) {
      for (const addon of item.addons) {
        price += addon.price;
      }
    }
    return price;
  }, [item.basePrice, item.isUrgent, item.urgentFee, item.addons]);

  // Update final price when recalculated price changes
  useEffect(() => {
    if (Math.abs(recalculatedPrice - item.finalPrice) > 0.01) {
      onUpdate(item.id, { finalPrice: recalculatedPrice });
    }
  }, [recalculatedPrice, item.finalPrice, item.id, onUpdate]);

  const handleUrgentToggle = (checked: boolean) => {
    onUpdate(item.id, {
      isUrgent: checked,
      finalPrice: checked
        ? item.basePrice + (item.urgentFee || 0) + (item.addons?.reduce((s, a) => s + a.price, 0) || 0)
        : item.basePrice + (item.addons?.reduce((s, a) => s + a.price, 0) || 0),
    });
  };

  const handleRecurringChange = (value: string) => {
    onUpdate(item.id, {
      recurringType: value === 'none' ? null : (value as 'daily' | 'weekly' | 'monthly'),
    });
  };

  const handleDateChange = (date: string) => {
    onUpdate(item.id, { scheduledDate: date });
  };

  const handleTimeChange = (time: string) => {
    onUpdate(item.id, { scheduledTime: time });
  };

  const handleNotesChange = (notes: string) => {
    onUpdate(item.id, { notes });
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const hasSchedule = item.scheduledDate && item.scheduledTime;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Item Header */}
        <div className="flex items-start gap-4">
          {/* Image */}
          <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
            {item.image ? (
              <img src={item.image} alt={serviceName} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                <span className="text-lg font-bold text-primary/30">{serviceName.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-base line-clamp-1">{serviceName}</h3>
                <p className="text-sm text-muted-foreground">{item.providerBusinessName || item.providerName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                aria-label={language === 'ar' ? 'حذف' : 'Remove'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Price Summary Row */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? 'الأساسي:' : 'Base:'} {item.basePrice.toFixed(2)} {item.currency || 'OMR'}
              </span>
              {item.isUrgent && item.urgentFee && item.urgentFee > 0 && (
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                  <Zap className="h-3 w-3 ml-1" />
                  +{item.urgentFee.toFixed(2)}
                </Badge>
              )}
              {item.recurringType && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                  <Repeat className="h-3 w-3 ml-1" />
                  {item.recurringType === 'daily'
                    ? (language === 'ar' ? 'يومي' : 'Daily')
                    : item.recurringType === 'weekly'
                    ? (language === 'ar' ? 'أسبوعي' : 'Weekly')
                    : (language === 'ar' ? 'شهري' : 'Monthly')}
                </Badge>
              )}
              <span className="font-bold text-primary mr-auto">
                {item.finalPrice.toFixed(2)} {item.currency || 'OMR'}
              </span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 text-muted-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 ml-1" />
              {language === 'ar' ? 'إخفاء الخيارات' : 'Hide Options'}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 ml-1" />
              {language === 'ar' ? 'عرض الخيارات' : 'Show Options'}
            </>
          )}
        </Button>
      </div>

      {/* Expanded Options */}
      {expanded && (
        <div className="border-t px-4 py-4 bg-muted/30 space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {language === 'ar' ? 'تاريخ الخدمة' : 'Service Date'}
              </Label>
              <Input
                type="date"
                value={item.scheduledDate || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getMinDate()}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                <Clock className="h-3.5 w-3.5" />
                {language === 'ar' ? 'وقت الخدمة' : 'Service Time'}
              </Label>
              <Input
                type="time"
                value={item.scheduledTime || ''}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {!hasSchedule && (
            <div className="flex items-center gap-2 text-xs text-orange-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              {language === 'ar' ? 'يرجى تحديد التاريخ والوقت' : 'Please set date and time'}
            </div>
          )}

          {/* Urgent Toggle */}
          {item.urgentFee !== undefined && item.urgentFee > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <Label htmlFor={`urgent-${item.id}`} className="text-sm cursor-pointer">
                  {language === 'ar' ? 'خدمة مستعجلة' : 'Urgent Service'}
                  <span className="text-xs text-orange-500 mr-1">
                    (+{item.urgentFee.toFixed(2)} {item.currency || 'OMR'})
                  </span>
                </Label>
              </div>
              <Switch
                id={`urgent-${item.id}`}
                checked={item.isUrgent}
                onCheckedChange={handleUrgentToggle}
              />
            </div>
          )}

          {/* Recurring */}
          <div>
            <Label className="text-xs font-medium flex items-center gap-1 mb-1">
              <Repeat className="h-3.5 w-3.5" />
              {language === 'ar' ? 'نوع الحجز' : 'Booking Type'}
            </Label>
            <Select
              value={item.recurringType || 'none'}
              onValueChange={handleRecurringChange}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{language === 'ar' ? 'مرة واحدة' : 'One time'}</SelectItem>
                <SelectItem value="daily">{language === 'ar' ? 'يومي' : 'Daily'}</SelectItem>
                <SelectItem value="weekly">{language === 'ar' ? 'أسبوعي' : 'Weekly'}</SelectItem>
                <SelectItem value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <Label className="text-xs font-medium mb-1">
                {language === 'ar' ? 'الإضافات المختارة' : 'Selected Add-ons'}
              </Label>
              <div className="space-y-1">
                {item.addons.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between text-sm px-3 py-1.5 bg-muted rounded-md">
                    <span>{language === 'ar' ? (addon.nameAr || addon.name) : addon.name}</span>
                    <span className="font-medium">+{addon.price.toFixed(2)} {item.currency || 'OMR'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs font-medium mb-1">
              {language === 'ar' ? 'ملاحظات' : 'Notes'}
            </Label>
            <Textarea
              value={item.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={language === 'ar' ? 'أضف ملاحظات لهذه الخدمة...' : 'Add notes for this service...'}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
