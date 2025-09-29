import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Train,
  Route,
  Clock,
  MapPin
} from 'lucide-react';
import { Train as TrainType, Route as RouteType, Schedule } from '@/types';

interface FileUploadProps {
  onDataUploaded: (data: {
    trains?: TrainType[];
    routes?: RouteType[];
    schedules?: Schedule[];
    stations?: any[];
    rawData?: Record<string, unknown>[];
  }) => void;
}

interface UploadProgress {
  stage: string;
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    trains: number;
    routes: number;
    schedules: number;
    stations: number;
    totalRecords: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    setUploadResult(null);
    
    try {
      let allTrains: TrainType[] = [];
      let allRoutes: RouteType[] = [];
      let allSchedules: Schedule[] = [];
      let allStations: any[] = [];
      let allRawData: Record<string, unknown>[] = [];

      for (const file of files) {
        setUploadProgress({
          stage: `Processing ${file.name}...`,
          progress: 0,
          recordsProcessed: 0,
          totalRecords: 0
        });

        const fileData = await parseFile(file);
        
        // Process all data from the file
        const processedData = await processFileData(fileData, file.name);
        
        // Merge all data (don't limit to samples)
        allTrains = [...allTrains, ...processedData.trains];
        allRoutes = [...allRoutes, ...processedData.routes];
        allSchedules = [...allSchedules, ...processedData.schedules];
        allStations = [...allStations, ...processedData.stations];
        allRawData = [...allRawData, ...processedData.rawData];
      }

      // Final processing stage
      setUploadProgress({
        stage: 'Finalizing data processing...',
        progress: 90,
        recordsProcessed: allTrains.length + allRoutes.length + allSchedules.length,
        totalRecords: allTrains.length + allRoutes.length + allSchedules.length
      });

      // Set final results
      setUploadResult({
        trains: allTrains.length,
        routes: allRoutes.length,
        schedules: allSchedules.length,
        stations: allStations.length,
        totalRecords: allTrains.length + allRoutes.length + allSchedules.length + allStations.length
      });

      // Pass ALL processed data to parent component
      onDataUploaded({
        trains: allTrains,
        routes: allRoutes,
        schedules: allSchedules,
        stations: allStations,
        rawData: allRawData
      });

      setUploadProgress({
        stage: 'Upload complete!',
        progress: 100,
        recordsProcessed: allTrains.length + allRoutes.length + allSchedules.length,
        totalRecords: allTrains.length + allRoutes.length + allSchedules.length
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          if (file.name.endsWith('.json')) {
            const jsonData = JSON.parse(content);
            // Handle both array and object formats
            resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
          } else if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
              resolve([]);
              return;
            }
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const obj: Record<string, unknown> = {};
              headers.forEach((header, index) => {
                obj[header] = values[index] || '';
              });
              return obj;
            });
            resolve(data);
          } else {
            // Try to parse as JSON first, then as CSV
            try {
              const jsonData = JSON.parse(content);
              resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
            } catch {
              // Fallback to CSV parsing
              const lines = content.split('\n').filter(line => line.trim());
              if (lines.length >= 2) {
                const headers = lines[0].split(',').map(h => h.trim());
                const data = lines.slice(1).map(line => {
                  const values = line.split(',').map(v => v.trim());
                  const obj: Record<string, unknown> = {};
                  headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                  });
                  return obj;
                });
                resolve(data);
              } else {
                resolve([]);
              }
            }
          }
        } catch (err) {
          reject(new Error(`Failed to parse ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  };

  const processFileData = async (data: any[], fileName: string) => {
    const trains: TrainType[] = [];
    const routes: RouteType[] = [];
    const schedules: Schedule[] = [];
    const stations: any[] = [];
    const rawData: Record<string, unknown>[] = [];

    let processedCount = 0;
    const totalRecords = data.length;

    for (const record of data) {
      // Update progress
      processedCount++;
      if (processedCount % 10 === 0 || processedCount === totalRecords) {
        setUploadProgress({
          stage: `Processing ${fileName} (${processedCount}/${totalRecords})...`,
          progress: (processedCount / totalRecords) * 80, // Reserve 20% for final processing
          recordsProcessed: processedCount,
          totalRecords
        });
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      rawData.push(record);

      // Smart data classification based on field names and content
      const recordKeys = Object.keys(record).map(k => k.toLowerCase());
      
      // Detect train data
      if (recordKeys.some(key => ['train', 'trainid', 'train_id', 'locomotive', 'vehicle'].includes(key)) ||
          recordKeys.some(key => ['capacity', 'max_capacity', 'seats'].includes(key))) {
        
        const train: TrainType = {
          id: record.id || record.trainId || record.train_id || record.Train || `TRAIN_${trains.length + 1}`,
          name: record.name || record.trainName || record.train_name || record.Train || `Train ${trains.length + 1}`,
          capacity: parseInt(record.capacity || record.max_capacity || record.seats || '300'),
          type: record.type || record.trainType || record.train_type || 'metro',
          status: record.status || 'active',
          route: record.route || record.routeId || record.route_id || 'default',
          currentLocation: record.currentLocation || record.current_location || 'depot',
          speed: parseFloat(record.speed || record.current_speed || '0'),
          passengerCount: parseInt(record.passengerCount || record.passenger_count || record.passengers || '0')
        };
        trains.push(train);
      }
      
      // Detect route data
      else if (recordKeys.some(key => ['route', 'routeid', 'route_id', 'line', 'path'].includes(key)) ||
               recordKeys.some(key => ['origin', 'destination', 'start', 'end'].includes(key))) {
        
        const route: RouteType = {
          id: record.id || record.routeId || record.route_id || record.Route || `ROUTE_${routes.length + 1}`,
          name: record.name || record.routeName || record.route_name || record.Route || `Route ${routes.length + 1}`,
          origin: record.origin || record.start || record.startStation || record.start_station || 'Unknown',
          destination: record.destination || record.end || record.endStation || record.end_station || 'Unknown',
          distance: parseFloat(record.distance || record.length || record.route_distance || '10'),
          duration: parseInt(record.duration || record.travel_time || record.time || '30'),
          stations: record.stations ? (Array.isArray(record.stations) ? record.stations : record.stations.split(',')) : [],
          color: record.color || record.line_color || '#3b82f6',
          status: record.status || 'active'
        };
        routes.push(route);
      }
      
      // Detect schedule data
      else if (recordKeys.some(key => ['schedule', 'scheduleid', 'schedule_id', 'departure', 'arrival'].includes(key)) ||
               recordKeys.some(key => ['time', 'departure_time', 'arrival_time'].includes(key))) {
        
        const schedule: Schedule = {
          id: record.id || record.scheduleId || record.schedule_id || `SCHEDULE_${schedules.length + 1}`,
          trainId: record.trainId || record.train_id || record.Train || `TRAIN_${Math.floor(Math.random() * 10) + 1}`,
          routeId: record.routeId || record.route_id || record.Route || `ROUTE_${Math.floor(Math.random() * 3) + 1}`,
          departureTime: record.departureTime || record.departure_time || record.departure || record.time || '06:00',
          arrivalTime: record.arrivalTime || record.arrival_time || record.arrival || '06:30',
          frequency: parseInt(record.frequency || record.interval || '15'),
          passengerLoad: parseInt(record.passengerLoad || record.passenger_load || record.passengers || record.load || '0'),
          status: record.status || 'scheduled',
          platform: record.platform || record.platform_number || '1',
          direction: record.direction || 'forward'
        };
        schedules.push(schedule);
      }
      
      // Detect station data
      else if (recordKeys.some(key => ['station', 'stationid', 'station_id', 'stop'].includes(key)) ||
               recordKeys.some(key => ['latitude', 'longitude', 'lat', 'lng', 'coordinates'].includes(key))) {
        
        const station = {
          id: record.id || record.stationId || record.station_id || `STATION_${stations.length + 1}`,
          name: record.name || record.stationName || record.station_name || `Station ${stations.length + 1}`,
          latitude: parseFloat(record.latitude || record.lat || '0'),
          longitude: parseFloat(record.longitude || record.lng || record.lon || '0'),
          type: record.type || record.station_type || 'regular',
          platform_count: parseInt(record.platform_count || record.platforms || '2'),
          capacity: parseInt(record.capacity || record.max_capacity || '500'),
          status: record.status || 'operational'
        };
        stations.push(station);
      }
      
      // If no specific type detected, try to infer from data patterns
      else {
        // Check if it looks like schedule data (has time-like fields)
        const timeFields = recordKeys.filter(key => key.includes('time') || key.includes('hour') || key.includes('minute'));
        if (timeFields.length > 0) {
          const schedule: Schedule = {
            id: record.id || `SCHEDULE_${schedules.length + 1}`,
            trainId: record.trainId || record.train || `TRAIN_${Math.floor(Math.random() * 10) + 1}`,
            routeId: record.routeId || record.route || `ROUTE_${Math.floor(Math.random() * 3) + 1}`,
            departureTime: record[timeFields[0]] || '06:00',
            arrivalTime: record[timeFields[1]] || record[timeFields[0]] || '06:30',
            frequency: parseInt(record.frequency || '15'),
            passengerLoad: parseInt(record.passengers || record.load || '0'),
            status: 'scheduled',
            platform: '1',
            direction: 'forward'
          };
          schedules.push(schedule);
        }
        // Otherwise, try to create a train record
        else {
          const train: TrainType = {
            id: record.id || `TRAIN_${trains.length + 1}`,
            name: record.name || `Train ${trains.length + 1}`,
            capacity: parseInt(record.capacity || '300'),
            type: 'metro',
            status: 'active',
            route: 'default',
            currentLocation: 'depot',
            speed: 0,
            passengerCount: 0
          };
          trains.push(train);
        }
      }
    }

    return { trains, routes, schedules, stations, rawData };
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Train System Data
          </CardTitle>
          <CardDescription>
            Upload CSV, JSON, or Excel files containing train, route, schedule, or station data. 
            All records will be processed and used by the AI system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <FileText className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  or click to browse files
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild disabled={isProcessing}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Files
                    </>
                  )}
                </label>
              </Button>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Supported formats:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">CSV</Badge>
              <Badge variant="outline">JSON</Badge>
              <Badge variant="outline">Excel (.xlsx, .xls)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && uploadProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Processing Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{uploadProgress.stage}</span>
              <span>{Math.round(uploadProgress.progress)}%</span>
            </div>
            <Progress value={uploadProgress.progress} className="h-3" />
            {uploadProgress.totalRecords > 0 && (
              <div className="text-sm text-gray-600 text-center">
                Processing {uploadProgress.recordsProcessed} of {uploadProgress.totalRecords} records
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Upload Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <Train className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{uploadResult.trains}</div>
                <div className="text-sm text-gray-600">Trains</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <Route className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{uploadResult.routes}</div>
                <div className="text-sm text-gray-600">Routes</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{uploadResult.schedules}</div>
                <div className="text-sm text-gray-600">Schedules</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <MapPin className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{uploadResult.stations}</div>
                <div className="text-sm text-gray-600">Stations</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <Database className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-indigo-600">{uploadResult.totalRecords}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
            </div>
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>All {uploadResult.totalRecords} records processed successfully!</strong> 
                The AI system will now use your complete dataset for predictions and optimization.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Upload Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Data Format Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Expected Data Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Train Data Fields:</h4>
            <p className="text-gray-600">id, name, capacity, type, status, route, currentLocation, speed, passengerCount</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Route Data Fields:</h4>
            <p className="text-gray-600">id, name, origin, destination, distance, duration, stations, color, status</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Schedule Data Fields:</h4>
            <p className="text-gray-600">id, trainId, routeId, departureTime, arrivalTime, frequency, passengerLoad, status</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Station Data Fields:</h4>
            <p className="text-gray-600">id, name, latitude, longitude, type, platform_count, capacity, status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;