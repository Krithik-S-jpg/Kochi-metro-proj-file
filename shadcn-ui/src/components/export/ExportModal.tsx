import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../Ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../Ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Ui/select';
import { Checkbox } from '../Ui/checkbox';
import { Input } from '../Ui/input';
import { Calendar } from '../Ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../Ui/popover';
import { CalendarIcon, Download, FileText, Database, BarChart3, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ExportOptions } from '../../types/export';
import { useExport } from '../../hooks/useExport';
import { cn } from '../../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { startExport, isExporting, currentJob } = useExport();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    dataType: 'schedules',
    includeMetadata: true
  });
  const [customName, setCustomName] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined
  });

  const dataTypeOptions = [
    { value: 'schedules', label: 'Train Schedules', icon: FileText, description: 'All train scheduling data' },
    { value: 'conflicts', label: 'Conflicts', icon: Database, description: 'Scheduling conflicts and resolutions' },
    { value: 'kpi', label: 'KPI Data', icon: BarChart3, description: 'Key performance indicators' },
    { value: 'reports', label: 'Reports', icon: FileSpreadsheet, description: 'Generated reports and summaries' },
    { value: 'all', label: 'All Data', icon: Database, description: 'Complete dataset export' }
  ];

  const formatOptions = [
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { value: 'csv', label: 'CSV', description: 'Comma Separated Values' },
    { value: 'excel', label: 'Excel', description: 'Excel-compatible format' }
  ];

  const handleExport = async () => {
    try {
      const exportOptions: ExportOptions = {
        ...options,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end
        } : undefined
      };
      
      await startExport(exportOptions, customName || undefined);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const resetForm = () => {
    setOptions({
      format: 'json',
      dataType: 'schedules',
      includeMetadata: true
    });
    setCustomName('');
    setDateRange({ start: undefined, end: undefined });
  };

  const handleClose = () => {
    if (!isExporting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data Type</Label>
            <div className="grid grid-cols-1 gap-3">
              {dataTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      options.dataType === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setOptions(prev => ({ ...prev, dataType: option.value as any }))}
                  >
                    <input
                      type="radio"
                      name="dataType"
                      value={option.value}
                      checked={options.dataType === option.value}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select
              value={options.format}
              onValueChange={(value) => setOptions(prev => ({ ...prev, format: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-gray-500">{format.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Filename */}
          <div className="space-y-2">
            <Label htmlFor="customName" className="text-sm font-medium">
              Custom Filename (Optional)
            </Label>
            <Input
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Leave empty for auto-generated name"
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.start ? format(dateRange.start, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-gray-500">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.end ? format(dateRange.end, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetadata"
                checked={options.includeMetadata}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))
                }
              />
              <Label htmlFor="includeMetadata" className="text-sm">
                Include metadata and export information
              </Label>
            </div>
          </div>

          {/* Progress */}
          {isExporting && currentJob && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting {currentJob.name}...</span>
                <span>{currentJob.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentJob.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                Status: {currentJob.status}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};