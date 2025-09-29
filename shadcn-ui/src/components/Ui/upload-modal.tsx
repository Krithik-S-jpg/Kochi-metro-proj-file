import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Train, Route, Schedule } from '@/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUploaded: (data: {
    trains?: Train[];
    routes?: Route[];
    schedules?: Schedule[];
    rawData?: Record<string, unknown>[];
  }) => void;
}

export default function UploadModal({ isOpen, onClose, onDataUploaded }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const validExtensions = /\.(json|xlsx|xls|csv)$/i;
    
    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      setError('Please upload a JSON, Excel (.xlsx, .xls), or CSV file');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const parseFile = async (file: File): Promise<Record<string, unknown>[]> => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      return Array.isArray(jsonData) ? jsonData : [jsonData];
    } else if (fileName.endsWith('.csv')) {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            } else {
              resolve(results.data as Record<string, unknown>[]);
            }
          },
          error: (error) => reject(error)
        });
      });
    } else {
      // Excel files
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    }
  };

  const processData = (rawData: Record<string, unknown>[]) => {
    const trains: Train[] = [];
    const routes: Route[] = [];
    const schedules: Schedule[] = [];

    rawData.forEach((item, index) => {
      // Simple data classification based on common field patterns
      if (item.trainId || item.train_id || item.trainNumber || item.train_number) {
        trains.push({
          id: (item.trainId as string) || (item.train_id as string) || (item.id as string) || `train_${index + 1}`,
          name: (item.name as string) || (item.trainName as string) || (item.train_name as string) || `Train ${index + 1}`,
          type: ((item.type as string) || 'metro') as 'metro' | 'express' | 'local',
          capacity: parseInt(item.capacity as string) || 300,
          status: ((item.status as string) || 'active') as 'active' | 'maintenance' | 'inactive',
          currentLocation: (item.currentLocation as string) || (item.current_location as string) || 'Aluva',
          nextMaintenance: (item.nextMaintenance as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      
      if (item.routeId || item.route_id || item.routeName || item.route_name || item.stations) {
        const stations = item.stations || item.stops || ['Aluva', 'Kalamassery', 'Edapally', 'MG Road', 'Maharajas'];
        routes.push({
          id: (item.routeId as string) || (item.route_id as string) || (item.id as string) || `route_${index + 1}`,
          name: (item.name as string) || (item.routeName as string) || (item.route_name as string) || `Route ${index + 1}`,
          stations: Array.isArray(stations) ? stations as string[] : (stations as string).split(',').map((s: string) => s.trim()),
          distance: parseFloat(item.distance as string) || 25.5,
          estimatedTime: parseInt(item.estimatedTime as string) || parseInt(item.estimated_time as string) || 45
        });
      }
      
      if (item.scheduleId || item.schedule_id || item.departureTime || item.departure_time) {
        schedules.push({
          id: (item.scheduleId as string) || (item.schedule_id as string) || (item.id as string) || `schedule_${index + 1}`,
          trainId: (item.trainId as string) || (item.train_id as string) || `train_${index + 1}`,
          routeId: (item.routeId as string) || (item.route_id as string) || `route_${index + 1}`,
          departureTime: (item.departureTime as string) || (item.departure_time as string) || '06:00',
          arrivalTime: (item.arrivalTime as string) || (item.arrival_time as string) || '06:45',
          frequency: parseInt(item.frequency as string) || 15,
          status: ((item.status as string) || 'scheduled') as 'scheduled' | 'active' | 'completed' | 'cancelled' | 'delayed',
          passengerLoad: parseInt(item.passengerLoad as string) || parseInt(item.passenger_load as string) || 150
        });
      }
    });

    return { trains, routes, schedules };
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      setUploadProgress(25);
      await new Promise(resolve => setTimeout(resolve, 300));

      const rawData = await parseFile(file);
      setUploadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));

      const processedData = processData(rawData);
      setUploadProgress(75);
      await new Promise(resolve => setTimeout(resolve, 300));

      setUploadProgress(100);
      setSuccess(`Successfully processed ${file.name} with ${rawData.length} records`);

      // Notify parent component
      onDataUploaded({
        ...processedData,
        rawData
      });

      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        train_id: 'T001',
        train_name: 'Metro Express 1',
        type: 'metro',
        capacity: 300,
        status: 'active',
        current_location: 'Aluva',
        route_id: 'R001',
        route_name: 'Blue Line',
        stations: 'Aluva,Kalamassery,Edapally,MG Road,Maharajas',
        distance: 25.5,
        departure_time: '06:00',
        arrival_time: '06:45',
        frequency: 15,
        passenger_load: 150
      },
      {
        train_id: 'T002',
        train_name: 'Metro Express 2',
        type: 'metro',
        capacity: 300,
        status: 'active',
        current_location: 'Maharajas',
        route_id: 'R001',
        route_name: 'Blue Line',
        stations: 'Maharajas,MG Road,Edapally,Kalamassery,Aluva',
        distance: 25.5,
        departure_time: '06:15',
        arrival_time: '07:00',
        frequency: 15,
        passenger_load: 180
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Train Schedule Data');
    XLSX.writeFile(wb, 'kmrl_train_data_template.xlsx');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Train Data
          </DialogTitle>
          <DialogDescription>
            Upload JSON, Excel, or CSV files containing train scheduling data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : isUploading
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-3">
                <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Processing file...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">
                    {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    or click to browse files
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>

          {/* Supported Formats */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary">JSON</Badge>
            <Badge variant="secondary">Excel (.xlsx)</Badge>
            <Badge variant="secondary">CSV</Badge>
          </div>

          {/* Progress and Status */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}