// KMRL Train Scheduling System - Type Definitions

export interface Train {
  id: string;
  name: string;
  type: 'metro' | 'express' | 'local';
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  currentLocation: string;
  nextMaintenance: string;
}

export interface Route {
  id: string;
  name: string;
  stations: string[];
  distance: number;
  estimatedTime: number;
}

export interface Schedule {
  id: string;
  trainId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'delayed';
  frequency: number;
  passengerLoad: number;
}

export interface Conflict {
  id: string;
  scheduleId1: string;
  scheduleId2: string;
  conflictType: 'temporal_overlap' | 'resource_conflict' | 'capacity_exceeded' | 'maintenance_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedResolution: string;
  confidenceScore: number;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface OptimizationResult {
  id: string;
  originalScheduleId: string;
  optimizedDepartureTime: string;
  optimizedArrivalTime: string;
  efficiencyScore: number;
  improvementPercentage: number;
  optimizationDetails: {
    delayReduction: number;
    utilizationImprovement: number;
    energySavings: number;
  };
  createdAt: string;
}

export interface KPIMetrics {
  totalTrains: number;
  activeSchedules: number;
  onTimePerformance: number; // percentage
  averageDelay: number; // minutes
  trainUtilization: number; // percentage
  passengerSatisfaction: number; // percentage
  energyEfficiency: number; // percentage
  conflictsDetected: number;
  conflictsResolved: number;
  lastUpdated: string;
}

export interface KPI {
  id: string;
  title: string;
  value: number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

export interface ScheduleFilters {
  trainNumber?: string;
  routeCode?: string;
  startDate?: string;
  endDate?: string;
  status?: Schedule['status'];
  delayThreshold?: number;
}

export interface UploadedDataset {
  id: string;
  filename: string;
  fileType: 'csv' | 'json';
  fileSize: number;
  recordCount: number;
  uploadedAt: string;
  processed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  validationErrors?: string[];
}

export interface AIOptimizationRequest {
  scheduleIds: string[];
  optimizationType: 'efficiency' | 'delay_minimization' | 'energy_optimization' | 'passenger_satisfaction';
  constraints: {
    maxDelayMinutes: number;
    minTurnaroundTime: number;
    maintenanceWindows: string[];
  };
  preferences: {
    prioritizeOnTime: number; // 0-1
    prioritizeEfficiency: number; // 0-1
    prioritizePassengerComfort: number; // 0-1
  };
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeFields: string[];
  filters?: ScheduleFilters;
}

export interface DashboardData {
  kpis: KPIMetrics;
  recentSchedules: Schedule[];
  activeConflicts: Conflict[];
  utilizationTrends: {
    date: string;
    utilization: number;
    onTimePerformance: number;
  }[];
  trainPerformance: {
    trainNumber: string;
    efficiency: number;
    delayMinutes: number;
    utilizationRate: number;
  }[];
}

// API Response Types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  category?: string;
}

export interface GanttChartData {
  taskId: string;
  taskName: string;
  startTime: string;
  endTime: string;
  progress: number;
  resource: string;
  conflicts?: boolean;
}

export interface UtilizationChartData {
  timeSlot: string;
  utilization: number;
  capacity: number;
  efficiency: number;
}