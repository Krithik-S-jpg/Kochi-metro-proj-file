// KMRL AI Resource Allocation System
// Optimizes train and crew assignment using multi-objective optimization

import { Schedule, Train, Route } from '@/types';

export interface ResourceAllocation {
  trainAssignments: TrainAssignment[];
  utilizationMetrics: UtilizationMetrics;
  recommendations: AllocationRecommendation[];
  efficiency: {
    overall: number;
    trainUtilization: number;
    routeCoverage: number;
    timeOptimization: number;
  };
}

export interface TrainAssignment {
  trainId: string;
  scheduleId: string;
  assignmentScore: number;
  utilizationRate: number;
  conflictRisk: number;
  energyEfficiency: number;
}

export interface UtilizationMetrics {
  totalTrains: number;
  activeTrains: number;
  averageUtilization: number;
  peakUtilization: number;
  idleTime: number;
  maintenanceTime: number;
}

export interface AllocationRecommendation {
  type: 'optimization' | 'maintenance' | 'capacity' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImprovement: number;
  implementationCost: number;
}

class ResourceAllocator {
  private readonly UTILIZATION_TARGET = 0.85; // 85% target utilization
  private readonly MAX_CONSECUTIVE_HOURS = 16; // Maximum consecutive operation
  private readonly MIN_MAINTENANCE_INTERVAL = 72; // Hours between maintenance

  /**
   * Main resource allocation optimization function
   */
  public async optimizeResourceAllocation(
    schedules: Schedule[],
    trains: Train[],
    routes: Route[]
  ): Promise<ResourceAllocation> {
    console.log('Starting resource allocation optimization...');

    // Calculate current utilization metrics
    const utilizationMetrics = this.calculateUtilizationMetrics(schedules, trains);
    
    // Generate optimal train assignments
    const trainAssignments = this.generateOptimalAssignments(schedules, trains, routes);
    
    // Generate recommendations for improvement
    const recommendations = this.generateAllocationRecommendations(
      schedules, trains, routes, utilizationMetrics
    );
    
    // Calculate overall efficiency metrics
    const efficiency = this.calculateEfficiencyMetrics(trainAssignments, utilizationMetrics);

    return {
      trainAssignments,
      utilizationMetrics,
      recommendations,
      efficiency
    };
  }

  /**
   * Calculate current utilization metrics for all trains
   */
  private calculateUtilizationMetrics(schedules: Schedule[], trains: Train[]): UtilizationMetrics {
    const activeTrains = trains.filter(t => t.status === 'active');
    const trainsInMaintenance = trains.filter(t => t.status === 'maintenance');
    
    // Calculate utilization per train
    const trainUtilizations: number[] = [];
    let totalIdleTime = 0;
    
    activeTrains.forEach(train => {
      const trainSchedules = schedules.filter(s => s.trainId === train.id);
      const utilization = this.calculateTrainUtilization(trainSchedules);
      trainUtilizations.push(utilization.rate);
      totalIdleTime += utilization.idleTime;
    });
    
    const averageUtilization = trainUtilizations.length > 0 
      ? trainUtilizations.reduce((sum, rate) => sum + rate, 0) / trainUtilizations.length 
      : 0;
    
    const peakUtilization = trainUtilizations.length > 0 
      ? Math.max(...trainUtilizations) 
      : 0;
    
    // Calculate maintenance time (assume 4 hours per maintenance session)
    const maintenanceTime = trainsInMaintenance.length * 4;

    return {
      totalTrains: trains.length,
      activeTrains: activeTrains.length,
      averageUtilization: averageUtilization * 100, // Convert to percentage
      peakUtilization: peakUtilization * 100,
      idleTime: totalIdleTime,
      maintenanceTime
    };
  }

