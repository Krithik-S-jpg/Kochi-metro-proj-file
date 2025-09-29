// API Route for AI Schedule Optimization
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { scheduleOptimizer } from '@/lib/ai/optimizer';
import { APIResponse, OptimizationResult, AIOptimizationRequest } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<OptimizationResult[]>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      data: [],
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  try {
    const optimizationRequest: AIOptimizationRequest = req.body;

    // Validate request
    if (!optimizationRequest.scheduleIds || optimizationRequest.scheduleIds.length === 0) {
      return res.status(400).json({
        data: [],
        success: false,
        message: 'Schedule IDs are required for optimization'
      });
    }

    // Get schedules, trains, and routes from database
    const [allSchedules, trains, routes] = await Promise.all([
      db.getSchedules(),
      db.getTrains(),
      db.getRoutes()
    ]);

    // Filter schedules to optimize
    const schedulesToOptimize = allSchedules.filter(schedule => 
      optimizationRequest.scheduleIds.includes(schedule.id)
    );

    if (schedulesToOptimize.length === 0) {
      return res.status(404).json({
        data: [],
        success: false,
        message: 'No valid schedules found for optimization'
      });
    }

    // Set default constraints and preferences if not provided
    const defaultRequest: AIOptimizationRequest = {
      scheduleIds: optimizationRequest.scheduleIds,
      optimizationType: optimizationRequest.optimizationType || 'efficiency',
      constraints: {
        maxDelayMinutes: 15,
        minTurnaroundTime: 10,
        maintenanceWindows: [],
        ...optimizationRequest.constraints
      },
      preferences: {
        prioritizeOnTime: 0.4,
        prioritizeEfficiency: 0.4,
        prioritizePassengerComfort: 0.2,
        ...optimizationRequest.preferences
      }
    };

    console.log(`Starting optimization for ${schedulesToOptimize.length} schedules...`);

    // Run optimization
    const optimizationResults = await scheduleOptimizer.optimizeSchedules(
      schedulesToOptimize,
      trains,
      routes,
      defaultRequest
    );

    console.log(`Optimization completed. Generated ${optimizationResults.length} results.`);

    return res.status(200).json({
      data: optimizationResults,
      success: true,
      message: `Successfully optimized ${optimizationResults.length} schedules`,
      meta: {
        optimizationType: defaultRequest.optimizationType,
        schedulesProcessed: schedulesToOptimize.length,
        averageImprovement: optimizationResults.length > 0 
          ? optimizationResults.reduce((sum, result) => sum + result.improvementPercentage, 0) / optimizationResults.length
          : 0
      }
    });

  } catch (error) {
    console.error('Optimization API error:', error);
    return res.status(500).json({
      data: [],
      success: false,
      message: 'Failed to optimize schedules. Please try again.'
    });
  }
}