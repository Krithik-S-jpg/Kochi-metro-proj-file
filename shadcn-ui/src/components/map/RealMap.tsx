import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayersControl } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Train, 
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Navigation,
  Map,
  Satellite,
  Layers,
  Database
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Train as TrainType, Route as RouteType } from '@/types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RealMapProps {
  uploadedStations?: any[];
  uploadedRoutes?: RouteType[];
  uploadedTrains?: TrainType[];
}

// Real KMRL station coordinates based on actual locations
interface KMRLStation {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  type: 'terminal' | 'interchange' | 'regular';
  status: 'operational' | 'maintenance' | 'closed';
  realTimeData: {
    passengerCount: number;
    waitingTime: number;
    lastTrainArrival: string;
    nextTrainETA: string;
    crowdLevel: 'low' | 'medium' | 'high';
  };
}

interface LiveTrain {
  id: string;
  name: string;
  coordinates: [number, number];
  direction: 'aluva_to_maharajas' | 'maharajas_to_aluva';
  speed: number; // km/h
  passengerLoad: number;
  capacity: number;
  nextStation: string;
  status: 'running' | 'stopped' | 'delayed' | 'maintenance';
  aiOptimized: boolean;
}

// Real KMRL Blue Line stations with accurate coordinates
const kmrlStations: KMRLStation[] = [
  {
    id: 'ALV',
    name: 'Aluva',
    coordinates: [10.1102, 76.3534],
    type: 'terminal',
    status: 'operational',
    realTimeData: {
      passengerCount: 245,
      waitingTime: 3,
      lastTrainArrival: '14:23',
      nextTrainETA: '14:38',
      crowdLevel: 'medium'
    }
  },
  {
    id: 'PUL',
    name: 'Pulinchodu',
    coordinates: [10.1089, 76.3456],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 89,
      waitingTime: 2,
      lastTrainArrival: '14:25',
      nextTrainETA: '14:40',
      crowdLevel: 'low'
    }
  },
  {
    id: 'COM',
    name: 'Companypady',
    coordinates: [10.1045, 76.3378],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 156,
      waitingTime: 4,
      lastTrainArrival: '14:27',
      nextTrainETA: '14:42',
      crowdLevel: 'medium'
    }
  },
  {
    id: 'AMB',
    name: 'Ambattukavu',
    coordinates: [10.0998, 76.3289],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 203,
      waitingTime: 3,
      lastTrainArrival: '14:29',
      nextTrainETA: '14:44',
      crowdLevel: 'medium'
    }
  },
  {
    id: 'MUT',
    name: 'Muttom',
    coordinates: [10.0934, 76.3167],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 134,
      waitingTime: 2,
      lastTrainArrival: '14:31',
      nextTrainETA: '14:46',
      crowdLevel: 'low'
    }
  },
  {
    id: 'KAL',
    name: 'Kalamassery',
    coordinates: [10.0856, 76.3067],
    type: 'interchange',
    status: 'operational',
    realTimeData: {
      passengerCount: 387,
      waitingTime: 1,
      lastTrainArrival: '14:33',
      nextTrainETA: '14:48',
      crowdLevel: 'high'
    }
  },
  {
    id: 'CUS',
    name: 'CUSAT',
    coordinates: [10.0445, 76.2889],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 298,
      waitingTime: 3,
      lastTrainArrival: '14:35',
      nextTrainETA: '14:50',
      crowdLevel: 'high'
    }
  },
  {
    id: 'PAT',
    name: 'Pathadipalam',
    coordinates: [10.0356, 76.2823],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 167,
      waitingTime: 2,
      lastTrainArrival: '14:37',
      nextTrainETA: '14:52',
      crowdLevel: 'medium'
    }
  },
  {
    id: 'EDA',
    name: 'Edapally',
    coordinates: [10.0258, 76.3078],
    type: 'interchange',
    status: 'operational',
    realTimeData: {
      passengerCount: 445,
      waitingTime: 2,
      lastTrainArrival: '14:39',
      nextTrainETA: '14:54',
      crowdLevel: 'high'
    }
  },
  {
    id: 'CHA',
    name: 'Changampuzha Park',
    coordinates: [10.0178, 76.3134],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 189,
      waitingTime: 3,
      lastTrainArrival: '14:41',
      nextTrainETA: '14:56',
      crowdLevel: 'medium'
    }
  },
  {
    id: 'PAL',
    name: 'Palarivattom',
    coordinates: [10.0067, 76.3156],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 234,
      waitingTime: 2,
      lastTrainArrival: '14:43',
      nextTrainETA: '14:58',
      crowdLevel: 'medium'
    }
  },
  {
    id: 'JLN',
    name: 'JLN Stadium',
    coordinates: [9.9978, 76.3189],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 312,
      waitingTime: 4,
      lastTrainArrival: '14:45',
      nextTrainETA: '15:00',
      crowdLevel: 'high'
    }
  },
  {
    id: 'KAL2',
    name: 'Kaloor',
    coordinates: [9.9889, 76.3223],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 278,
      waitingTime: 3,
      lastTrainArrival: '14:47',
      nextTrainETA: '15:02',
      crowdLevel: 'high'
    }
  },
  {
    id: 'TOW',
    name: 'Town Hall',
    coordinates: [9.9823, 76.3267],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 356,
      waitingTime: 2,
      lastTrainArrival: '14:49',
      nextTrainETA: '15:04',
      crowdLevel: 'high'
    }
  },
  {
    id: 'MGR',
    name: 'MG Road',
    coordinates: [9.9756, 76.3289],
    type: 'regular',
    status: 'operational',
    realTimeData: {
      passengerCount: 567,
      waitingTime: 1,
      lastTrainArrival: '14:51',
      nextTrainETA: '15:06',
      crowdLevel: 'high'
    }
  },
  {
    id: 'MAH',
    name: 'Maharajas',
    coordinates: [9.9689, 76.3312],
    type: 'terminal',
    status: 'operational',
    realTimeData: {
      passengerCount: 298,
      waitingTime: 3,
      lastTrainArrival: '14:53',
      nextTrainETA: '15:08',
      crowdLevel: 'medium'
    }
  }
];

