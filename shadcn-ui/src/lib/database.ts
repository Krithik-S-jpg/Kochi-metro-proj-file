// KMRL Database Simulation using localStorage
// In production, this would connect to SQLite/PostgreSQL

import { Train, Route, Schedule, Conflict, KPIMetrics, UploadedDataset } from '@/types';
import { sampleData } from './sampleData';

class DatabaseManager {
  private static instance: DatabaseManager;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Initialize database with sample data
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if data already exists
      const existingTrains = localStorage.getItem('kmrl_trains');
      
      if (!existingTrains) {
        // Initialize with sample data
        localStorage.setItem('kmrl_trains', JSON.stringify(sampleData.trains));
        localStorage.setItem('kmrl_routes', JSON.stringify(sampleData.routes));
        localStorage.setItem('kmrl_schedules', JSON.stringify(sampleData.schedules));
        localStorage.setItem('kmrl_conflicts', JSON.stringify(sampleData.conflicts));
        localStorage.setItem('kmrl_kpis', JSON.stringify(sampleData.kpis));
        localStorage.setItem('kmrl_datasets', JSON.stringify([]));
        
        console.log('Database initialized with sample KMRL data');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed');
    }
  }

  // Train operations
  public async getTrains(): Promise<Train[]> {
    await this.initialize();
    const trains = localStorage.getItem('kmrl_trains');
    return trains ? JSON.parse(trains) : [];
  }

  public async getTrain(id: string): Promise<Train | null> {
    const trains = await this.getTrains();
    return trains.find(train => train.id === id) || null;
  }

  public async createTrain(train: Omit<Train, 'id' | 'createdAt' | 'updatedAt'>): Promise<Train> {
    const trains = await this.getTrains();
    const newTrain: Train = {
      ...train,
      id: `train-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    trains.push(newTrain);
    localStorage.setItem('kmrl_trains', JSON.stringify(trains));
    return newTrain;
  }

  public async updateTrain(id: string, updates: Partial<Train>): Promise<Train | null> {
    const trains = await this.getTrains();
    const index = trains.findIndex(train => train.id === id);
    
    if (index === -1) return null;
    
    trains[index] = {
      ...trains[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('kmrl_trains', JSON.stringify(trains));
    return trains[index];
  }

  public async deleteTrain(id: string): Promise<boolean> {
    const trains = await this.getTrains();
    const filteredTrains = trains.filter(train => train.id !== id);
    
    if (filteredTrains.length === trains.length) return false;
    
    localStorage.setItem('kmrl_trains', JSON.stringify(filteredTrains));
    return true;
  }

  // Route operations
  public async getRoutes(): Promise<Route[]> {
    await this.initialize();
    const routes = localStorage.getItem('kmrl_routes');
    return routes ? JSON.parse(routes) : [];
  }

  public async getRoute(id: string): Promise<Route | null> {
    const routes = await this.getRoutes();
    return routes.find(route => route.id === id) || null;
  }

  // Schedule operations
  public async getSchedules(filters?: {
    trainId?: string;
    routeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Schedule[]> {
    await this.initialize();
    const schedules = localStorage.getItem('kmrl_schedules');
    let allSchedules: Schedule[] = schedules ? JSON.parse(schedules) : [];

    if (filters) {
      allSchedules = allSchedules.filter(schedule => {
        if (filters.trainId && schedule.trainId !== filters.trainId) return false;
        if (filters.routeId && schedule.routeId !== filters.routeId) return false;
        if (filters.status && schedule.status !== filters.status) return false;
        if (filters.startDate && schedule.departureTime < filters.startDate) return false;
        if (filters.endDate && schedule.departureTime > filters.endDate) return false;
        return true;
      });
    }

    return allSchedules;
  }

  public async getSchedule(id: string): Promise<Schedule | null> {
    const schedules = await this.getSchedules();
    return schedules.find(schedule => schedule.id === id) || null;
  }

  public async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    const schedules = await this.getSchedules();
    const newSchedule: Schedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    schedules.push(newSchedule);
    localStorage.setItem('kmrl_schedules', JSON.stringify(schedules));
    return newSchedule;
  }

  public async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | null> {
    const schedules = await this.getSchedules();
    const index = schedules.findIndex(schedule => schedule.id === id);
    
    if (index === -1) return null;
    
    schedules[index] = {
      ...schedules[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('kmrl_schedules', JSON.stringify(schedules));
    return schedules[index];
  }

  public async deleteSchedule(id: string): Promise<boolean> {
    const schedules = await this.getSchedules();
    const filteredSchedules = schedules.filter(schedule => schedule.id !== id);
    
    if (filteredSchedules.length === schedules.length) return false;
    
    localStorage.setItem('kmrl_schedules', JSON.stringify(filteredSchedules));
    return true;
  }

  // Conflict operations
  public async getConflicts(): Promise<Conflict[]> {
    await this.initialize();
    const conflicts = localStorage.getItem('kmrl_conflicts');
    return conflicts ? JSON.parse(conflicts) : [];
  }

  public async createConflict(conflict: Omit<Conflict, 'id' | 'detectedAt'>): Promise<Conflict> {
    const conflicts = await this.getConflicts();
    const newConflict: Conflict = {
      ...conflict,
      id: `conflict-${Date.now()}`,
      detectedAt: new Date().toISOString()
    };
    
    conflicts.push(newConflict);
    localStorage.setItem('kmrl_conflicts', JSON.stringify(conflicts));
    return newConflict;
  }

  public async resolveConflict(id: string): Promise<boolean> {
    const conflicts = await this.getConflicts();
    const index = conflicts.findIndex(conflict => conflict.id === id);
    
    if (index === -1) return false;
    
    conflicts[index].resolved = true;
    conflicts[index].resolvedAt = new Date().toISOString();
    
    localStorage.setItem('kmrl_conflicts', JSON.stringify(conflicts));
    return true;
  }

  // KPI operations
  public async getKPIs(): Promise<KPIMetrics> {
    await this.initialize();
    const kpis = localStorage.getItem('kmrl_kpis');
    return kpis ? JSON.parse(kpis) : sampleData.kpis;
  }

  public async updateKPIs(kpis: KPIMetrics): Promise<void> {
    localStorage.setItem('kmrl_kpis', JSON.stringify(kpis));
  }

  // Dataset operations
  public async getDatasets(): Promise<UploadedDataset[]> {
    await this.initialize();
    const datasets = localStorage.getItem('kmrl_datasets');
    return datasets ? JSON.parse(datasets) : [];
  }

  public async createDataset(dataset: Omit<UploadedDataset, 'id' | 'uploadedAt'>): Promise<UploadedDataset> {
    const datasets = await this.getDatasets();
    const newDataset: UploadedDataset = {
      ...dataset,
      id: `dataset-${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };
    
    datasets.push(newDataset);
    localStorage.setItem('kmrl_datasets', JSON.stringify(datasets));
    return newDataset;
  }

  // Utility methods
  public async clearAllData(): Promise<void> {
    const keys = ['kmrl_trains', 'kmrl_routes', 'kmrl_schedules', 'kmrl_conflicts', 'kmrl_kpis', 'kmrl_datasets'];
    keys.forEach(key => localStorage.removeItem(key));
    this.isInitialized = false;
  }

  public async exportData(): Promise<string> {
    await this.initialize();
    
    const data = {
      trains: await this.getTrains(),
      routes: await this.getRoutes(),
      schedules: await this.getSchedules(),
      conflicts: await this.getConflicts(),
      kpis: await this.getKPIs(),
      datasets: await this.getDatasets(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  public async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.trains) localStorage.setItem('kmrl_trains', JSON.stringify(data.trains));
      if (data.routes) localStorage.setItem('kmrl_routes', JSON.stringify(data.routes));
      if (data.schedules) localStorage.setItem('kmrl_schedules', JSON.stringify(data.schedules));
      if (data.conflicts) localStorage.setItem('kmrl_conflicts', JSON.stringify(data.conflicts));
      if (data.kpis) localStorage.setItem('kmrl_kpis', JSON.stringify(data.kpis));
      if (data.datasets) localStorage.setItem('kmrl_datasets', JSON.stringify(data.datasets));
      
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid data format');
    }
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();