export interface ExportOptions {
    format: 'csv' | 'json' | 'excel';
    dataType: 'schedules' | 'conflicts' | 'kpi' | 'reports' | 'all';
    dateRange?: {
      start: Date;
      end: Date;
    };
    includeMetadata?: boolean;
  }
  
  export interface ExportJob {
    id: string;
    name: string;
    format: 'csv' | 'json' | 'excel';
    dataType: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    createdAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    fileSize?: number;
    error?: string;
  }
  
  export interface ExportHistory {
    jobs: ExportJob[];
    totalExports: number;
    totalSize: number;
  }