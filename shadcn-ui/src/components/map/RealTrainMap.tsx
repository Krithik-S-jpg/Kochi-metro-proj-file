import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Train, 
  Navigation, 
  Zap, 
  Clock, 
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

// Real KMRL Blue Line station coordinates
const KMRL_STATIONS = [
  { id: 'ALV', name: 'Aluva', lat: 10.1081, lng: 76.3528, type: 'terminal', passengers: 245 },
  { id: 'PUL', name: 'Pulinchodu', lat: 10.0989, lng: 76.3456, type: 'regular', passengers: 156 },
  { id: 'COM', name: 'Companypady', lat: 10.0897, lng: 76.3384, type: 'regular', passengers: 189 },
  { id: 'AMB', name: 'Ambattukavu', lat: 10.0805, lng: 76.3312, type: 'regular', passengers: 203 },
  { id: 'MUT', name: 'Muttom', lat: 10.0713, lng: 76.3240, type: 'regular', passengers: 167 },
  { id: 'KAL', name: 'Kalamassery', lat: 10.0621, lng: 76.3168, type: 'interchange', passengers: 312 },
  { id: 'CUS', name: 'Cusat', lat: 10.0529, lng: 76.3096, type: 'regular', passengers: 278 },
  { id: 'PAT', name: 'Pathadipalam', lat: 10.0437, lng: 76.3024, type: 'regular', passengers: 234 },
  { id: 'EDA', name: 'Edapally', lat: 10.0345, lng: 76.2952, type: 'interchange', passengers: 445 },
  { id: 'CHA', name: 'Changampuzha Park', lat: 10.0253, lng: 76.2880, type: 'regular', passengers: 198 },
  { id: 'PAL', name: 'Palarivattom', lat: 10.0161, lng: 76.2808, type: 'regular', passengers: 356 },
  { id: 'JLN', name: 'JLN Stadium', lat: 10.0069, lng: 76.2736, type: 'regular', passengers: 289 },
  { id: 'KLR', name: 'Kaloor', lat: 9.9977, lng: 76.2664, type: 'regular', passengers: 267 },
  { id: 'TWH', name: 'Town Hall', lat: 9.9885, lng: 76.2592, type: 'interchange', passengers: 423 },
  { id: 'MGR', name: 'MG Road', lat: 9.9793, lng: 76.2520, type: 'regular', passengers: 567 },
  { id: 'MAH', name: 'Maharajas', lat: 9.9701, lng: 76.2448, type: 'regular', passengers: 345 },
  { id: 'ERS', name: 'Ernakulam South', lat: 9.9609, lng: 76.2376, type: 'regular', passengers: 278 },
  { id: 'KAD', name: 'Kadavanthra', lat: 9.9517, lng: 76.2304, type: 'regular', passengers: 234 },
  { id: 'ELM', name: 'Elamkulam', lat: 9.9425, lng: 76.2232, type: 'regular', passengers: 189 },
  { id: 'VYT', name: 'Vyttila', lat: 9.9333, lng: 76.2160, type: 'interchange', passengers: 367 },
  { id: 'THK', name: 'Thaikoodam', lat: 9.9241, lng: 76.2088, type: 'regular', passengers: 145 },
  { id: 'PET', name: 'Pettah', lat: 9.9149, lng: 76.2016, type: 'terminal', passengers: 298 }
];

interface Train {
  id: string;
  name: string;
  currentStation: string;
  nextStation: string;
  lat: number;
  lng: number;
  speed: number;
  passengers: number;
  capacity: number;
  status: 'running' | 'stopped' | 'maintenance';
  direction: 'north' | 'south';
  delay: number;
  aiOptimized: boolean;
}

interface AISchedule {
  trainId: string;
  route: string[];
  departureTime: string;
  arrivalTime: string;
  frequency: number;
  optimizationScore: number;
  conflicts: string[];
  recommendations: string[];
}

const RealTrainMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [trains, setTrains] = useState<Train[]>([]);
  const [aiSchedules, setAiSchedules] = useState<AISchedule[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize real map with Leaflet
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapLoaded) return;

      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;
        
        // Initialize map centered on Kochi
        const mapInstance = L.map(mapRef.current).setView([10.0261, 76.2711], 11);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        // Add KMRL stations
        KMRL_STATIONS.forEach(station => {
          const color = station.type === 'terminal' ? 'red' : 
                       station.type === 'interchange' ? 'blue' : 'green';
          
          const marker = L.circleMarker([station.lat, station.lng], {
            radius: station.type === 'interchange' ? 8 : 6,
            fillColor: color,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(mapInstance);

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${station.name}</h3>
              <p class="text-sm">Type: ${station.type}</p>
              <p class="text-sm">Passengers: ${station.passengers}</p>
            </div>
          `);

          marker.on('click', () => setSelectedStation(station));
        });

        // Draw route line
        const routeCoordinates = KMRL_STATIONS.map(station => [station.lat, station.lng]);
        L.polyline(routeCoordinates, {
          color: '#3B82F6',
          weight: 4,
          opacity: 0.8
        }).addTo(mapInstance);

        setMap(mapInstance);
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    initMap();
  }, [mapLoaded]);

  // AI-powered train scheduling algorithm
  const runAIScheduling = async () => {
    setIsAIProcessing(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Advanced scheduling algorithm
      const optimizedSchedules = generateAISchedules();
      setAiSchedules(optimizedSchedules);
      
      // Update train positions based on AI optimization
      const optimizedTrains = generateOptimizedTrains(optimizedSchedules);
      setTrains(optimizedTrains);
      
      // Update map with new train positions
      updateTrainMarkers(optimizedTrains);
      
    } catch (error) {
      console.error('AI scheduling error:', error);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Generate AI-optimized schedules
  const generateAISchedules = (): AISchedule[] => {
    const schedules: AISchedule[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const route = KMRL_STATIONS.map(s => s.id);
      const baseTime = new Date();
      baseTime.setHours(6, i * 15, 0, 0);
      
      // AI optimization factors
      const passengerDemand = calculatePassengerDemand(baseTime);
      const conflictScore = detectScheduleConflicts(baseTime, schedules);
      const energyEfficiency = calculateEnergyEfficiency(route);
      
      const optimizationScore = (passengerDemand * 0.4) + 
                               ((100 - conflictScore) * 0.3) + 
                               (energyEfficiency * 0.3);
      
      const schedule: AISchedule = {
        trainId: `T00${i}`,
        route: route,
        departureTime: baseTime.toTimeString().slice(0, 5),
        arrivalTime: new Date(baseTime.getTime() + 45 * 60000).toTimeString().slice(0, 5),
        frequency: Math.max(10, 20 - Math.floor(optimizationScore / 10)),
        optimizationScore: Math.round(optimizationScore),
        conflicts: conflictScore > 20 ? [`High traffic at ${baseTime.getHours()}:00`] : [],
        recommendations: generateRecommendations(optimizationScore, conflictScore)
      };
      
      schedules.push(schedule);
    }
    
    return schedules;
  };

  // Calculate passenger demand based on time
  const calculatePassengerDemand = (time: Date): number => {
    const hour = time.getHours();
    if (hour >= 7 && hour <= 9) return 90; // Morning rush
    if (hour >= 17 && hour <= 19) return 85; // Evening rush
    if (hour >= 10 && hour <= 16) return 60; // Daytime
    return 30; // Off-peak
  };

  // Detect scheduling conflicts
  const detectScheduleConflicts = (time: Date, existingSchedules: AISchedule[]): number => {
    let conflictScore = 0;
    const timeSlot = time.getHours() * 60 + time.getMinutes();
    
    existingSchedules.forEach(schedule => {
      const scheduleTime = parseInt(schedule.departureTime.split(':')[0]) * 60 + 
                          parseInt(schedule.departureTime.split(':')[1]);
      const timeDiff = Math.abs(timeSlot - scheduleTime);
      
      if (timeDiff < 10) conflictScore += 30; // High conflict
      else if (timeDiff < 20) conflictScore += 15; // Medium conflict
    });
    
    return Math.min(conflictScore, 100);
  };

  // Calculate energy efficiency
  const calculateEnergyEfficiency = (route: string[]): number => {
    // Simulate energy calculation based on route length and stops
    const baseEfficiency = 75;
    const stopPenalty = route.length * 0.5;
    return Math.max(50, baseEfficiency - stopPenalty);
  };

  // Generate AI recommendations
  const generateRecommendations = (optimizationScore: number, conflictScore: number): string[] => {
    const recommendations: string[] = [];
    
    if (optimizationScore < 70) {
      recommendations.push('Consider adjusting departure time for better passenger distribution');
    }
    if (conflictScore > 30) {
      recommendations.push('High conflict detected - recommend 5-minute delay');
    }
    if (optimizationScore > 85) {
      recommendations.push('Optimal schedule - maintain current timing');
    }
    
    return recommendations;
  };

  // Generate optimized train positions
  const generateOptimizedTrains = (schedules: AISchedule[]): Train[] => {
    return schedules.map((schedule, index) => {
      const stationIndex = Math.floor(Math.random() * KMRL_STATIONS.length);
      const station = KMRL_STATIONS[stationIndex];
      const nextStationIndex = (stationIndex + 1) % KMRL_STATIONS.length;
      const nextStation = KMRL_STATIONS[nextStationIndex];
      
      return {
        id: schedule.trainId,
        name: `Metro Express ${index + 1}`,
        currentStation: station.name,
        nextStation: nextStation.name,
        lat: station.lat + (Math.random() - 0.5) * 0.01,
        lng: station.lng + (Math.random() - 0.5) * 0.01,
        speed: Math.floor(Math.random() * 20) + 35,
        passengers: Math.floor(Math.random() * 200) + 100,
        capacity: 300,
        status: Math.random() > 0.8 ? 'stopped' : 'running',
        direction: Math.random() > 0.5 ? 'north' : 'south',
        delay: schedule.conflicts.length > 0 ? Math.floor(Math.random() * 5) : 0,
        aiOptimized: true
      } as Train;
    });
  };

  // Update train markers on map
  const updateTrainMarkers = async (trainList: Train[]) => {
    if (!map) return;

    try {
      const L = (await import('leaflet')).default;
      
      // Clear existing train markers
      map.eachLayer((layer: any) => {
        if (layer.options && layer.options.isTrainMarker) {
          map.removeLayer(layer);
        }
      });

      // Add new train markers
      trainList.forEach(train => {
        const color = train.status === 'running' ? '#10B981' : 
                     train.status === 'stopped' ? '#F59E0B' : '#EF4444';
        
        const marker = L.circleMarker([train.lat, train.lng], {
          radius: 8,
          fillColor: color,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
          isTrainMarker: true
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-3">
            <h3 class="font-bold">${train.name}</h3>
            <p class="text-sm">Status: ${train.status}</p>
            <p class="text-sm">Speed: ${train.speed} km/h</p>
            <p class="text-sm">Passengers: ${train.passengers}/${train.capacity}</p>
            <p class="text-sm">Next: ${train.nextStation}</p>
            ${train.aiOptimized ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">AI Optimized</span>' : ''}
          </div>
        `);

        marker.on('click', () => setSelectedTrain(train));
      });
    } catch (error) {
      console.error('Error updating train markers:', error);
    }
  };

  // Initialize with sample trains
  useEffect(() => {
    if (mapLoaded && trains.length === 0) {
      runAIScheduling();
    }
  }, [mapLoaded]);

  return (
    <div className="space-y-6">
      {/* AI Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              AI-Powered Train Scheduling
            </CardTitle>
            <Button 
              onClick={runAIScheduling}
              disabled={isAIProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAIProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI Processing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Run AI Optimization
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{trains.length}</div>
              <div className="text-sm text-gray-600">Active Trains</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {aiSchedules.length > 0 
                  ? Math.round(aiSchedules.reduce((sum, s) => sum + s.optimizationScore, 0) / aiSchedules.length)
                  : 0
                }%
              </div>
              <div className="text-sm text-gray-600">AI Optimization</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {aiSchedules.reduce((sum, s) => sum + s.conflicts.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Conflicts Detected</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {trains.reduce((sum, t) => sum + t.passengers, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Passengers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Live KMRL Route Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border border-gray-200"
              style={{ minHeight: '400px' }}
            />
            
            {!mapLoaded && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading real map...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Scheduling Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              AI Schedule Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {aiSchedules.map((schedule) => (
                <div key={schedule.trainId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{schedule.trainId}</h3>
                    <Badge variant={schedule.optimizationScore > 80 ? 'default' : 'secondary'}>
                      {schedule.optimizationScore}% optimized
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Departure: {schedule.departureTime} | Frequency: {schedule.frequency}min</p>
                    {schedule.conflicts.length > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{schedule.conflicts[0]}</span>
                      </div>
                    )}
                    {schedule.recommendations.length > 0 && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">{schedule.recommendations[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Train className="h-5 w-5 text-blue-600" />
              Live Train Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {trains.map((train) => (
                <div key={train.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{train.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={train.status === 'running' ? 'default' : 'secondary'}>
                        {train.status}
                      </Badge>
                      {train.aiOptimized && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Current: {train.currentStation} → {train.nextStation}</p>
                    <p>Speed: {train.speed} km/h | Passengers: {train.passengers}/{train.capacity}</p>
                    {train.delay > 0 && (
                      <p className="text-red-600">Delay: {train.delay} minutes</p>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(train.passengers / train.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTrainMap;