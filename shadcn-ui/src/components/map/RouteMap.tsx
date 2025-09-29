import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Train, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'terminal' | 'interchange' | 'regular';
  status: 'operational' | 'maintenance' | 'closed';
  passengerCount: number;
}

interface TrainPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: 'north' | 'south';
  speed: number;
  passengerLoad: number;
  nextStation: string;
  status: 'running' | 'stopped' | 'delayed';
}

const RouteMap: React.FC = () => {
  const [zoom, setZoom] = useState(1);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<TrainPosition | null>(null);
  const [showTrains, setShowTrains] = useState(true);
  const [showStations, setShowStations] = useState(true);

  // KMRL Blue Line stations (simplified coordinates)
  const stations: Station[] = [
    { id: 'ALV', name: 'Aluva', x: 100, y: 50, type: 'terminal', status: 'operational', passengerCount: 245 },
    { id: 'PUL', name: 'Pulinchodu', x: 120, y: 80, type: 'regular', status: 'operational', passengerCount: 89 },
    { id: 'COM', name: 'Companypady', x: 140, y: 110, type: 'regular', status: 'operational', passengerCount: 156 },
    { id: 'AMB', name: 'Ambattukavu', x: 160, y: 140, type: 'regular', status: 'operational', passengerCount: 203 },
    { id: 'MUT', name: 'Muttom', x: 180, y: 170, type: 'regular', status: 'operational', passengerCount: 178 },
    { id: 'KAL', name: 'Kalamassery', x: 200, y: 200, type: 'interchange', status: 'operational', passengerCount: 412 },
    { id: 'CUS', name: 'Cusat', x: 220, y: 230, type: 'regular', status: 'operational', passengerCount: 134 },
    { id: 'PAT', name: 'Pathadipalam', x: 240, y: 260, type: 'regular', status: 'operational', passengerCount: 267 },
    { id: 'EDA', name: 'Edapally', x: 260, y: 290, type: 'interchange', status: 'operational', passengerCount: 389 },
    { id: 'CHA', name: 'Changampuzha Park', x: 280, y: 320, type: 'regular', status: 'operational', passengerCount: 198 },
    { id: 'PAL', name: 'Palarivattom', x: 300, y: 350, type: 'regular', status: 'operational', passengerCount: 324 },
    { id: 'JLN', name: 'JLN Stadium', x: 320, y: 380, type: 'regular', status: 'operational', passengerCount: 289 },
    { id: 'KLR', name: 'Kaloor', x: 340, y: 410, type: 'regular', status: 'operational', passengerCount: 356 },
    { id: 'TWN', name: 'Town Hall', x: 360, y: 440, type: 'interchange', status: 'operational', passengerCount: 445 },
    { id: 'MGR', name: 'MG Road', x: 380, y: 470, type: 'regular', status: 'operational', passengerCount: 398 },
    { id: 'MAH', name: 'Maharajas', x: 400, y: 500, type: 'regular', status: 'operational', passengerCount: 312 },
    { id: 'ERS', name: 'Ernakulam South', x: 420, y: 530, type: 'regular', status: 'operational', passengerCount: 278 },
    { id: 'KAD', name: 'Kadavanthra', x: 440, y: 560, type: 'regular', status: 'operational', passengerCount: 234 },
    { id: 'ELM', name: 'Elamkulam', x: 460, y: 590, type: 'regular', status: 'operational', passengerCount: 189 },
    { id: 'VYT', name: 'Vyttila', x: 480, y: 620, type: 'interchange', status: 'operational', passengerCount: 367 },
    { id: 'THK', name: 'Thaikoodam', x: 500, y: 650, type: 'regular', status: 'operational', passengerCount: 145 },
    { id: 'PET', name: 'Pettah', x: 520, y: 680, type: 'terminal', status: 'operational', passengerCount: 298 }
  ];

  // Mock train positions
  const [trains, setTrains] = useState<TrainPosition[]>([
    { id: 'T001', name: 'Metro-1', x: 180, y: 170, direction: 'south', speed: 45, passengerLoad: 78, nextStation: 'Kalamassery', status: 'running' },
    { id: 'T002', name: 'Metro-2', x: 340, y: 410, direction: 'north', speed: 42, passengerLoad: 65, nextStation: 'JLN Stadium', status: 'running' },
    { id: 'T003', name: 'Metro-3', x: 460, y: 590, direction: 'south', speed: 0, passengerLoad: 89, nextStation: 'Vyttila', status: 'stopped' },
    { id: 'T004', name: 'Metro-4', x: 260, y: 290, direction: 'north', speed: 38, passengerLoad: 92, nextStation: 'Pathadipalam', status: 'running' },
    { id: 'T005', name: 'Metro-5', x: 120, y: 80, direction: 'south', speed: 41, passengerLoad: 56, nextStation: 'Companypady', status: 'running' }
  ]);

  // Animate trains
  useEffect(() => {
    const interval = setInterval(() => {
      setTrains(prev => prev.map(train => {
        if (train.status === 'running') {
          const speed = 2; // pixels per update
          const newY = train.direction === 'south' ? train.y + speed : train.y - speed;
          
          // Keep trains within bounds
          const boundedY = Math.max(50, Math.min(680, newY));
          
          return { ...train, y: boundedY };
        }
        return train;
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const getStationColor = (station: Station) => {
    switch (station.type) {
      case 'terminal': return 'bg-red-500';
      case 'interchange': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getTrainColor = (train: TrainPosition) => {
    switch (train.status) {
      case 'running': return 'bg-green-600';
      case 'stopped': return 'bg-yellow-600';
      case 'delayed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              KMRL Route Map
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(1)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showStations}
                onChange={(e) => setShowStations(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Stations</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showTrains}
                onChange={(e) => setShowTrains(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Trains</span>
            </label>
          </div>

          {/* Map Container */}
          <div className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <div 
              className="relative w-full h-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              {/* Route Line */}
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1E40AF" />
                  </linearGradient>
                </defs>
                
                {/* Main route line */}
                {stations.map((station, index) => {
                  if (index === stations.length - 1) return null;
                  const nextStation = stations[index + 1];
                  return (
                    <line
                      key={`line-${station.id}`}
                      x1={station.x}
                      y1={station.y}
                      x2={nextStation.x}
                      y2={nextStation.y}
                      stroke="url(#routeGradient)"
                      strokeWidth="4"
                      className="drop-shadow-sm"
                    />
                  );
                })}
              </svg>

              {/* Stations */}
              {showStations && stations.map((station) => (
                <div
                  key={station.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: station.x, top: station.y }}
                  onClick={() => setSelectedStation(station)}
                >
                  <div className={`w-4 h-4 rounded-full ${getStationColor(station)} border-2 border-white shadow-lg hover:scale-110 transition-transform`} />
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md text-xs font-medium whitespace-nowrap">
                    {station.name}
                  </div>
                </div>
              ))}

              {/* Trains */}
              {showTrains && trains.map((train) => (
                <div
                  key={train.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: train.x, top: train.y }}
                  onClick={() => setSelectedTrain(train)}
                >
                  <div className={`w-6 h-6 rounded-lg ${getTrainColor(train)} border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}>
                    <Train className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute top-7 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                    {train.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedStation ? `${selectedStation.name} Station` : 'Station Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Station Type</span>
                  <Badge variant={selectedStation.type === 'terminal' ? 'destructive' : selectedStation.type === 'interchange' ? 'default' : 'secondary'}>
                    {selectedStation.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Passengers</span>
                  <span className="text-sm font-medium">{selectedStation.passengerCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Capacity</span>
                  <span className="text-sm font-medium">500 passengers</span>
                </div>
                <div className="pt-2">
                  <div className="text-sm text-gray-600 mb-2">Platform Utilization</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedStation.passengerCount / 500) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((selectedStation.passengerCount / 500) * 100)}% occupied
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Click on a station to view details
              </p>
            )}
          </CardContent>
        </Card>

        {/* Train Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Train className="h-5 w-5" />
              {selectedTrain ? `${selectedTrain.name} Details` : 'Train Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrain ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={selectedTrain.status === 'running' ? 'default' : selectedTrain.status === 'stopped' ? 'secondary' : 'destructive'}>
                    {selectedTrain.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Speed</span>
                  <span className="text-sm font-medium">{selectedTrain.speed} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Direction</span>
                  <span className="text-sm font-medium capitalize">{selectedTrain.direction}bound</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Station</span>
                  <span className="text-sm font-medium">{selectedTrain.nextStation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Passenger Load</span>
                  <span className="text-sm font-medium">{selectedTrain.passengerLoad}%</span>
                </div>
                <div className="pt-2">
                  <div className="text-sm text-gray-600 mb-2">Capacity Utilization</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        selectedTrain.passengerLoad > 80 ? 'bg-red-500' : 
                        selectedTrain.passengerLoad > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedTrain.passengerLoad}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedTrain.passengerLoad}% capacity
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Click on a train to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span className="text-sm">Terminal Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full" />
              <span className="text-sm">Interchange Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-sm">Regular Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                <Train className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm">Active Train</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteMap;