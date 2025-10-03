import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Schedule } from '@/types';

interface ScheduleComparisonProps {
  originalSchedules: Schedule[];
  optimizedSchedules: Schedule[];
}

const ScheduleTable: React.FC<{ title: string; schedules: Schedule[]; originalSchedules?: Schedule[] }> = ({ title, schedules, originalSchedules }) => {
  const getRowClass = (schedule: Schedule) => {
    if (!originalSchedules) return '';

    const original = originalSchedules.find(s => s.id === schedule.id);
    if (!original) return 'bg-green-100 dark:bg-green-900/30'; // New schedule
    if (JSON.stringify(original) !== JSON.stringify(schedule)) {
      return 'bg-yellow-100 dark:bg-yellow-900/30'; // Modified schedule
    }
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto">
          <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <tr>
                <th className="border px-4 py-2 text-left">ID</th>
                <th className="border px-4 py-2 text-left">Train</th>
                <th className="border px-4 py-2 text-left">Route</th>
                <th className="border px-4 py-2 text-left">Departure</th>
                <th className="border px-4 py-2 text-left">Arrival</th>
                <th className="border px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className={getRowClass(schedule)}>
                  <td className="border px-4 py-2">{schedule.id}</td>
                  <td className="border px-4 py-2">{schedule.trainId}</td>
                  <td className="border px-4 py-2">{schedule.routeId}</td>
                  <td className="border px-4 py-2">{schedule.departureTime}</td>
                  <td className="border px-4 py-2">{schedule.arrivalTime}</td>
                  <td className="border px-4 py-2">
                    <Badge variant={schedule.status === 'scheduled' ? 'default' : 'secondary'}>
                      {schedule.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};


const ScheduleComparison: React.FC<ScheduleComparisonProps> = ({ originalSchedules, optimizedSchedules }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ScheduleTable title="Original Schedule" schedules={originalSchedules} />
      <ScheduleTable title="AI-Optimized Schedule" schedules={optimizedSchedules} originalSchedules={originalSchedules} />
    </div>
  );
};

export default ScheduleComparison;