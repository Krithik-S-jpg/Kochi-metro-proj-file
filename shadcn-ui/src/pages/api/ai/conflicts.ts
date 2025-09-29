// API Route for AI Conflict Detection
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { conflictDetector } from '@/lib/ai/conflictDetector';
import { APIResponse } from '@/types';
import type { ConflictAnalysis } from '@/lib/ai/conflictDetector';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<ConflictAnalysis>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      data: {} as ConflictAnalysis,
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  try {
    const { scheduleIds, timeRange, conflictTypes } = req.body;

    // Get data from database
    const [allSchedules, trains, routes] = await Promise.all([
      db.getSchedules(),
      db.getTrains(),
      db.getRoutes()
    ]);

    // Filter schedules if specific IDs provided
    let schedulesToAnalyze = allSchedules;
    
    if (scheduleIds && scheduleIds.length > 0) {
      schedulesToAnalyze = allSchedules.filter(schedule => 
        scheduleIds.includes(schedule.id)
      );
    }

    // Filter by time range if provided
    if (timeRange && timeRange.startDate && timeRange.endDate) {
      schedulesToAnalyze = schedulesToAnalyze.filter(schedule => {
        const scheduleDate = new Date(schedule.departureTime);
        const startDate = new Date(timeRange.startDate);
        const endDate = new Date(timeRange.endDate);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });
    }

    if (schedulesToAnalyze.length === 0) {
      return res.status(400).json({
        data: {} as ConflictAnalysis,
        success: false,
        message: 'No schedules found for conflict analysis'
      });
    }

    console.log(`Analyzing ${schedulesToAnalyze.length} schedules for conflicts...`);

    // Run conflict detection
    const conflictAnalysis = await conflictDetector.detectConflicts(
      schedulesToAnalyze,
      trains,
      routes
    );

    // Store detected conflicts in database
    for (const conflict of conflictAnalysis.conflicts) {
      await db.createConflict(conflict);
    }

    console.log(`Conflict analysis completed. Found ${conflictAnalysis.conflicts.length} conflicts.`);

    return res.status(200).json({
      data: conflictAnalysis,
      success: true,
      message: `Analyzed ${schedulesToAnalyze.length} schedules and found ${conflictAnalysis.conflicts.length} conflicts`,
      meta: {
        schedulesAnalyzed: schedulesToAnalyze.length,
        conflictsFound: conflictAnalysis.conflicts.length,
        highRiskConflicts: conflictAnalysis.riskAssessment.highRisk,
        mediumRiskConflicts: conflictAnalysis.riskAssessment.mediumRisk,
        lowRiskConflicts: conflictAnalysis.riskAssessment.lowRisk
      }
    });

  } catch (error) {
    console.error('Conflict detection API error:', error);
    return res.status(500).json({
      data: {} as ConflictAnalysis,
      success: false,
      message: 'Failed to analyze conflicts. Please try again.'
    });
  }
}