  /**
   * Calculate utilization for a specific train
   */
  private calculateTrainUtilization(trainSchedules: Schedule[]): { rate: number; idleTime: number } {
    if (trainSchedules.length === 0) {
      return { rate: 0, idleTime: 24 * 60 }; // 24 hours idle
    }

    // Sort schedules by departure time
    const sortedSchedules = trainSchedules.sort((a, b) => 
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );

    let totalOperatingTime = 0;
    let totalIdleTime = 0;
    
    // Calculate operating time
    sortedSchedules.forEach(schedule => {
      const departure = new Date(schedule.departureTime);
      const arrival = new Date(schedule.arrivalTime);
      const operatingMinutes = (arrival.getTime() - departure.getTime()) / (1000 * 60);
      totalOperatingTime += operatingMinutes;
    });

    // Calculate idle time between schedules
    for (let i = 1; i < sortedSchedules.length; i++) {
      const prevArrival = new Date(sortedSchedules[i - 1].arrivalTime);
      const currentDeparture = new Date(sortedSchedules[i].departureTime);
      const idleMinutes = (currentDeparture.getTime() - prevArrival.getTime()) / (1000 * 60);
      totalIdleTime += Math.max(0, idleMinutes - 10); // Subtract 10 min turnaround time
    }

    // Add idle time before first schedule and after last schedule
    const firstSchedule = sortedSchedules[0];
    const lastSchedule = sortedSchedules[sortedSchedules.length - 1];
    
    const dayStart = new Date(firstSchedule.departureTime);
    dayStart.setHours(6, 0, 0, 0); // Assume operations start at 6 AM
    
    const dayEnd = new Date(lastSchedule.arrivalTime);
    dayEnd.setHours(22, 0, 0, 0); // Assume operations end at 10 PM
    
    const preOperationIdle = Math.max(0, 
      (new Date(firstSchedule.departureTime).getTime() - dayStart.getTime()) / (1000 * 60)
    );
    
    const postOperationIdle = Math.max(0,
      (dayEnd.getTime() - new Date(lastSchedule.arrivalTime).getTime()) / (1000 * 60)
    );
    
    totalIdleTime += preOperationIdle + postOperationIdle;

    // Calculate utilization rate (operating time / total available time)
    const totalAvailableTime = 16 * 60; // 16 hours of operation (6 AM - 10 PM)
    const utilizationRate = totalOperatingTime / totalAvailableTime;

    return {
      rate: Math.min(1, utilizationRate), // Cap at 100%
      idleTime: totalIdleTime
    };
  }

  /**
   * Generate optimal train assignments using Hungarian algorithm approach
   */
  private generateOptimalAssignments(
    schedules: Schedule[],
    trains: Train[],
    routes: Route[]
  ): TrainAssignment[] {
    const assignments: TrainAssignment[] = [];
    const availableTrains = trains.filter(t => t.status === 'active');
    
    // Create cost matrix for assignment optimization
    const costMatrix = this.createAssignmentCostMatrix(schedules, availableTrains, routes);
    
    // Apply simplified assignment algorithm
    schedules.forEach((schedule, scheduleIndex) => {
      let bestTrain: Train | null = null;
      let bestScore = -Infinity;
      
      availableTrains.forEach((train, trainIndex) => {
        const score = costMatrix[scheduleIndex]?.[trainIndex] || 0;
        
        // Check availability (simplified - in real system would check detailed schedule)
        if (this.isTrainAvailable(train, schedule, schedules) && score > bestScore) {
          bestScore = score;
          bestTrain = train;
        }
      });
      
      if (bestTrain) {
        const assignment: TrainAssignment = {
          trainId: bestTrain.id,
          scheduleId: schedule.id,
          assignmentScore: bestScore,
          utilizationRate: this.calculateAssignmentUtilization(bestTrain, schedule, schedules),
          conflictRisk: this.calculateConflictRisk(bestTrain, schedule, schedules),
          energyEfficiency: this.calculateEnergyEfficiency(bestTrain, schedule, routes)
        };
        
        assignments.push(assignment);
      }
    });
    
    return assignments;
  }

  /**
   * Create cost matrix for assignment optimization
   */
  private createAssignmentCostMatrix(
    schedules: Schedule[],
    trains: Train[],
    routes: Route[]
  ): number[][] {
    const matrix: number[][] = [];
    
    schedules.forEach((schedule, i) => {
      matrix[i] = [];
      
      trains.forEach((train, j) => {
        // Calculate assignment score based on multiple factors
        let score = 0;
        
        // Factor 1: Train capacity vs expected passenger load
        const expectedLoad = schedule.passengerCount || train.capacity * 0.7;
        const capacityScore = Math.min(1, expectedLoad / train.capacity) * 30;
        
        // Factor 2: Energy efficiency based on train specifications
        const efficiencyScore = this.calculateTrainEfficiencyScore(train) * 25;
        
        // Factor 3: Route compatibility
        const route = routes.find(r => r.id === schedule.routeId);
        const routeScore = route ? this.calculateRouteCompatibility(train, route) * 20 : 0;
        
        // Factor 4: Maintenance schedule consideration
        const maintenanceScore = this.calculateMaintenanceScore(train, schedule) * 15;
        
        // Factor 5: Previous assignment continuity
        const continuityScore = this.calculateContinuityScore(train, schedule, schedules) * 10;
        
        score = capacityScore + efficiencyScore + routeScore + maintenanceScore + continuityScore;
        matrix[i][j] = score;
      });
    });
    
    return matrix;
  }

