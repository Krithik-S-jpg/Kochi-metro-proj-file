// API Route for Schedule Management
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { Schedule, APIResponse, PaginatedResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<Schedule | Schedule[]> | PaginatedResponse<Schedule>>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetSchedules(req, res);
      case 'POST':
        return await handleCreateSchedule(req, res);
      case 'PUT':
        return await handleUpdateSchedule(req, res);
      case 'DELETE':
        return await handleDeleteSchedule(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          data: null,
          success: false,
          message: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({
      data: null,
      success: false,
      message: 'Internal server error'
    });
  }
}

async function handleGetSchedules(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedResponse<Schedule>>
) {
  const { 
    page = '1', 
    limit = '20', 
    trainId, 
    routeId, 
    status, 
    startDate, 
    endDate 
  } = req.query;

  const filters = {
    trainId: trainId as string,
    routeId: routeId as string,
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string
  };

  // Remove undefined filters
  Object.keys(filters).forEach(key => {
    if (!filters[key as keyof typeof filters]) {
      delete filters[key as keyof typeof filters];
    }
  });

  const schedules = await db.getSchedules(filters);
  
  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  
  const paginatedSchedules = schedules.slice(startIndex, endIndex);
  
  return res.status(200).json({
    data: paginatedSchedules,
    success: true,
    meta: {
      total: schedules.length,
      page: pageNum,
      perPage: limitNum,
      totalPages: Math.ceil(schedules.length / limitNum)
    }
  });
}

async function handleCreateSchedule(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<Schedule>>
) {
  const { trainId, routeId, departureTime, arrivalTime, status = 'scheduled' } = req.body;

  if (!trainId || !routeId || !departureTime || !arrivalTime) {
    return res.status(400).json({
      data: null,
      success: false,
      message: 'Missing required fields: trainId, routeId, departureTime, arrivalTime'
    });
  }

  // Validate departure time is before arrival time
  if (new Date(departureTime) >= new Date(arrivalTime)) {
    return res.status(400).json({
      data: null,
      success: false,
      message: 'Departure time must be before arrival time'
    });
  }

  const newSchedule = await db.createSchedule({
    trainId,
    routeId,
    departureTime,
    arrivalTime,
    status,
    delayMinutes: 0,
    createdBy: 'api-user'
  });

  return res.status(201).json({
    data: newSchedule,
    success: true,
    message: 'Schedule created successfully'
  });
}

async function handleUpdateSchedule(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<Schedule>>
) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({
      data: null,
      success: false,
      message: 'Schedule ID is required'
    });
  }

  const updatedSchedule = await db.updateSchedule(id as string, updates);

  if (!updatedSchedule) {
    return res.status(404).json({
      data: null,
      success: false,
      message: 'Schedule not found'
    });
  }

  return res.status(200).json({
    data: updatedSchedule,
    success: true,
    message: 'Schedule updated successfully'
  });
}

async function handleDeleteSchedule(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<null>>
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      data: null,
      success: false,
      message: 'Schedule ID is required'
    });
  }

  const deleted = await db.deleteSchedule(id as string);

  if (!deleted) {
    return res.status(404).json({
      data: null,
      success: false,
      message: 'Schedule not found'
    });
  }

  return res.status(200).json({
    data: null,
    success: true,
    message: 'Schedule deleted successfully'
  });
}