import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  FileText, 
  Calendar,
  HardDrive,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { ExportJob } from '../../types/export';
import { useExport } from '../../hooks/useExport';
import { formatFileSize } from '../../lib/exportUtils';
import { format } from 'date-fns';

export const ExportHistory: React.FC = () => {
  const { exportHistory, retryExport, clearHistory, downloadFromHistory, isExporting } = useExport();

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (exportHistory.jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Export History</h3>
          <p className="text-gray-500 text-center">
            Your export history will appear here once you start exporting data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exports</p>
                <p className="text-2xl font-bold text-gray-900">{exportHistory.totalExports}</p>
              </div>
              <Download className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(exportHistory.totalSize)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {exportHistory.totalExports > 0 
                    ? Math.round((exportHistory.jobs.filter(j => j.status === 'completed').length / exportHistory.totalExports) * 100)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Jobs List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Export History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={isExporting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exportHistory.jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {job.name}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {job.format.toUpperCase()} • {job.dataType}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(job.createdAt, 'MMM dd, yyyy HH:mm')}
                      </span>
                      {job.fileSize && (
                        <span className="flex items-center">
                          <HardDrive className="h-3 w-3 mr-1" />
                          {formatFileSize(job.fileSize)}
                        </span>
                      )}
                    </div>
                    {job.error && (
                      <p className="text-xs text-red-600 mt-1">{job.error}</p>
                    )}
                  </div>

                  {job.status === 'processing' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{job.progress}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {job.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFromHistory(job)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {job.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryExport(job.id)}
                      disabled={isExporting}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};