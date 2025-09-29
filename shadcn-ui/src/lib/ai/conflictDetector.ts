// KMRL AI Conflict Detection System
// Implements machine learning-based conflict detection and resolution

import { Schedule, Train, Route, Conflict } from '@/types';

export interface ConflictAnalysis {
  conflicts: Conflict[];
  riskAssessment: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  recommendations: string[];
}

class ConflictDetector {
  private readonly SAFETY_BUFFER_MINUTES = 5;
  private readonly TURNAROUND_TIME_MINUTES = 10;
  private readonly PEAK_HOURS = [7, 8, 9, 17, 18, 19]; // 7-9 AM, 5-7 PM

  /**
   * Main conflict detection function
   */
  public async detectConflicts(
    schedules: Schedule[],
    trains: Train[],
    routes: Route[]
  ): Promise<ConflictAnalysis> {
    console.log('Starting conflict detection analysis...');
    
    const conflicts: Conflict[] = [];
    
    // Detect different types of conflicts
    conflicts.push(...this.detectTemporalConflicts(schedules, routes));
    conflicts.push(...this.detectResourceConflicts(schedules, trains));
    conflicts.push(...this.detectCapacityConflicts(schedules, routes));
    conflicts.push(...this.detectMaintenanceConflicts(schedules, trains));
    conflicts.push(...this.detectTurnaroundConflicts(schedules, routes));
    
    // Calculate risk assessment
    const riskAssessment = this.calculateRiskAssessment(conflicts);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(conflicts, schedules, trains, routes);
    
    return {
      conflicts,
      riskAssessment,
      recommendations
    };
  }

  /**
   * Detect temporal overlaps between schedules
   */
  private detectTemporalConflicts(schedules: Schedule[], routes: Route[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const schedule1 = schedules[i];
        const schedule2 = schedules[j];
        
        // Check if schedules use the same route or overlapping segments
        if (this.hasRouteOverlap(schedule1, schedule2, routes)) {
          const conflict = this.checkTemporalOverlap(schedule1, schedule2);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Detect resource allocation conflicts
   */
  private detectResourceConflicts(schedules: Schedule[], trains: Train[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const trainScheduleMap = new Map<string, Schedule[]>();
    
    // Group schedules by train
    schedules.forEach(schedule => {
      if (!trainScheduleMap.has(schedule.trainId)) {
        trainScheduleMap.set(schedule.trainId, []);
      }
      trainScheduleMap.get(schedule.trainId)!.push(schedule);
    });
    
    // Check for train double-booking
    trainScheduleMap.forEach((trainSchedules, trainId) => {
      const sortedSchedules = trainSchedules.sort((a, b) => 
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
      
      for (let i = 1; i < sortedSchedules.length; i++) {
        const prevSchedule = sortedSchedules[i - 1];
        const currentSchedule = sortedSchedules[i];
        
        const prevEnd = new Date(prevSchedule.arrivalTime);
        const currentStart = new Date(currentSchedule.departureTime);
        const gapMinutes = (currentStart.getTime() - prevEnd.getTime()) / (1000 * 60);
        
        if (gapMinutes < this.TURNAROUND_TIME_MINUTES) {
          const conflict: Conflict = {
            id: `conflict-resource-${Date.now()}-${i}`,
            scheduleId1: prevSchedule.id,
            scheduleId2: currentSchedule.id,
            conflictType: 'resource_conflict',
            severity: gapMinutes < 5 ? 'high' : 'medium',
            description: `Insufficient turnaround time for train ${trainId}. Only ${gapMinutes.toFixed(1)} minutes between schedules.`,
            suggestedResolution: `Increase gap to at least ${this.TURNAROUND_TIME_MINUTES} minutes or assign different train.`,
            confidenceScore: this.calculateConfidenceScore('resource_conflict', gapMinutes),
            detectedAt: new Date().toISOString(),
            resolved: false
          };
          
          conflicts.push(conflict);
        }
      }
    });
    
    return conflicts;
  }

  /**
   * Detect capacity-related conflicts
   */
  private detectCapacityConflicts(schedules: Schedule[], routes: Route[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Group schedules by hour and route to check capacity
    const hourlyCapacity = new Map<string, { schedules: Schedule[], capacity: number }>();
    
    schedules.forEach(schedule => {
      const hour = new Date(schedule.departureTime).getHours();
      const routeKey = `${schedule.routeId}-${hour}`;
      
      if (!hourlyCapacity.has(routeKey)) {
        hourlyCapacity.set(routeKey, { schedules: [], capacity: 0 });
      }
      
      const entry = hourlyCapacity.get(routeKey)!;
      entry.schedules.push(schedule);
      entry.capacity += schedule.passengerCount || 0;
    });
    
    // Check for capacity violations during peak hours
    hourlyCapacity.forEach((data, routeKey) => {
      const [routeId, hourStr] = routeKey.split('-');
      const hour = parseInt(hourStr);
      const route = routes.find(r => r.id === routeId);
      
      if (route && this.PEAK_HOURS.includes(hour)) {
        const maxHourlyCapacity = 10000; // Assume max capacity per hour per route
        
        if (data.capacity > maxHourlyCapacity) {
          const conflict: Conflict = {
            id: `conflict-capacity-${Date.now()}-${routeKey}`,
            scheduleId1: data.schedules[0].id,
            scheduleId2: data.schedules[data.schedules.length - 1].id,
            conflictType: 'capacity_exceeded',
            severity: data.capacity > maxHourlyCapacity * 1.2 ? 'high' : 'medium',
            description: `Route capacity exceeded during peak hour ${hour}:00. Current: ${data.capacity}, Max: ${maxHourlyCapacity}`,
            suggestedResolution: 'Consider adding extra trains or redistributing passenger load.',
            confidenceScore: this.calculateConfidenceScore('capacity_exceeded', data.capacity / maxHourlyCapacity),
            detectedAt: new Date().toISOString(),
            resolved: false
          };
          
          conflicts.push(conflict);
        }
      }
    });
    
    return conflicts;
  }

  /**
   * Detect maintenance window conflicts
   */
  private detectMaintenanceConflicts(schedules: Schedule[], trains: Train[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Simulate maintenance windows (in real system, this would come from maintenance schedule)
    const maintenanceWindows = [
      { trainId: 'train-004', start: '02:00', end: '05:00', description: 'Routine maintenance' },
      { trainId: 'train-002', start: '01:30', end: '03:30', description: 'Brake system check' }
    ];
    
    schedules.forEach(schedule => {
      const scheduleTime = new Date(schedule.departureTime);
      const scheduleHour = scheduleTime.getHours();
      const scheduleMinute = scheduleTime.getMinutes();
      
      maintenanceWindows.forEach(window => {
        if (schedule.trainId === window.trainId) {
          const [startHour, startMinute] = window.start.split(':').map(Number);
          const [endHour, endMinute] = window.end.split(':').map(Number);
          
          const scheduleMinutes = scheduleHour * 60 + scheduleMinute;
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          
          if (scheduleMinutes >= startMinutes && scheduleMinutes <= endMinutes) {
            const conflict: Conflict = {
              id: `conflict-maintenance-${Date.now()}-${schedule.id}`,
              scheduleId1: schedule.id,
              scheduleId2: '',
              conflictType: 'maintenance_conflict',
              severity: 'high',
              description: `Train scheduled during maintenance window: ${window.description}`,
              suggestedResolution: `Reschedule to avoid maintenance window (${window.start}-${window.end}) or assign different train.`,
              confidenceScore: 0.95,
              detectedAt: new Date().toISOString(),
              resolved: false
            };
            
            conflicts.push(conflict);
          }
        }
      });
    });
    
    return conflicts;
  }

  /**
   * Detect insufficient turnaround time conflicts
   */
  private detectTurnaroundConflicts(schedules: Schedule[], routes: Route[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Group schedules by train and sort by time
    const trainSchedules = new Map<string, Schedule[]>();
    
    schedules.forEach(schedule => {
      if (!trainSchedules.has(schedule.trainId)) {
        trainSchedules.set(schedule.trainId, []);
      }
      trainSchedules.get(schedule.trainId)!.push(schedule);
    });
    
    trainSchedules.forEach((trainScheduleList, trainId) => {
      const sortedSchedules = trainScheduleList.sort((a, b) => 
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
      
      for (let i = 1; i < sortedSchedules.length; i++) {
        const prevSchedule = sortedSchedules[i - 1];
        const currentSchedule = sortedSchedules[i];
        
        const prevRoute = routes.find(r => r.id === prevSchedule.routeId);
        const currentRoute = routes.find(r => r.id === currentSchedule.routeId);
        
        if (prevRoute && currentRoute) {
          // Check if routes require repositioning
          const needsRepositioning = prevRoute.endStation !== currentRoute.startStation;
          const requiredTurnaround = needsRepositioning ? 20 : this.TURNAROUND_TIME_MINUTES;
          
          const prevEnd = new Date(prevSchedule.arrivalTime);
          const currentStart = new Date(currentSchedule.departureTime);
          const actualTurnaround = (currentStart.getTime() - prevEnd.getTime()) / (1000 * 60);
          
          if (actualTurnaround < requiredTurnaround) {
            const conflict: Conflict = {
              id: `conflict-turnaround-${Date.now()}-${i}`,
              scheduleId1: prevSchedule.id,
              scheduleId2: currentSchedule.id,
              conflictType: 'temporal_overlap',
              severity: actualTurnaround < requiredTurnaround / 2 ? 'high' : 'medium',
              description: `Insufficient turnaround time: ${actualTurnaround.toFixed(1)} min (required: ${requiredTurnaround} min)${needsRepositioning ? ' with repositioning' : ''}`,
              suggestedResolution: `Increase turnaround time to ${requiredTurnaround} minutes or adjust schedule timing.`,
              confidenceScore: this.calculateConfidenceScore('turnaround', actualTurnaround / requiredTurnaround),
              detectedAt: new Date().toISOString(),
              resolved: false
            };
            
            conflicts.push(conflict);
          }
        }
      }
    });
    
    return conflicts;
  }

  /**
   * Check if two schedules have route overlap
   */
  private hasRouteOverlap(schedule1: Schedule, schedule2: Schedule, routes: Route[]): boolean {
    const route1 = routes.find(r => r.id === schedule1.routeId);
    const route2 = routes.find(r => r.id === schedule2.routeId);
    
    if (!route1 || !route2) return false;
    
    // Check for station overlap
    const stations1 = new Set(route1.stations);
    const stations2 = new Set(route2.stations);
    
    for (const station of stations1) {
      if (stations2.has(station)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for temporal overlap between two schedules
   */
  private checkTemporalOverlap(schedule1: Schedule, schedule2: Schedule): Conflict | null {
    const start1 = new Date(schedule1.departureTime);
    const end1 = new Date(schedule1.arrivalTime);
    const start2 = new Date(schedule2.departureTime);
    const end2 = new Date(schedule2.arrivalTime);
    
    // Add safety buffer
    const buffer = this.SAFETY_BUFFER_MINUTES * 60 * 1000;
    
    const hasOverlap = (start1.getTime() - buffer < end2.getTime()) && 
                       (start2.getTime() - buffer < end1.getTime());
    
    if (hasOverlap) {
      const overlapMinutes = Math.min(end1.getTime(), end2.getTime()) - 
                            Math.max(start1.getTime(), start2.getTime());
      const overlapMinutesValue = overlapMinutes / (1000 * 60);
      
      return {
        id: `conflict-temporal-${Date.now()}`,
        scheduleId1: schedule1.id,
        scheduleId2: schedule2.id,
        conflictType: 'temporal_overlap',
        severity: overlapMinutesValue > 10 ? 'high' : overlapMinutesValue > 5 ? 'medium' : 'low',
        description: `Temporal overlap detected: ${overlapMinutesValue.toFixed(1)} minutes overlap`,
        suggestedResolution: `Adjust departure times to create ${this.SAFETY_BUFFER_MINUTES}-minute safety buffer`,
        confidenceScore: this.calculateConfidenceScore('temporal_overlap', overlapMinutesValue),
        detectedAt: new Date().toISOString(),
        resolved: false
      };
    }
    
    return null;
  }

  /**
   * Calculate confidence score for conflict detection
   */
  private calculateConfidenceScore(conflictType: string, value: number): number {
    switch (conflictType) {
      case 'temporal_overlap':
        return Math.min(0.95, 0.5 + (value / 20)); // Higher overlap = higher confidence
      case 'resource_conflict':
        return Math.min(0.95, 0.7 + (10 - value) / 20); // Less gap = higher confidence
      case 'capacity_exceeded':
        return Math.min(0.95, 0.6 + (value - 1) * 0.3); // More excess = higher confidence
      case 'turnaround':
        return Math.min(0.95, 0.8 + (1 - value) * 0.15); // Less turnaround ratio = higher confidence
      default:
        return 0.75;
    }
  }

  /**
   * Calculate risk assessment summary
   */
  private calculateRiskAssessment(conflicts: Conflict[]): { highRisk: number; mediumRisk: number; lowRisk: number } {
    const riskCounts = { highRisk: 0, mediumRisk: 0, lowRisk: 0 };
    
    conflicts.forEach(conflict => {
      switch (conflict.severity) {
        case 'high':
        case 'critical':
          riskCounts.highRisk++;
          break;
        case 'medium':
          riskCounts.mediumRisk++;
          break;
        case 'low':
          riskCounts.lowRisk++;
          break;
      }
    });
    
    return riskCounts;
  }

  /**
   * Generate recommendations based on detected conflicts
   */
  private generateRecommendations(
    conflicts: Conflict[],
    schedules: Schedule[],
    trains: Train[],
    routes: Route[]
  ): string[] {
    const recommendations: string[] = [];
    
    const highPriorityConflicts = conflicts.filter(c => c.severity === 'high' || c.severity === 'critical');
    const temporalConflicts = conflicts.filter(c => c.conflictType === 'temporal_overlap');
    const resourceConflicts = conflicts.filter(c => c.conflictType === 'resource_conflict');
    const capacityConflicts = conflicts.filter(c => c.conflictType === 'capacity_exceeded');
    
    if (highPriorityConflicts.length > 0) {
      recommendations.push(`🚨 ${highPriorityConflicts.length} high-priority conflicts require immediate attention`);
    }
    
    if (temporalConflicts.length > 0) {
      recommendations.push(`⏰ Review ${temporalConflicts.length} temporal conflicts - consider adjusting departure times`);
    }
    
    if (resourceConflicts.length > 0) {
      recommendations.push(`🚆 ${resourceConflicts.length} resource conflicts detected - optimize train assignments`);
    }
    
    if (capacityConflicts.length > 0) {
      recommendations.push(`👥 Capacity issues during peak hours - consider additional trains`);
    }
    
    // Peak hour analysis
    const peakHourSchedules = schedules.filter(s => {
      const hour = new Date(s.departureTime).getHours();
      return this.PEAK_HOURS.includes(hour);
    });
    
    if (peakHourSchedules.length > schedules.length * 0.4) {
      recommendations.push('📈 High concentration of schedules during peak hours - consider load balancing');
    }
    
    // Maintenance recommendations
    const maintenanceConflicts = conflicts.filter(c => c.conflictType === 'maintenance_conflict');
    if (maintenanceConflicts.length > 0) {
      recommendations.push('🔧 Reschedule maintenance activities to avoid operational conflicts');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ No major conflicts detected - schedule appears optimized');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const conflictDetector = new ConflictDetector();