// API Route for Dashboard Data
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { generateDashboardData } from '@/lib/sampleData';
import { APIResponse, DashboardData } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<DashboardData>>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      data: {} as DashboardData,
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  try {
    // Get fresh data from database
    const [schedules, trains, routes, conflicts, kpis] = await Promise.all([
      db.getSchedules(),
      db.getTrains(),
      db.getRoutes(),
      db.getConflicts(),
      db.getKPIs()
    ]);

    // Calculate real-time KPIs
    const activeSchedules = schedules.filter(s => s.status === 'active' || s.status === 'scheduled');
    const completedSchedules = schedules.filter(s => s.status === 'completed');
    const delayedSchedules = schedules.filter(s => s.delayMinutes > 0);
    
    const onTimeSchedules = completedSchedules.filter(s => s.delayMinutes <= 2);
    const onTimePerformance = completedSchedules.length > 0 
      ? (onTimeSchedules.length / completedSchedules.length) * 100 
      : 0;

    const averageDelay = delayedSchedules.length > 0
      ? delayedSchedules.reduce((sum, s) => sum + s.delayMinutes, 0) / delayedSchedules.length
      : 0;

    const activeTrains = trains.filter(t => t.status === 'active');
    const trainUtilization = activeTrains.length > 0 
      ? (activeSchedules.length / (activeTrains.length * 10)) * 100 // Assume 10 schedules per train per day
      : 0;

    const activeConflicts = conflicts.filter(c => !c.resolved);
    const resolvedConflicts = conflicts.filter(c => c.resolved);

    // Update KPIs with real-time data
    const updatedKPIs = {
      ...kpis,
      totalTrains: trains.length,
      activeSchedules: activeSchedules.length,
      onTimePerformance: Math.round(onTimePerformance * 10) / 10,
      averageDelay: Math.round(averageDelay * 10) / 10,
      trainUtilization: Math.min(100, Math.round(trainUtilization * 10) / 10),
      conflictsDetected: conflicts.length,
      conflictsResolved: resolvedConflicts.length,
      lastUpdated: new Date().toISOString()
    };

    // Get recent schedules (next 10 upcoming or active)
    const now = new Date();
    const recentSchedules = schedules
      .filter(s => s.status === 'active' || (s.status === 'scheduled' && new Date(s.departureTime) > now))
      .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
      .slice(0, 10);

    // Generate utilization trends for the last 7 days
    const utilizationTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const daySchedules = schedules.filter(s => {
        const scheduleDate = new Date(s.departureTime);
        return scheduleDate.toDateString() === date.toDateString();
      });
      
      const dayCompleted = daySchedules.filter(s => s.status === 'completed');
      const dayOnTime = dayCompleted.filter(s => s.delayMinutes <= 2);
      
      return {
        date: date.toISOString().split('T')[0],
        utilization: Math.min(100, (daySchedules.length / 50) * 100), // Assume 50 schedules per day target
        onTimePerformance: dayCompleted.length > 0 ? (dayOnTime.length / dayCompleted.length) * 100 : 100
      };
    });

    // Generate train performance data
    const trainPerformance = activeTrains.map(train => {
      const trainSchedules = schedules.filter(s => s.trainId === train.id);
      const trainCompleted = trainSchedules.filter(s => s.status === 'completed');
      const trainDelayed = trainSchedules.filter(s => s.delayMinutes > 0);
      
      const efficiency = trainCompleted.length > 0
        ? ((trainCompleted.length - trainDelayed.length) / trainCompleted.length) * 100
        : 100;
      
      const avgDelay = trainDelayed.length > 0
        ? trainDelayed.reduce((sum, s) => sum + s.delayMinutes, 0) / trainDelayed.length
        : 0;
      
      const utilizationRate = Math.min(100, (trainSchedules.length / 10) * 100);
      
      return {
        trainNumber: train.trainNumber,
        efficiency: Math.round(efficiency * 10) / 10,
        delayMinutes: Math.round(avgDelay * 10) / 10,
        utilizationRate: Math.round(utilizationRate * 10) / 10
      };
    });

    const dashboardData: DashboardData = {
      kpis: updatedKPIs,
      recentSchedules,
      activeConflicts,
      utilizationTrends,
      trainPerformance
    };

    // Update KPIs in database
    await db.updateKPIs(updatedKPIs);

    return res.status(200).json({
      data: dashboardData,
      success: true,
      message: 'Dashboard data retrieved successfully',
      meta: {
        lastUpdated: updatedKPIs.lastUpdated,
        dataPoints: {
          schedules: schedules.length,
          trains: trains.length,
          routes: routes.length,
          conflicts: conflicts.length
        }
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({
      data: {} as DashboardData,
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
}