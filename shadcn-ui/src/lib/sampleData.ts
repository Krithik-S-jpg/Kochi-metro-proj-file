// KMRL Sample Dataset - Simulating Real Train Operations Data

import { Train, Route, Schedule, Conflict, KPIMetrics, DashboardData } from '@/types';

// Sample Trains Data
export const sampleTrains: Train[] = [
  {
    id: 'train-001',
    trainNumber: 'KMRL-001',
    capacity: 1200,
    type: 'metro',
    status: 'active',
    specifications: {
      length: 65,
      maxSpeed: 80,
      manufacturer: 'Alstom'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-17T10:30:00Z'
  },
  {
    id: 'train-002',
    trainNumber: 'KMRL-002',
    capacity: 1200,
    type: 'metro',
    status: 'active',
    specifications: {
      length: 65,
      maxSpeed: 80,
      manufacturer: 'Alstom'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-17T10:30:00Z'
  },
  {
    id: 'train-003',
    trainNumber: 'KMRL-003',
    capacity: 1200,
    type: 'metro',
    status: 'active',
    specifications: {
      length: 65,
      maxSpeed: 80,
      manufacturer: 'Alstom'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-17T10:30:00Z'
  },
  {
    id: 'train-004',
    trainNumber: 'KMRL-004',
    capacity: 1200,
    type: 'metro',
    status: 'maintenance',
    specifications: {
      length: 65,
      maxSpeed: 80,
      manufacturer: 'Alstom'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-17T10:30:00Z'
  },
  {
    id: 'train-005',
    trainNumber: 'KMRL-005',
    capacity: 1200,
    type: 'metro',
    status: 'active',
    specifications: {
      length: 65,
      maxSpeed: 80,
      manufacturer: 'Alstom'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-17T10:30:00Z'
  }
];

// Sample Routes Data (Based on actual KMRL Blue Line)
export const sampleRoutes: Route[] = [
  {
    id: 'route-001',
    routeCode: 'BL-01',
    startStation: 'Aluva',
    endStation: 'Maharajas College',
    distanceKm: 25.612,
    estimatedDuration: 45,
    stations: [
      'Aluva', 'Pulinchodu', 'Companypady', 'Ambattukavu', 'Muttom',
      'Kalamassery', 'CUSAT', 'Pathadipalam', 'Edapally', 'Changampuzha Park',
      'Palarivattom', 'JLN Stadium', 'Kaloor', 'Town Hall', 'MG Road',
      'Maharajas College'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'route-002',
    routeCode: 'BL-02',
    startStation: 'Maharajas College',
    endStation: 'Aluva',
    distanceKm: 25.612,
    estimatedDuration: 45,
    stations: [
      'Maharajas College', 'MG Road', 'Town Hall', 'Kaloor', 'JLN Stadium',
      'Palarivattom', 'Changampuzha Park', 'Edapally', 'Pathadipalam',
      'CUSAT', 'Kalamassery', 'Muttom', 'Ambattukavu', 'Companypady',
      'Pulinchodu', 'Aluva'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Generate Sample Schedules for Today
export const generateSampleSchedules = (): Schedule[] => {
  const schedules: Schedule[] = [];
  const today = new Date();
  const routes = sampleRoutes;
  const trains = sampleTrains.filter(t => t.status === 'active');
  
  // Generate schedules from 6 AM to 10 PM (16 hours)
  const startHour = 6;
  const endHour = 22;
  const intervalMinutes = 15; // Every 15 minutes
  
  let scheduleId = 1;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      routes.forEach((route, routeIndex) => {
        const trainIndex = (scheduleId - 1) % trains.length;
        const train = trains[trainIndex];
        
        const departureTime = new Date(today);
        departureTime.setHours(hour, minute, 0, 0);
        
        const arrivalTime = new Date(departureTime);
        arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedDuration);
        
        // Add some random delays (10% chance of delay)
        const hasDelay = Math.random() < 0.1;
        const delayMinutes = hasDelay ? Math.floor(Math.random() * 10) + 1 : 0;
        
        const actualDepartureTime = new Date(departureTime);
        actualDepartureTime.setMinutes(actualDepartureTime.getMinutes() + delayMinutes);
        
        const actualArrivalTime = new Date(arrivalTime);
        actualArrivalTime.setMinutes(actualArrivalTime.getMinutes() + delayMinutes);
        
        // Determine status based on time
        let status: Schedule['status'] = 'scheduled';
        const now = new Date();
        if (actualArrivalTime < now) {
          status = 'completed';
        } else if (actualDepartureTime <= now && actualArrivalTime > now) {
          status = 'active';
        } else if (delayMinutes > 0 && actualDepartureTime > now) {
          status = 'delayed';
        }
        
        schedules.push({
          id: `schedule-${scheduleId.toString().padStart(3, '0')}`,
          trainId: train.id,
          routeId: route.id,
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
          status,
          actualDepartureTime: actualDepartureTime.toISOString(),
          actualArrivalTime: actualArrivalTime.toISOString(),
          delayMinutes,
          passengerCount: Math.floor(Math.random() * train.capacity * 0.8) + Math.floor(train.capacity * 0.2),
          passengerLoad: Math.floor(Math.random() * train.capacity * 0.8) + Math.floor(train.capacity * 0.2),
          frequency: 15,
          createdBy: 'system',
          createdAt: '2024-09-17T06:00:00Z',
          updatedAt: new Date().toISOString()
        });
        
        scheduleId++;
      });
    }
  }
  
  return schedules;
};

// Export generated schedules
export const sampleSchedules = generateSampleSchedules();

// Sample Conflicts
export const sampleConflicts: Conflict[] = [
  {
    id: 'conflict-001',
    scheduleId1: 'schedule-045',
    scheduleId2: 'schedule-046',
    conflictType: 'temporal_overlap',
    severity: 'medium',
    description: 'Two trains scheduled on the same track segment with insufficient gap',
    suggestedResolution: 'Delay second train by 3 minutes to maintain safety margin',
    confidenceScore: 0.87,
    detectedAt: '2024-09-17T08:15:00Z',
    resolved: false
  },
  {
    id: 'conflict-002',
    scheduleId1: 'schedule-078',
    scheduleId2: 'schedule-079',
    conflictType: 'resource_conflict',
    severity: 'high',
    description: 'Train KMRL-004 scheduled during maintenance window',
    suggestedResolution: 'Reassign to available train KMRL-005',
    confidenceScore: 0.95,
    detectedAt: '2024-09-17T09:30:00Z',
    resolved: false
  },
  {
    id: 'conflict-003',
    scheduleId1: 'schedule-123',
    scheduleId2: 'schedule-124',
    conflictType: 'capacity_exceeded',
    severity: 'low',
    description: 'Peak hour capacity may be exceeded at MG Road station',
    suggestedResolution: 'Consider adding extra train during peak hours',
    confidenceScore: 0.72,
    detectedAt: '2024-09-17T10:45:00Z',
    resolved: true,
    resolvedAt: '2024-09-17T11:00:00Z'
  }
];

// Sample KPI Metrics
export const sampleKPIMetrics: KPIMetrics = {
  totalTrains: 5,
  activeSchedules: 128,
  onTimePerformance: 92.5,
  averageDelay: 2.3,
  trainUtilization: 78.6,
  passengerSatisfaction: 88.2,
  energyEfficiency: 85.4,
  conflictsDetected: 3,
  conflictsResolved: 1,
  lastUpdated: new Date().toISOString()
};

// Generate Dashboard Data
export const generateDashboardData = (): DashboardData => {
  const schedules = generateSampleSchedules();
  const recentSchedules = schedules
    .filter(s => s.status === 'active' || s.status === 'scheduled')
    .slice(0, 10);
  
  const activeConflicts = sampleConflicts.filter(c => !c.resolved);
  
  // Generate utilization trends for the last 7 days
  const utilizationTrends = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    
    return {
      date: date.toISOString().split('T')[0],
      utilization: Math.floor(Math.random() * 20) + 70, // 70-90%
      onTimePerformance: Math.floor(Math.random() * 15) + 85 // 85-100%
    };
  });
  
  // Generate train performance data
  const trainPerformance = sampleTrains
    .filter(t => t.status === 'active')
    .map(train => ({
      trainNumber: train.trainNumber,
      efficiency: Math.floor(Math.random() * 20) + 80, // 80-100%
      delayMinutes: Math.floor(Math.random() * 5), // 0-5 minutes
      utilizationRate: Math.floor(Math.random() * 30) + 70 // 70-100%
    }));
  
  return {
    kpis: sampleKPIMetrics,
    recentSchedules,
    activeConflicts,
    utilizationTrends,
    trainPerformance
  };
};

// Export all sample data
export const sampleData = {
  trains: sampleTrains,
  routes: sampleRoutes,
  schedules: sampleSchedules,
  conflicts: sampleConflicts,
  kpis: sampleKPIMetrics,
  dashboard: generateDashboardData()
};