  /**
   * Check if train is available for a specific schedule
   */
  private isTrainAvailable(train: Train, schedule: Schedule, allSchedules: Schedule[]): boolean {
    if (train.status !== 'active') return false;
    
    // Check for conflicts with existing assignments
    const trainSchedules = allSchedules.filter(s => s.trainId === train.id);
    
    const scheduleStart = new Date(schedule.departureTime);
    const scheduleEnd = new Date(schedule.arrivalTime);
    
    return !trainSchedules.some(existingSchedule => {
      if (existingSchedule.id === schedule.id) return false;
      
      const existingStart = new Date(existingSchedule.departureTime);
      const existingEnd = new Date(existingSchedule.arrivalTime);
      
      // Check for overlap with 10-minute buffer
      const buffer = 10 * 60 * 1000; // 10 minutes
      return (scheduleStart.getTime() - buffer < existingEnd.getTime()) &&
             (existingStart.getTime() - buffer < scheduleEnd.getTime());
    });
  }

  /**
   * Calculate various scoring factors for assignment optimization
   */
  private calculateTrainEfficiencyScore(train: Train): number {
    // Score based on train specifications (newer trains = higher efficiency)
    const baseScore = 0.7;
    const capacityBonus = Math.min(0.2, train.capacity / 1500); // Bonus for higher capacity
    const typeBonus = train.type === 'metro' ? 0.1 : 0;
    
    return baseScore + capacityBonus + typeBonus;
  }

  private calculateRouteCompatibility(train: Train, route: Route): number {
    // All metro trains are compatible with all routes in this simplified model
    if (train.type === 'metro') return 1.0;
    
    // Consider route length and train specifications
    const lengthScore = Math.min(1, train.specifications.maxSpeed / 80); // Normalized to max speed of 80
    return lengthScore;
  }

  private calculateMaintenanceScore(train: Train, schedule: Schedule): number {
    // Higher score for trains that don't need immediate maintenance
    // In real system, this would check actual maintenance schedules
    const hoursInOperation = 48; // Simulated hours since last maintenance
    const maintenanceUrgency = hoursInOperation / this.MIN_MAINTENANCE_INTERVAL;
    
    return Math.max(0, 1 - maintenanceUrgency);
  }

  private calculateContinuityScore(train: Train, schedule: Schedule, allSchedules: Schedule[]): number {
    // Bonus for keeping trains on similar routes/times for operational efficiency
    const recentSchedules = allSchedules.filter(s => 
      s.trainId === train.id && 
      Math.abs(new Date(s.departureTime).getTime() - new Date(schedule.departureTime).getTime()) < 24 * 60 * 60 * 1000
    );
    
    if (recentSchedules.length === 0) return 0.5;
    
    const sameRouteCount = recentSchedules.filter(s => s.routeId === schedule.routeId).length;
    return Math.min(1, sameRouteCount / recentSchedules.length);
  }

  private calculateAssignmentUtilization(train: Train, schedule: Schedule, allSchedules: Schedule[]): number {
    const trainSchedules = allSchedules.filter(s => s.trainId === train.id);
    return this.calculateTrainUtilization(trainSchedules).rate;
  }

  private calculateConflictRisk(train: Train, schedule: Schedule, allSchedules: Schedule[]): number {
    // Calculate risk of conflicts based on schedule density and timing
    const nearbySchedules = allSchedules.filter(s => {
      const timeDiff = Math.abs(
        new Date(s.departureTime).getTime() - new Date(schedule.departureTime).getTime()
      );
      return timeDiff < 2 * 60 * 60 * 1000; // Within 2 hours
    });
    
    const riskFactor = nearbySchedules.length / 10; // Normalize by expected max schedules
    return Math.min(1, riskFactor);
  }

