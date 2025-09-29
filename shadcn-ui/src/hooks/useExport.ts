import { useState, useCallback } from 'react';
import { ExportOptions, ExportJob, ExportHistory } from '../types/export';
import { getDataByType, createDownloadBlob, downloadFile, generateFilename } from '../lib/exportUtils';

export const useExport = () => {
  const [exportHistory, setExportHistory] = useState<ExportHistory>({
    jobs: [],
    totalExports: 0,
    totalSize: 0
  });
  const [isExporting, setIsExporting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);

  const startExport = useCallback(async (options: ExportOptions, customName?: string) => {
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = customName || generateFilename(options.dataType, options.format);
    
    const job: ExportJob = {
      id: jobId,
      name: filename,
      format: options.format,
      dataType: options.dataType,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    setCurrentJob(job);
    setIsExporting(true);

    // Update job status to processing
    const processingJob = { ...job, status: 'processing' as const, progress: 10 };
    setCurrentJob(processingJob);

    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get data
      const data = getDataByType(options.dataType);
      processingJob.progress = 50;
      setCurrentJob({ ...processingJob });

      await new Promise(resolve => setTimeout(resolve, 300));

      // Apply date range filter if specified
      let filteredData = data;
      if (options.dateRange && Array.isArray(data)) {
        filteredData = data.filter((item: any) => {
          const itemDate = new Date(item.scheduledTime || item.detectedAt || item.date || new Date());
          return itemDate >= options.dateRange!.start && itemDate <= options.dateRange!.end;
        });
      }

      processingJob.progress = 75;
      setCurrentJob({ ...processingJob });

      // Add metadata if requested
      if (options.includeMetadata && Array.isArray(filteredData)) {
        const metadata = {
          exportedAt: new Date().toISOString(),
          exportOptions: options,
          recordCount: filteredData.length,
          generatedBy: 'KMRL AI-Driven Train Scheduling System'
        };
        
        if (options.format === 'json') {
          filteredData = {
            metadata,
            data: filteredData
          };
        }
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      // Create download
      const downloadUrl = createDownloadBlob(filteredData, options.format, filename);
      
      // Calculate file size (approximate)
      const dataString = JSON.stringify(filteredData);
      const fileSize = new Blob([dataString]).size;

      const completedJob: ExportJob = {
        ...processingJob,
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        downloadUrl,
        fileSize
      };

      setCurrentJob(completedJob);

      // Add to history
      setExportHistory(prev => ({
        jobs: [completedJob, ...prev.jobs],
        totalExports: prev.totalExports + 1,
        totalSize: prev.totalSize + fileSize
      }));

      // Auto-download
      downloadFile(downloadUrl, filename);

      // Clear current job after a delay
      setTimeout(() => {
        setCurrentJob(null);
        setIsExporting(false);
      }, 2000);

      return completedJob;
    } catch (error) {
      const failedJob: ExportJob = {
        ...processingJob,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      };

      setCurrentJob(failedJob);
      setExportHistory(prev => ({
        ...prev,
        jobs: [failedJob, ...prev.jobs]
      }));

      setTimeout(() => {
        setCurrentJob(null);
        setIsExporting(false);
      }, 3000);

      throw error;
    }
  }, []);

  const retryExport = useCallback(async (jobId: string) => {
    const job = exportHistory.jobs.find(j => j.id === jobId);
    if (!job) return;

    const options: ExportOptions = {
      format: job.format,
      dataType: job.dataType as any,
      includeMetadata: true
    };

    return startExport(options, job.name);
  }, [exportHistory.jobs, startExport]);

  const clearHistory = useCallback(() => {
    setExportHistory({
      jobs: [],
      totalExports: 0,
      totalSize: 0
    });
  }, []);

  const downloadFromHistory = useCallback((job: ExportJob) => {
    if (job.downloadUrl && job.status === 'completed') {
      downloadFile(job.downloadUrl, job.name);
    }
  }, []);

  return {
    exportHistory,
    isExporting,
    currentJob,
    startExport,
    retryExport,
    clearHistory,
    downloadFromHistory
  };
};