// Create enhanced custom icons for different station types
const createStationIcon = (type: string, status: string, isUploaded: boolean = false) => {
  let color = '#10b981'; // emerald-500 for regular
  let size = 20;
  let borderWidth = 3;
  
  if (type === 'terminal') {
    color = '#ef4444'; // red-500 for terminals
    size = 24;
    borderWidth = 4;
  }
  if (type === 'interchange') {
    color = '#3b82f6'; // blue-500 for interchanges
    size = 22;
    borderWidth = 4;
  }
  if (status !== 'operational') color = '#6b7280'; // gray-500 for non-operational
  
  // Different styling for uploaded stations
  if (isUploaded) {
    color = '#8b5cf6'; // purple for uploaded stations
    borderWidth = 4;
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: ${borderWidth}px solid white; 
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isUploaded ? 'animation: pulse 2s infinite;' : ''}
      ">
        <div style="
          width: ${size/3}px; 
          height: ${size/3}px; 
          background-color: white; 
          border-radius: 50%;
        "></div>
        ${isUploaded ? '<div style="position: absolute; top: -3px; right: -3px; width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; border: 1px solid white;"></div>' : ''}
      </div>
    `,
    className: 'custom-station-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Create enhanced train icon
const createTrainIcon = (aiOptimized: boolean, status: string, isUploaded: boolean = false) => {
  const baseColor = aiOptimized ? '#8b5cf6' : '#10b981'; // purple for AI optimized, emerald for regular
  const statusColor = status === 'running' ? baseColor : 
                     status === 'stopped' ? '#f59e0b' : 
                     status === 'delayed' ? '#ef4444' : '#6b7280';
  
  // Different styling for uploaded trains
  const finalColor = isUploaded ? '#8b5cf6' : statusColor;
  
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${finalColor}, ${finalColor}dd); 
        width: 24px; 
        height: 24px; 
        border-radius: 6px; 
        border: 3px solid white; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.4); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        position: relative;
        ${isUploaded ? 'animation: pulse 2s infinite;' : ''}
      ">
        <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
          <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
        ${aiOptimized || isUploaded ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; border: 1px solid white;"></div>' : ''}
      </div>
    `,
    className: 'custom-train-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to animate trains along the route
const AnimatedTrains: React.FC<{ trains: LiveTrain[]; uploadedTrains: TrainType[] }> = ({ trains, uploadedTrains }) => {
  const map = useMap();

  useEffect(() => {
    const trainMarkers: L.Marker[] = [];

    // Add live trains
    trains.forEach((train) => {
      const marker = L.marker(train.coordinates, {
        icon: createTrainIcon(train.aiOptimized, train.status, false)
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 220px; font-family: system-ui;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-weight: 600; font-size: 16px;">${train.name}</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 12px;">
            <div><strong>Speed:</strong> ${train.speed} km/h</div>
            <div><strong>Load:</strong> ${train.passengerLoad}%</div>
            <div><strong>Status:</strong> <span style="color: ${train.status === 'running' ? '#10b981' : train.status === 'stopped' ? '#f59e0b' : '#ef4444'}">${train.status}</span></div>
            <div><strong>Next:</strong> ${train.nextStation}</div>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-size: 12px; margin-bottom: 4px;"><strong>Capacity:</strong></div>
            <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
              <div 
                style="height: 100%; background: ${train.passengerLoad > 80 ? '#ef4444' : train.passengerLoad > 60 ? '#f59e0b' : '#10b981'}; width: ${train.passengerLoad}%; transition: width 0.3s;"
              ></div>
            </div>
          </div>
          ${train.aiOptimized ? '<div style="margin-top: 8px; padding: 6px 12px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border-radius: 6px; font-size: 12px; text-align: center; font-weight: 500;">🤖 AI Optimized Route</div>' : ''}
        </div>
      `);

      trainMarkers.push(marker);
    });

    // Add uploaded trains (if they have coordinates)
    uploadedTrains.forEach((train) => {
      // Try to extract coordinates from currentLocation or other fields
      let coordinates: [number, number] | null = null;
      
      if (train.currentLocation && typeof train.currentLocation === 'string') {
        // Try to parse coordinates from currentLocation
        const coordMatch = train.currentLocation.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (coordMatch) {
          coordinates = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
        }
      }
      
      // If no coordinates found, place randomly around KMRL area
      if (!coordinates) {
        coordinates = [
          10.0258 + (Math.random() - 0.5) * 0.2, // Around Edapally
          76.3078 + (Math.random() - 0.5) * 0.2
        ];
      }

      const marker = L.marker(coordinates, {
        icon: createTrainIcon(true, train.status, true)
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 220px; font-family: system-ui;">
          <h3 style="margin: 0 0 12px 0; color: #8b5cf6; font-weight: 600; font-size: 16px;">${train.name} (Uploaded)</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 12px;">
            <div><strong>Capacity:</strong> ${train.capacity}</div>
            <div><strong>Type:</strong> ${train.type}</div>
            <div><strong>Status:</strong> <span style="color: ${train.status === 'active' ? '#10b981' : '#6b7280'}">${train.status}</span></div>
            <div><strong>Route:</strong> ${train.route}</div>
            <div><strong>Location:</strong> ${train.currentLocation}</div>
            <div><strong>Passengers:</strong> ${train.passengerCount || 0}</div>
          </div>
          <div style="margin-top: 8px; padding: 6px 12px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border-radius: 6px; font-size: 12px; text-align: center; font-weight: 500;">📊 From Uploaded Data</div>
        </div>
      `);

      trainMarkers.push(marker);
    });

    return () => {
      trainMarkers.forEach(marker => map.removeLayer(marker));
    };
  }, [trains, uploadedTrains, map]);

  return null;
};

const RealMap: React.FC<RealMapProps> = ({ 
  uploadedStations = [], 
  uploadedRoutes = [], 
  uploadedTrains = [] 
}) => {
  const [selectedStation, setSelectedStation] = useState<KMRLStation | null>(null);
  const [isAIActive, setIsAIActive] = useState(true);
  const [showUploadedData, setShowUploadedData] = useState(true);
  const [liveTrains, setLiveTrains] = useState<LiveTrain[]>([
    {
      id: 'KMRL_001',
      name: 'Metro Blue 1',
      coordinates: [10.0856, 76.3067], // Near Kalamassery
      direction: 'aluva_to_maharajas',
      speed: 45,
      passengerLoad: 78,
      capacity: 300,
      nextStation: 'CUSAT',
      status: 'running',
      aiOptimized: true
    },
    {
      id: 'KMRL_002',
      name: 'Metro Blue 2',
      coordinates: [10.0258, 76.3078], // Near Edapally
      direction: 'maharajas_to_aluva',
      speed: 42,
      passengerLoad: 65,
      capacity: 300,
      nextStation: 'Changampuzha Park',
      status: 'running',
      aiOptimized: true
    },
    {
      id: 'KMRL_003',
      name: 'Metro Blue 3',
      coordinates: [9.9756, 76.3289], // Near MG Road
      direction: 'aluva_to_maharajas',
      speed: 0,
      passengerLoad: 89,
      capacity: 300,
      nextStation: 'Maharajas',
      status: 'stopped',
      aiOptimized: false
    }
  ]);

  // Create route path coordinates (KMRL + uploaded routes)
  const kmrlRouteCoordinates: [number, number][] = kmrlStations.map(station => station.coordinates);
  
  // Process uploaded routes to create route coordinates
  const uploadedRouteCoordinates: { [key: string]: [number, number][] } = {};
  uploadedRoutes.forEach(route => {
    if (route.stations && Array.isArray(route.stations) && route.stations.length > 0) {
      // Try to map station names to coordinates
      const routeCoords: [number, number][] = [];
      route.stations.forEach(stationName => {
        // First try to find in uploaded stations
        const uploadedStation = uploadedStations.find(s => 
          s.name?.toLowerCase() === stationName.toLowerCase()
        );
        if (uploadedStation && uploadedStation.latitude && uploadedStation.longitude) {
          routeCoords.push([uploadedStation.latitude, uploadedStation.longitude]);
        } else {
          // Fallback: try to find in KMRL stations
          const kmrlStation = kmrlStations.find(s => 
            s.name.toLowerCase().includes(stationName.toLowerCase()) ||
            stationName.toLowerCase().includes(s.name.toLowerCase())
          );
          if (kmrlStation) {
            routeCoords.push(kmrlStation.coordinates);
          }
        }
      });
      if (routeCoords.length > 1) {
        uploadedRouteCoordinates[route.id] = routeCoords;
      }
    }
  });

  // Real-time train movement simulation
  useEffect(() => {
    if (!isAIActive) return;

    const interval = setInterval(() => {
      setLiveTrains(prevTrains => 
        prevTrains.map(train => {
          if (train.status !== 'running') return train;

          // Find current station index
          const currentStationIndex = kmrlStations.findIndex(station => 
            Math.abs(station.coordinates[0] - train.coordinates[0]) < 0.01 &&
            Math.abs(station.coordinates[1] - train.coordinates[1]) < 0.01
          );

          let nextStationIndex;
          if (train.direction === 'aluva_to_maharajas') {
            nextStationIndex = currentStationIndex >= 0 ? currentStationIndex + 1 : 0;
            if (nextStationIndex >= kmrlStations.length) nextStationIndex = 0;
          } else {
            nextStationIndex = currentStationIndex >= 0 ? currentStationIndex - 1 : kmrlStations.length - 1;
            if (nextStationIndex < 0) nextStationIndex = kmrlStations.length - 1;
          }

          const targetStation = kmrlStations[nextStationIndex];
          const currentLat = train.coordinates[0];
          const currentLng = train.coordinates[1];
          const targetLat = targetStation.coordinates[0];
          const targetLng = targetStation.coordinates[1];

          // Move train towards target station
          const speed = 0.0005; // Adjust movement speed
          const latDiff = targetLat - currentLat;
          const lngDiff = targetLng - currentLng;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          if (distance < 0.001) {
            // Reached station, move to next
            return {
              ...train,
              coordinates: targetStation.coordinates,
              nextStation: kmrlStations[(nextStationIndex + (train.direction === 'aluva_to_maharajas' ? 1 : -1) + kmrlStations.length) % kmrlStations.length].name,
              aiOptimized: true
            };
          }

          const newLat = currentLat + (latDiff / distance) * speed;
          const newLng = currentLng + (lngDiff / distance) * speed;

          return {
            ...train,
            coordinates: [newLat, newLng] as [number, number],
            speed: Math.max(35, Math.min(55, train.speed + (Math.random() - 0.5) * 3))
          };
        })
      );
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isAIActive]);

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Overview */}
      {(uploadedStations.length > 0 || uploadedRoutes.length > 0 || uploadedTrains.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Uploaded Data Integration
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadedData(!showUploadedData)}
                >
                  {showUploadedData ? 'Hide' : 'Show'} Uploaded Data
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{uploadedStations.length}</div>
                <div className="text-sm text-gray-600">Uploaded Stations</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{uploadedRoutes.length}</div>
                <div className="text-sm text-gray-600">Uploaded Routes</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{uploadedTrains.length}</div>
                <div className="text-sm text-gray-600">Uploaded Trains</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              KMRL Blue Line - Live Map with Uploaded Data
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isAIActive ? "default" : "secondary"} className="bg-blue-600">
                {isAIActive ? "Live Tracking" : "Paused"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAIActive(!isAIActive)}
              >
                {isAIActive ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Interactive Map - Fixed z-index to be below sidebar */}
      <Card>
        <CardContent className="p-0">
          <div 
            style={{ 
              height: '700px', 
              width: '100%',
              position: 'relative',
              zIndex: 1 // Lower z-index than sidebar
            }}
          >
            <MapContainer
              center={[10.0258, 76.3078]} // Center on Edapally
              zoom={11}
              style={{ 
                height: '100%', 
                width: '100%',
                zIndex: 1 // Ensure map stays below sidebar
              }}
              zoomControl={true}
            >
              <LayersControl position="topright">
                {/* Default Street Map */}
                <LayersControl.BaseLayer checked name="Street Map">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                </LayersControl.BaseLayer>

                {/* CartoDB Positron - Clean style */}
                <LayersControl.BaseLayer name="Light Map">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                </LayersControl.BaseLayer>

                {/* CartoDB Dark Matter */}
                <LayersControl.BaseLayer name="Dark Map">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                </LayersControl.BaseLayer>

                {/* Satellite View */}
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  />
                </LayersControl.BaseLayer>

                {/* Terrain Map */}
                <LayersControl.BaseLayer name="Terrain">
                  <TileLayer
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              
              {/* Enhanced KMRL Blue Line Route */}
              <Polyline
                positions={kmrlRouteCoordinates}
                pathOptions={{
                  color: '#1e40af',
                  weight: 8,
                  opacity: 0.9,
                  dashArray: '15, 10',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />

              {/* Route Shadow/Glow Effect */}
              <Polyline
                positions={kmrlRouteCoordinates}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 12,
                  opacity: 0.3,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />

              {/* Uploaded Routes */}
              {showUploadedData && Object.entries(uploadedRouteCoordinates).map(([routeId, coordinates]) => (
                <React.Fragment key={routeId}>
                  <Polyline
                    positions={coordinates}
                    pathOptions={{
                      color: '#8b5cf6',
                      weight: 6,
                      opacity: 0.8,
                      dashArray: '10, 5',
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                  <Polyline
                    positions={coordinates}
                    pathOptions={{
                      color: '#a855f7',
                      weight: 10,
                      opacity: 0.2,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                </React.Fragment>
              ))}

              {/* KMRL Station Markers */}
              {kmrlStations.map((station) => (
                <Marker
                  key={station.id}
                  position={station.coordinates}
                  icon={createStationIcon(station.type, station.status, false)}
                  eventHandlers={{
                    click: () => setSelectedStation(station)
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '280px', fontFamily: 'system-ui' }}>
                      <h3 style={{ margin: '0 0 12px 0', color: '#1f2937', fontWeight: '600', fontSize: '18px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                        {station.name}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
                        <div><strong>Type:</strong> <span style={{ textTransform: 'capitalize', color: station.type === 'terminal' ? '#ef4444' : station.type === 'interchange' ? '#3b82f6' : '#10b981' }}>{station.type}</span></div>
                        <div><strong>Status:</strong> <span style={{ color: station.status === 'operational' ? '#10b981' : '#6b7280' }}>{station.status}</span></div>
                        <div><strong>Passengers:</strong> <span style={{ fontWeight: '600' }}>{station.realTimeData.passengerCount}</span></div>
                        <div><strong>Wait Time:</strong> <span style={{ color: station.realTimeData.waitingTime <= 2 ? '#10b981' : station.realTimeData.waitingTime <= 4 ? '#f59e0b' : '#ef4444' }}>{station.realTimeData.waitingTime}min</span></div>
                        <div><strong>Last Arrival:</strong> {station.realTimeData.lastTrainArrival}</div>
                        <div><strong>Next ETA:</strong> <span style={{ color: '#10b981', fontWeight: '600' }}>{station.realTimeData.nextTrainETA}</span></div>
                      </div>
                      <div style={{ 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        fontSize: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: station.realTimeData.crowdLevel === 'high' ? '#dc2626' : 
                               station.realTimeData.crowdLevel === 'medium' ? '#d97706' : '#16a34a',
                        backgroundColor: station.realTimeData.crowdLevel === 'high' ? '#fef2f2' : 
                                        station.realTimeData.crowdLevel === 'medium' ? '#fefbf2' : '#f0fdf4',
                        border: `1px solid ${station.realTimeData.crowdLevel === 'high' ? '#fecaca' : 
                                             station.realTimeData.crowdLevel === 'medium' ? '#fed7aa' : '#bbf7d0'}`
                      }}>
                        {station.realTimeData.crowdLevel} Crowd Level
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Uploaded Station Markers */}
              {showUploadedData && uploadedStations.map((station, index) => {
                if (!station.latitude || !station.longitude) return null;
                
                return (
                  <Marker
                    key={`uploaded-${station.id || index}`}
                    position={[station.latitude, station.longitude]}
                    icon={createStationIcon(station.type || 'regular', station.status || 'operational', true)}
                  >
                    <Popup>
                      <div style={{ minWidth: '220px', fontFamily: 'system-ui' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#8b5cf6', fontWeight: '600', fontSize: '16px' }}>
                          {station.name} (Uploaded)
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '12px' }}>
                          <div><strong>Type:</strong> {station.type || 'regular'}</div>
                          <div><strong>Status:</strong> {station.status || 'operational'}</div>
                          <div><strong>Capacity:</strong> {station.capacity || 'N/A'}</div>
                          <div><strong>Platforms:</strong> {station.platform_count || 'N/A'}</div>
                        </div>
                        <div style={{ marginTop: '8px', padding: '6px 12px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', borderRadius: '6px', fontSize: '12px', textAlign: 'center', fontWeight: '500' }}>
                          📊 From Uploaded Data
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Animated Trains Component */}
              <AnimatedTrains trains={liveTrains} uploadedTrains={uploadedTrains} />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Live Train Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Train className="h-5 w-5 text-blue-600" />
              Live KMRL Trains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveTrains.map((train) => (
                <div key={train.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{train.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={train.status === 'running' ? 'default' : train.status === 'stopped' ? 'secondary' : 'destructive'}>
                        {train.status}
                      </Badge>
                      {train.aiOptimized && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                          🤖 AI
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-semibold">{train.speed.toFixed(0)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Load:</span>
                      <span className="font-semibold">{train.passengerLoad}%</span>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-gray-600">Direction:</span>
                      <span className="font-semibold text-blue-600">
                        {train.direction.replace('_', ' → ').replace('aluva', 'Aluva').replace('maharajas', 'Maharajas')}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-gray-600">Next Station:</span>
                      <span className="font-semibold text-green-600">{train.nextStation}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Capacity Utilization</span>
                      <span className="font-medium">{train.passengerLoad}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          train.passengerLoad > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                          train.passengerLoad > 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                          'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                        style={{ width: `${train.passengerLoad}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Route Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              KMRL Blue Line Route Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kmrlStations.map((station, index) => (
                <div 
                  key={station.id} 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                    selectedStation?.id === station.id 
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedStation(station)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-gray-900">{station.name}</h4>
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
                      station.type === 'terminal' ? 'bg-red-500' :
                      station.type === 'interchange' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                  </div>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Passengers:</span>
                      <span className="font-semibold">{station.realTimeData.passengerCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wait Time:</span>
                      <span className="font-semibold">{station.realTimeData.waitingTime}min</span>
                    </div>
                    <div className="flex justify-center">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCrowdLevelColor(station.realTimeData.crowdLevel)}`}>
                        {station.realTimeData.crowdLevel}
                      </div>
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

export default RealMap;