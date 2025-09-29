import { ExportOptions, ExportJob } from '../types/export';
import { scheduleData, conflictData, kpiData } from './sampleData';

// Utility function to convert data to CSV
export const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

// Utility function to create Excel-compatible CSV with BOM
export const convertToExcelCSV = (data: any[]): Uint8Array => {
  const csv = convertToCSV(data);
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;
  return new TextEncoder().encode(csvWithBOM);
};

// Utility function to create Excel file (using CSV format for simplicity)
export const convertToExcel = (data: any[], sheetName: string = 'Sheet1'): Uint8Array => {
  // For a free solution, we'll create a CSV file that Excel can open
  // This avoids the need for paid Excel libraries
  return convertToExcelCSV(data);
};

// Get data based on type
export const getDataByType = (dataType: string) => {
  switch (dataType) {
    case 'schedules':
      return scheduleData;
    case 'conflicts':
      return conflictData;
    case 'kpi':
      return kpiData;
    case 'reports':
      return generateReportData();
    case 'all':
      return {
        schedules: scheduleData,
        conflicts: conflictData,
        kpi: kpiData,
        reports: generateReportData()
      };
    default:
      return [];
  }
};

// Generate report data
const generateReportData = () => {
  return [
    {
      reportType: 'Daily Summary',
      date: new Date().toISOString().split('T')[0],
      totalTrains: scheduleData.length,
      onTimePerformance: '94.2%',
      averageDelay: '2.3 minutes',
      totalConflicts: conflictData.length,
      resolvedConflicts: conflictData.filter(c => c.status === 'resolved').length,
      passengerSatisfaction: '4.2/5'
    },
    {
      reportType: 'Weekly Summary',
      date: new Date().toISOString().split('T')[0],
      totalTrains: scheduleData.length * 7,
      onTimePerformance: '92.8%',
      averageDelay: '2.8 minutes',
      totalConflicts: conflictData.length * 7,
      resolvedConflicts: conflictData.filter(c => c.status === 'resolved').length * 7,
      passengerSatisfaction: '4.1/5'
    }
  ];
};

// Create download blob
export const createDownloadBlob = (data: any, format: string, filename: string): string => {
  let blob: Blob;
  let mimeType: string;
  
  switch (format) {
    case 'csv':
      const csvData = Array.isArray(data) ? convertToCSV(data) : convertToCSV([data]);
      blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      break;
    case 'excel':
      const excelData = Array.isArray(data) ? convertToExcel(data) : convertToExcel([data]);
      blob = new Blob([excelData], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      break;
    case 'json':
    default:
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      break;
  }
  
  return URL.createObjectURL(blob);
};

// Download file
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate filename
export const generateFilename = (dataType: string, format: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `kmrl-${dataType}-${timestamp}.${format}`;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};