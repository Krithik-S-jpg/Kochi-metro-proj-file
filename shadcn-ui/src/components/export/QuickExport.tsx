import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Download, FileText, Database, BarChart3, FileSpreadsheet } from 'lucide-react';
import { useExport } from '../../hooks/useExport';
import { ExportOptions } from '../../types/export';

export const QuickExport: React.FC = () => {
  const { startExport, isExporting } = useExport();

  const quickExportOptions = [
    {
      title: 'Train Schedules',
      description: 'Export all train scheduling data',
      icon: FileText,
      options: { format: 'csv' as const, dataType: 'schedules' as const, includeMetadata: true }
    },
    {
      title: 'Conflicts Report',
      description: 'Export scheduling conflicts',
      icon: Database,
      options: { format: 'excel' as const, dataType: 'conflicts' as const, includeMetadata: true }
    },
    {
      title: 'KPI Dashboard',
      description: 'Export performance metrics',
      icon: BarChart3,
      options: { format: 'json' as const, dataType: 'kpi' as const, includeMetadata: true }
    },
    {
      title: 'Complete Dataset',
      description: 'Export all data in JSON format',
      icon: FileSpreadsheet,
      options: { format: 'json' as const, dataType: 'all' as const, includeMetadata: true }
    }
  ];

  const handleQuickExport = async (options: ExportOptions) => {
    try {
      await startExport(options);
    } catch (error) {
      console.error('Quick export failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Quick Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickExportOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickExport(option.options)}
                  disabled={isExporting}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as {option.options.format.toUpperCase()}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};