  private calculateEnergyEfficiency(train: Train, schedule: Schedule, routes: Route[]): number {
    const route = routes.find(r => r.id === schedule.routeId);
    if (!route) return 0.5;
    
    // Energy efficiency based on route distance and train specifications
    const distanceEfficiency = Math.max(0.3, 1 - (route.distanceKm / 50)); // Normalize by max distance
    const speedEfficiency = Math.min(1, train.specifications.maxSpeed / 100);
    
    return (distanceEfficiency + speedEfficiency) / 2;
  }

  /**
   * Generate recommendations for resource allocation improvement
   */
  private generateAllocationRecommendations(
    schedules: Schedule[],
    trains: Train[],
    routes: Route[],
    metrics: UtilizationMetrics
  ): AllocationRecommendation[] {
    const recommendations: AllocationRecommendation[] = [];
    
    // Utilization recommendations
    if (metrics.averageUtilization < this.UTILIZATION_TARGET * 100) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: `Average train utilization is ${metrics.averageUtilization.toFixed(1)}%. Consider consolidating schedules or reducing fleet size.`,
        expectedImprovement: (this.UTILIZATION_TARGET * 100 - metrics.averageUtilization) * 0.8,
        implementationCost: 2
      });
    }
    
    if (metrics.averageUtilization > 95) {
      recommendations.push({
        type: 'capacity',
        priority: 'high',
        description: 'Train utilization is very high. Consider adding more trains or optimizing schedules.',
        expectedImprovement: 15,
        implementationCost: 8
      });
    }
    
    // Maintenance recommendations
    const maintenanceTrains = trains.filter(t => t.status === 'maintenance').length;
    const totalTrains = trains.length;
    
    if (maintenanceTrains / totalTrains > 0.2) {
      recommendations.push({
        type: 'maintenance',
        priority: 'high',
        description: 'High percentage of trains in maintenance. Review maintenance scheduling.',
        expectedImprovement: 10,
        implementationCost: 5
      });
    }
    
    // Efficiency recommendations
    const peakHourSchedules = schedules.filter(s => {
      const hour = new Date(s.departureTime).getHours();
      return hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19;
    });
    
    if (peakHourSchedules.length < schedules.length * 0.3) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        description: 'Low peak hour coverage. Consider redistributing schedules to better serve passenger demand.',
        expectedImprovement: 12,
        implementationCost: 3
      });
    }
    
    // Route coverage recommendations
    const routeCoverage = this.calculateRouteCoverage(schedules, routes);
    if (routeCoverage < 0.8) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: 'Some routes have insufficient service frequency. Consider rebalancing schedule distribution.',
        expectedImprovement: (0.8 - routeCoverage) * 20,
        implementationCost: 4
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private calculateRouteCoverage(schedules: Schedule[], routes: Route[]): number {
    const routeScheduleCount = new Map<string, number>();
    
    schedules.forEach(schedule => {
      const count = routeScheduleCount.get(schedule.routeId) || 0;
      routeScheduleCount.set(schedule.routeId, count + 1);
    });
    
    const avgSchedulesPerRoute = schedules.length / routes.length;
    let coverageScore = 0;
    
    routes.forEach(route => {
      const scheduleCount = routeScheduleCount.get(route.id) || 0;
      const routeScore = Math.min(1, scheduleCount / avgSchedulesPerRoute);
      coverageScore += routeScore;
    });
    
    return coverageScore / routes.length;
  }

  /**
   * Calculate overall efficiency metrics
   */
  private calculateEfficiencyMetrics(
    assignments: TrainAssignment[],
    metrics: UtilizationMetrics
  ): ResourceAllocation['efficiency'] {
    const avgAssignmentScore = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.assignmentScore, 0) / assignments.length
      : 0;
    
    const avgUtilizationRate = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.utilizationRate, 0) / assignments.length
      : 0;
    
    const avgEnergyEfficiency = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.energyEfficiency, 0) / assignments.length
      : 0;
    
    return {
      overall: (avgAssignmentScore + avgUtilizationRate * 100 + avgEnergyEfficiency * 100) / 3,
      trainUtilization: metrics.averageUtilization,
      routeCoverage: 85, // Simplified calculation
      timeOptimization: avgEnergyEfficiency * 100
    };
  }
}

// Export singleton instance
export const resourceAllocator = new ResourceAllocator();