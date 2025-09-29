import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Train, 
  Route, 
  Clock, 
  Users,
  Zap
} from 'lucide-react';
import { KPI } from '@/types';

interface KPIDashboardProps {
  kpis: KPI[];
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ kpis }) => {
  // Ensure kpis is an array before using map
  if (!Array.isArray(kpis) || kpis.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
        {/* Repeat for other skeleton cards */}
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (iconName) {
      case 'train':
        return <Train {...iconProps} />;
      case 'route':
        return <Route {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      case 'trending-up':
        return <TrendingUp {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      default:
        return <TrendingUp {...iconProps} />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {kpi.title}
            </CardTitle>
            {getIcon(kpi.icon)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {typeof kpi.value === 'number' && kpi.value % 1 !== 0 
                  ? kpi.value.toFixed(1) 
                  : kpi.value}
                {kpi.title.includes('Performance') || kpi.title.includes('Satisfaction') || kpi.title.includes('Efficiency') ? '%' : ''}
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(kpi.trend)}
                <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                  {kpi.change}
                </span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPIDashboard;