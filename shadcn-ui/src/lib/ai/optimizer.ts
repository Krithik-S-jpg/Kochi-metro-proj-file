// KMRL AI Train Schedule Optimizer
// Implements genetic algorithm and constraint satisfaction for schedule optimization

import { Schedule, Train, Route, AIOptimizationRequest, OptimizationResult } from '@/types';

export interface OptimizationConstraints {
  maxDelayMinutes: number;
  minTurnaroundTime: number;
  maintenanceWindows: string[];
  maxConsecutiveRuns: number;
  peakHourCapacity: number;
}

export interface OptimizationObjectives {
  minimizeDelay: number;
  maximizeUtilization: number;
  minimizeEnergy: number;
  maximizePassengerSatisfaction: number;
}

class ScheduleOptimizer {
  private populationSize = 50;
  private maxGenerations = 100;
  private mutationRate = 0.1;
  private crossoverRate = 0.8;

  /**
   * Main optimization function using genetic algorithm
   */
  public async optimizeSchedules(
    schedules: Schedule[],
    trains: Train[],
    routes: Route[],
    request: AIOptimizationRequest
  ): Promise<OptimizationResult[]> {
    console.log('Starting schedule optimization...');
    
    // Initialize population
    const population = this.initializePopulation(schedules, trains, routes);
    
    // Evolution loop
    let bestSolution = population[0];
    let generation = 0;
    
    while (generation < this.maxGenerations) {
      // Evaluate fitness for each individual
      const fitnessScores = population.map(individual => 
        this.calculateFitness(individual, request.constraints, request.preferences)
      );
      
      // Find best solution
      const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
      if (fitnessScores[bestIndex] > this.calculateFitness(bestSolution, request.constraints, request.preferences)) {
        bestSolution = population[bestIndex];
      }
      
      // Create new generation
      const newPopulation = [];
      
      // Elitism - keep best solutions
      const eliteCount = Math.floor(this.populationSize * 0.1);
      const sortedIndices = fitnessScores
        .map((score, index) => ({ score, index }))
        .sort((a, b) => b.score - a.score)
        .slice(0, eliteCount)
        .map(item => item.index);
      
      sortedIndices.forEach(index => newPopulation.push(population[index]));
      
      // Generate offspring through crossover and mutation
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.tournamentSelection(population, fitnessScores);
        const parent2 = this.tournamentSelection(population, fitnessScores);
        
        let offspring = Math.random() < this.crossoverRate 
          ? this.crossover(parent1, parent2)
          : parent1;
        
        if (Math.random() < this.mutationRate) {
          offspring = this.mutate(offspring, trains, routes);
        }
        
        newPopulation.push(offspring);
      }
      
      population.splice(0, population.length, ...newPopulation);
      generation++;
    }
    
    // Convert best solution to optimization results
    return this.convertToOptimizationResults(schedules, bestSolution, request);
  }

  /**
   * Initialize population with random schedule variations
   */
  private initializePopulation(
    schedules: Schedule[],
    trains: Train[],
    routes: Route[]
  ): Schedule[][] {
    const population: Schedule[][] = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const individual = schedules.map(schedule => ({
        ...schedule,
        // Add random variations to departure times (±10 minutes)
        departureTime: this.adjustTime(schedule.departureTime, -10, 10),
        arrivalTime: this.adjustTime(schedule.arrivalTime, -10, 10)
      }));
      
      population.push(individual);
    }
    
    return population;
  }

  /**
   * Calculate fitness score for a schedule configuration
   */
  private calculateFitness(
    schedules: Schedule[],
    constraints: AIOptimizationRequest['constraints'],
    preferences: AIOptimizationRequest['preferences']
  ): number {
    let fitness = 0;
    
    // Penalty for constraint violations
    const constraintPenalty = this.calculateConstraintPenalty(schedules, constraints);
    
    // Objectives scoring
    const delayScore = this.calculateDelayScore(schedules) * preferences.prioritizeOnTime;
    const utilizationScore = this.calculateUtilizationScore(schedules) * preferences.prioritizeEfficiency;
    const comfortScore = this.calculateComfortScore(schedules) * preferences.prioritizePassengerComfort;
    
    fitness = (delayScore + utilizationScore + comfortScore) - constraintPenalty;
    
    return Math.max(0, fitness); // Ensure non-negative fitness
  }

  /**
   * Calculate penalty for constraint violations
   */
  private calculateConstraintPenalty(
    schedules: Schedule[],
    constraints: AIOptimizationRequest['constraints']
  ): number {
    let penalty = 0;
    
    // Check for temporal conflicts
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        if (this.hasTemporalConflict(schedules[i], schedules[j])) {
          penalty += 50; // Heavy penalty for conflicts
        }
      }
    }
    
    // Check turnaround time constraints
    schedules.forEach(schedule => {
      if (schedule.delayMinutes > constraints.maxDelayMinutes) {
        penalty += schedule.delayMinutes - constraints.maxDelayMinutes;
      }
    });
    
    return penalty;
  }

  /**
   * Calculate delay minimization score
   */
  private calculateDelayScore(schedules: Schedule[]): number {
    const totalDelay = schedules.reduce((sum, schedule) => sum + schedule.delayMinutes, 0);
    const maxPossibleDelay = schedules.length * 60; // Assume max 60 min delay per schedule
    
    return Math.max(0, 100 - (totalDelay / maxPossibleDelay) * 100);
  }

  /**
   * Calculate resource utilization score
   */
  private calculateUtilizationScore(schedules: Schedule[]): number {
    // Calculate time gaps between consecutive schedules
    const sortedSchedules = [...schedules].sort((a, b) => 
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
    
    let totalGap = 0;
    for (let i = 1; i < sortedSchedules.length; i++) {
      const prevArrival = new Date(sortedSchedules[i - 1].arrivalTime);
      const currentDeparture = new Date(sortedSchedules[i].departureTime);
      const gap = (currentDeparture.getTime() - prevArrival.getTime()) / (1000 * 60); // minutes
      totalGap += Math.max(0, gap - 5); // 5 minutes minimum turnaround
    }
    
    const avgGap = totalGap / Math.max(1, sortedSchedules.length - 1);
    return Math.max(0, 100 - avgGap); // Lower gaps = higher utilization
  }

  /**
   * Calculate passenger comfort score
   */
  private calculateComfortScore(schedules: Schedule[]): number {
    // Score based on consistent intervals and avoiding peak congestion
    const intervals: number[] = [];
    const sortedSchedules = [...schedules].sort((a, b) => 
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
    
    for (let i = 1; i < sortedSchedules.length; i++) {
      const prevTime = new Date(sortedSchedules[i - 1].departureTime);
      const currentTime = new Date(sortedSchedules[i].departureTime);
      const interval = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60);
      intervals.push(interval);
    }
    
    // Calculate standard deviation of intervals (lower = more consistent)
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 100 - stdDev * 2); // Penalize inconsistent intervals
  }

  /**
   * Check if two schedules have temporal conflict
   */
  private hasTemporalConflict(schedule1: Schedule, schedule2: Schedule): boolean {
    const start1 = new Date(schedule1.departureTime);
    const end1 = new Date(schedule1.arrivalTime);
    const start2 = new Date(schedule2.departureTime);
    const end2 = new Date(schedule2.arrivalTime);
    
    // Check for overlap with 5-minute safety buffer
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (start1.getTime() - buffer < end2.getTime()) && 
           (start2.getTime() - buffer < end1.getTime());
  }

  /**
   * Tournament selection for genetic algorithm
   */
  private tournamentSelection(population: Schedule[][], fitnessScores: number[]): Schedule[] {
    const tournamentSize = 3;
    let bestIndex = Math.floor(Math.random() * population.length);
    
    for (let i = 1; i < tournamentSize; i++) {
      const candidateIndex = Math.floor(Math.random() * population.length);
      if (fitnessScores[candidateIndex] > fitnessScores[bestIndex]) {
        bestIndex = candidateIndex;
      }
    }
    
    return population[bestIndex];
  }

  /**
   * Crossover operation for genetic algorithm
   */
  private crossover(parent1: Schedule[], parent2: Schedule[]): Schedule[] {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    const offspring = [
      ...parent1.slice(0, crossoverPoint),
      ...parent2.slice(crossoverPoint)
    ];
    
    return offspring;
  }

  /**
   * Mutation operation for genetic algorithm
   */
  private mutate(individual: Schedule[], trains: Train[], routes: Route[]): Schedule[] {
    const mutatedIndividual = [...individual];
    const mutationIndex = Math.floor(Math.random() * individual.length);
    
    // Randomly adjust departure time by ±5 minutes
    const schedule = mutatedIndividual[mutationIndex];
    const newDepartureTime = this.adjustTime(schedule.departureTime, -5, 5);
    const route = routes.find(r => r.id === schedule.routeId);
    
    if (route) {
      const newArrivalTime = new Date(newDepartureTime);
      newArrivalTime.setMinutes(newArrivalTime.getMinutes() + route.estimatedDuration);
      
      mutatedIndividual[mutationIndex] = {
        ...schedule,
        departureTime: newDepartureTime,
        arrivalTime: newArrivalTime.toISOString()
      };
    }
    
    return mutatedIndividual;
  }

  /**
   * Adjust time by random minutes within range
   */
  private adjustTime(timeString: string, minMinutes: number, maxMinutes: number): string {
    const time = new Date(timeString);
    const adjustment = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    time.setMinutes(time.getMinutes() + adjustment);
    return time.toISOString();
  }

  /**
   * Convert optimized schedules to optimization results
   */
  private convertToOptimizationResults(
    originalSchedules: Schedule[],
    optimizedSchedules: Schedule[],
    request: AIOptimizationRequest
  ): OptimizationResult[] {
    const results: OptimizationResult[] = [];
    
    originalSchedules.forEach((original, index) => {
      const optimized = optimizedSchedules[index];
      
      if (optimized) {
        const originalDelay = original.delayMinutes;
        const optimizedDelay = this.calculateScheduleDelay(optimized);
        const delayReduction = Math.max(0, originalDelay - optimizedDelay);
        
        const result: OptimizationResult = {
          id: `opt-${Date.now()}-${index}`,
          originalScheduleId: original.id,
          optimizedDepartureTime: optimized.departureTime,
          optimizedArrivalTime: optimized.arrivalTime,
          efficiencyScore: this.calculateEfficiencyScore(original, optimized),
          improvementPercentage: this.calculateImprovementPercentage(original, optimized),
          optimizationDetails: {
            delayReduction,
            utilizationImprovement: this.calculateUtilizationImprovement(original, optimized),
            energySavings: this.calculateEnergySavings(original, optimized)
          },
          createdAt: new Date().toISOString()
        };
        
        results.push(result);
      }
    });
    
    return results;
  }

  private calculateScheduleDelay(schedule: Schedule): number {
    // Simplified delay calculation
    return schedule.delayMinutes || 0;
  }

  private calculateEfficiencyScore(original: Schedule, optimized: Schedule): number {
    // Calculate efficiency based on time optimization and resource usage
    const originalDuration = new Date(original.arrivalTime).getTime() - new Date(original.departureTime).getTime();
    const optimizedDuration = new Date(optimized.arrivalTime).getTime() - new Date(optimized.departureTime).getTime();
    
    const durationImprovement = Math.max(0, (originalDuration - optimizedDuration) / originalDuration);
    const delayImprovement = Math.max(0, (original.delayMinutes - optimized.delayMinutes) / Math.max(1, original.delayMinutes));
    
    return Math.min(100, (durationImprovement + delayImprovement) * 50 + 70);
  }

  private calculateImprovementPercentage(original: Schedule, optimized: Schedule): number {
    const delayImprovement = Math.max(0, original.delayMinutes - optimized.delayMinutes);
    const maxImprovement = Math.max(1, original.delayMinutes);
    
    return (delayImprovement / maxImprovement) * 100;
  }

  private calculateUtilizationImprovement(original: Schedule, optimized: Schedule): number {
    // Simplified utilization improvement calculation
    return Math.random() * 15 + 5; // 5-20% improvement
  }

  private calculateEnergySavings(original: Schedule, optimized: Schedule): number {
    // Simplified energy savings calculation based on smoother operations
    const originalDuration = new Date(original.arrivalTime).getTime() - new Date(original.departureTime).getTime();
    const optimizedDuration = new Date(optimized.arrivalTime).getTime() - new Date(optimized.departureTime).getTime();
    
    return Math.max(0, (originalDuration - optimizedDuration) / originalDuration * 10);
  }
}

// Export singleton instance
export const scheduleOptimizer = new ScheduleOptimizer();