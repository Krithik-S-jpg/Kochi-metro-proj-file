import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Train, 
  Users, 
  Route, 
  Clock, 
  Upload, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Settings as SettingsIcon, 
  Map,
  Activity,
  Database
} from 'lucide-react';
import KPIDashboard from '@/components/dashboard/KPIDashboard';
import FileUpload from '@/components/data/FileUpload';
import PredictionEngine from '@/components/ai/PredictionEngine';
import RealSchedulingEngine from '@/components/ai/RealSchedulingEngine';
import UploadModal from '@/components/ui/upload-modal';
import LoadingScreen from '@/components/ui/loading-screen';
import DataLoading from '@/components/ui/data-loading';
import Sidebar from '@/components/ui/sidebar';
import RealMap from '@/components/map/RealMap';
import Settings from '@/pages/Settings';
import ParallaxWrapper from '@/components/ui/parallax/ParallaxWrapper';
import ScrollToggleButton from '@/components/ui/scroll-toggle-button';
import { Train as TrainType, Route as RouteType, Schedule, KPI } from '@/types';
import { sampleTrains, sampleRoutes, generateSampleSchedules, sampleKPIMetrics } from '@/lib/sampleData';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function Index() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { language } = useLanguage();
  const [trains, setTrains] = useState<TrainType[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const [uploadedDataStats, setUploadedDataStats] = useState<{
    totalRecords: number;
    trains: number;
    routes: number;
    schedules: number;
    stations: number;
  } | null>(null);
  const [predictionResults, setPredictionResults] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    // Simulate initial data loading
    const loadInitialData = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second loading
      
      setTrains(sampleTrains);
      // Translate station names in routes
      setRoutes(sampleRoutes.map(route => ({
        ...route,
        stations: route.stations.map(station => translations[language][station] || station),
        startStation: translations[language][route.startStation] || route.startStation,
        endStation: translations[language][route.endStation] || route.endStation,
      })));
      setSchedules(generateSampleSchedules());
      
      // Convert KPIMetrics to KPI array format
      const kpiArray: KPI[] = [
        {
          id: '1',
          title: 'Total Trains',
          value: sampleKPIMetrics.totalTrains,
          change: '+2',
          trend: 'up' as const,
          icon: 'train' as const
        },
        {
          id: '2',
          title: 'Active Routes',
          value: 2,
          change: '0',
          trend: 'stable' as const,
          icon: 'route' as const
        },
        {
          id: '3',
          title: 'Scheduled Trips',
          value: sampleKPIMetrics.activeSchedules,
          change: '+15',
          trend: 'up' as const,
          icon: 'clock' as const
        },
        {
          id: '4',
          title: 'On-Time Performance',
          value: sampleKPIMetrics.onTimePerformance,
          change: '+2.5%',
          trend: 'up' as const,
          icon: 'trending-up' as const
        },
        {
          id: '5',
          title: 'Passenger Satisfaction',
          value: sampleKPIMetrics.passengerSatisfaction,
          change: '+1.2%',
          trend: 'up' as const,
          icon: 'users' as const
        },
        {
          id: '6',
          title: 'Energy Efficiency',
          value: sampleKPIMetrics.energyEfficiency,
          change: '+3.1%',
          trend: 'up' as const,
          icon: 'zap' as const
        }
      ];
      
  setKpis(kpiArray);
  setIsInitialLoading(false);
  setLastRefresh(new Date());
    };

    loadInitialData();
  }, []);

  const handleDataUpload = (uploadedData: {
    trains?: TrainType[];
    routes?: RouteType[];
    schedules?: Schedule[];
    stations?: any[];
    rawData?: Record<string, unknown>[];
  }) => {
    console.log('Processing ALL uploaded data:', uploadedData);
    
    // Process and use ALL uploaded data (don't merge with existing, replace completely)
    if (uploadedData.trains && Array.isArray(uploadedData.trains) && uploadedData.trains.length > 0) {
      console.log(`Processing ${uploadedData.trains.length} trains`);
      setTrains([...sampleTrains, ...uploadedData.trains]); // Keep sample + add all uploaded
    }
    
    if (uploadedData.routes && Array.isArray(uploadedData.routes) && uploadedData.routes.length > 0) {
      console.log(`Processing ${uploadedData.routes.length} routes`);
      setRoutes([...sampleRoutes, ...uploadedData.routes]); // Keep sample + add all uploaded
    }
    
    if (uploadedData.schedules && Array.isArray(uploadedData.schedules) && uploadedData.schedules.length > 0) {
      console.log(`Processing ${uploadedData.schedules.length} schedules`);
      setSchedules([...generateSampleSchedules(), ...uploadedData.schedules]); // Keep sample + add all uploaded
    }

    if (uploadedData.stations && Array.isArray(uploadedData.stations) && uploadedData.stations.length > 0) {
      console.log(`Processing ${uploadedData.stations.length} stations`);
      setStations(uploadedData.stations); // Use all uploaded stations
    }
    
    setHasUploadedData(true);
    
    // Track uploaded data statistics
    const stats = {
      totalRecords: (uploadedData.trains?.length || 0) + 
                   (uploadedData.routes?.length || 0) + 
                   (uploadedData.schedules?.length || 0) + 
                   (uploadedData.stations?.length || 0),
      trains: uploadedData.trains?.length || 0,
      routes: uploadedData.routes?.length || 0,
      schedules: uploadedData.schedules?.length || 0,
      stations: uploadedData.stations?.length || 0
    };
    
    setUploadedDataStats(stats);
    
    // Update KPIs based on ALL new data
    const updatedKpis = [...kpis];
    
    // Update total trains KPI
    const totalTrainsKpi = updatedKpis.find(kpi => kpi.title === 'Total Trains');
    if (totalTrainsKpi && uploadedData.trains) {
      const newTotal = sampleTrains.length + uploadedData.trains.length;
      totalTrainsKpi.value = newTotal;
      totalTrainsKpi.change = `+${uploadedData.trains.length}`;
      totalTrainsKpi.trend = 'up';
    }

    // Update routes KPI
    const routesKpi = updatedKpis.find(kpi => kpi.title === 'Active Routes');
    if (routesKpi && uploadedData.routes) {
      const newTotal = sampleRoutes.length + uploadedData.routes.length;
      routesKpi.value = newTotal;
      routesKpi.change = `+${uploadedData.routes.length}`;
      routesKpi.trend = 'up';
    }

    // Update schedules KPI
    const schedulesKpi = updatedKpis.find(kpi => kpi.title === 'Scheduled Trips');
    if (schedulesKpi && uploadedData.schedules) {
      const newTotal = generateSampleSchedules().length + uploadedData.schedules.length;
      schedulesKpi.value = newTotal;
      schedulesKpi.change = `+${uploadedData.schedules.length}`;
      schedulesKpi.trend = 'up';
    }
    
    setKpis(updatedKpis);
    
    // Auto-switch to AI prediction tab after successful upload
    setActiveTab('ai-prediction');
    setCurrentPage('ai-prediction');

    console.log(`Successfully processed ${stats.totalRecords} total records:`, stats);
  };

  const handlePredictionComplete = (predictions: Record<string, unknown>) => {
    setPredictionResults(predictions);
    
    // Update schedules with optimized ones if available
    if (predictions.optimizedSchedules && Array.isArray(predictions.optimizedSchedules)) {
      console.log(`Applying ${predictions.optimizedSchedules.length} optimized schedules`);
      setSchedules(predictions.optimizedSchedules as Schedule[]);
    }
    
    // Update KPIs based on predictions
    const updatedKpis = [...kpis];
    const efficiencyKpi = updatedKpis.find(kpi => kpi.title === 'On-Time Performance');
    if (efficiencyKpi && predictions.efficiency && typeof predictions.efficiency === 'object') {
      const efficiency = predictions.efficiency as { predictedEfficiency: number; improvement: number };
      efficiencyKpi.value = efficiency.predictedEfficiency;
      efficiencyKpi.change = `+${efficiency.improvement}%`;
      efficiencyKpi.trend = 'up';
    }
    
    setKpis(updatedKpis);
  };

  const handleScheduleUpdate = (optimizedSchedules: Schedule[]) => {
    console.log(`Updating with ${optimizedSchedules.length} optimized schedules`);
    setSchedules(optimizedSchedules);
    
    // Update KPIs based on optimization
    const updatedKpis = [...kpis];
    const efficiencyKpi = updatedKpis.find(kpi => kpi.title === 'On-Time Performance');
    if (efficiencyKpi) {
      efficiencyKpi.value = Math.min(100, efficiencyKpi.value + 1);
      efficiencyKpi.change = '+1.0%';
      efficiencyKpi.trend = 'up';
    }
    setKpis(updatedKpis);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    if (['dashboard', 'upload', 'ai-prediction', 'schedules'].includes(page)) {
      setActiveTab(page);
    }
  };

  if (isInitialLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsInitialLoading(false)} />;
  }

  // Determine if parallax should be enabled (exclude map and settings)
  const shouldShowParallax = currentPage !== 'map' && currentPage !== 'settings';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar 
        onNavigate={handleNavigation}
        currentPage={currentPage}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content with Conditional Parallax */}
      <ParallaxWrapper enabled={shouldShowParallax} intensity={0.8}>
        <div className="transition-all duration-300">
          {/* Header */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                    <Train className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">KMRL Train Scheduling</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Metro Management System</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <DataLoading message="" size="sm" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    System Online
                  </Badge>
                  {hasUploadedData && uploadedDataStats && (
                    <Badge variant="default" className="bg-blue-600">
                      <Database className="h-3 w-3 mr-1" />
                      {uploadedDataStats.totalRecords} Records Loaded
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Modal */}
          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onDataUploaded={handleDataUpload}
          />

          {/* Page Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentPage === 'map' ? (
              <RealMap 
                uploadedStations={stations}
                uploadedRoutes={routes}
                uploadedTrains={trains}
              />
            ) : currentPage === 'settings' ? (
              <Settings 
                darkMode={isDarkMode}
                onDarkModeToggle={toggleDarkMode}
              />
            ) : (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
                <Tabs value={activeTab} onValueChange={(value) => {
                  setActiveTab(value);
                  setCurrentPage(value);
                }} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Data
                      {hasUploadedData && (
                        <Badge variant="secondary" className="ml-1">
                          {uploadedDataStats?.totalRecords}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="ai-prediction" className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Prediction
                      {predictionResults && <Badge variant="secondary" className="ml-1">Results</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="real-scheduler" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Real-time AI
                      <Badge variant="default" className="ml-1 bg-purple-600">Live</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="schedules" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Schedules
                      {schedules.length > 50 && (
                        <Badge variant="secondary" className="ml-1">
                          {schedules.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Dashboard Tab */}
                  <TabsContent value="dashboard" className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Overview</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Real-time metrics and performance indicators
                          {hasUploadedData && uploadedDataStats && (
                            <span className="ml-2 text-blue-600 font-medium">
                              • {uploadedDataStats.totalRecords} uploaded records active
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        Last updated: {lastRefresh.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {Array.isArray(kpis) && kpis.length > 0 ? (
                      <KPIDashboard kpis={kpis} />
                    ) : (
                      <div className="flex items-center justify-center p-8">
                        <DataLoading message="Loading KPI data..." />
                      </div>
                    )}
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <Card className="dark:bg-gray-800/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Trains</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {Array.isArray(trains) ? trains.filter(t => t.status === 'active').length : 0}
                              </p>
                              {hasUploadedData && uploadedDataStats && uploadedDataStats.trains > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                  +{uploadedDataStats.trains} uploaded
                                </p>
                              )}
                            </div>
                            <Train className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="dark:bg-gray-800/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Routes</p>
                              <p className="text-2xl font-bold text-green-600">
                                {Array.isArray(routes) ? routes.length : 0}
                              </p>
                              {hasUploadedData && uploadedDataStats && uploadedDataStats.routes > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  +{uploadedDataStats.routes} uploaded
                                </p>
                              )}
                            </div>
                            <Route className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="dark:bg-gray-800/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Schedules</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {Array.isArray(schedules) ? schedules.length : 0}
                              </p>
                              {hasUploadedData && uploadedDataStats && uploadedDataStats.schedules > 0 && (
                                <p className="text-xs text-purple-600 mt-1">
                                  +{uploadedDataStats.schedules} uploaded
                                </p>
                              )}
                            </div>
                            <Clock className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="dark:bg-gray-800/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Passengers</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {Array.isArray(schedules) && schedules.length > 0
                                  ? Math.round(schedules.reduce((sum, s) => sum + (s.passengerLoad || 0), 0) / schedules.length)
                                  : 0
                                }
                              </p>
                              {hasUploadedData && (
                                <p className="text-xs text-orange-600 mt-1">
                                  From uploaded data
                                </p>
                              )}
                            </div>
                            <Users className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Upload Data Tab */}
                  <TabsContent value="upload" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Train Data</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Upload CSV, JSON, or Excel files to import train scheduling data. All records will be processed and used by the AI system.
                      </p>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6">
                      <FileUpload onDataUploaded={handleDataUpload} />
                    </div>
                    
                    {hasUploadedData && uploadedDataStats && (
                      <Alert className="border-green-200 bg-green-50/90 dark:bg-green-900/20 dark:border-green-800 backdrop-blur-sm">
                        <AlertTriangle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          <strong>Data successfully imported!</strong> Processed {uploadedDataStats.totalRecords} total records:
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge className="bg-blue-100 text-blue-800">{uploadedDataStats.trains} Trains</Badge>
                            <Badge className="bg-green-100 text-green-800">{uploadedDataStats.routes} Routes</Badge>
                            <Badge className="bg-purple-100 text-purple-800">{uploadedDataStats.schedules} Schedules</Badge>
                            <Badge className="bg-orange-100 text-orange-800">{uploadedDataStats.stations} Stations</Badge>
                          </div>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-green-700 dark:text-green-300 underline ml-2 mt-2"
                            onClick={() => {
                              setActiveTab('ai-prediction');
                              setCurrentPage('ai-prediction');
                            }}
                          >
                            Go to AI Prediction →
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  {/* AI Prediction Tab */}
                  <TabsContent value="ai-prediction" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Schedule Optimization</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Advanced algorithms to optimize train schedules and predict passenger demand
                        {hasUploadedData && uploadedDataStats && (
                          <span className="ml-2 text-blue-600 font-medium">
                            • Processing {uploadedDataStats.totalRecords} uploaded records
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6">
                      {!Array.isArray(trains) || !Array.isArray(routes) || !Array.isArray(schedules) || 
                       trains.length === 0 || routes.length === 0 || schedules.length === 0 ? (
                        <Alert className="dark:bg-gray-800 dark:border-gray-700">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please upload train data first to run AI predictions.
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-blue-600 underline ml-2"
                              onClick={() => {
                                setActiveTab('upload');
                                setCurrentPage('upload');
                              }}
                            >
                              Upload Data →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <PredictionEngine 
                          trains={trains}
                          routes={routes}
                          schedules={schedules}
                          onPredictionComplete={handlePredictionComplete}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Real-time AI Scheduler Tab */}
                  <TabsContent value="real-scheduler" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Real-time AI Scheduler</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Live AI-powered scheduling with real-time optimization and conflict resolution
                        {hasUploadedData && uploadedDataStats && (
                          <span className="ml-2 text-blue-600 font-medium">
                            • Using {uploadedDataStats.totalRecords} uploaded records
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6">
                      {!Array.isArray(trains) || !Array.isArray(routes) || !Array.isArray(schedules) || 
                       trains.length === 0 || routes.length === 0 || schedules.length === 0 ? (
                        <Alert className="dark:bg-gray-800 dark:border-gray-700">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please upload train data first to activate real-time AI scheduling.
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-blue-600 underline ml-2"
                              onClick={() => {
                                setActiveTab('upload');
                                setCurrentPage('upload');
                              }}
                            >
                              Upload Data →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <RealSchedulingEngine 
                          trains={trains}
                          routes={routes}
                          schedules={schedules}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Schedules Tab */}
                  <TabsContent value="schedules" className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Train Schedules</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Current and optimized train scheduling information
                          {hasUploadedData && uploadedDataStats && (
                            <span className="ml-2 text-blue-600 font-medium">
                              • {schedules.length} total schedules ({uploadedDataStats.schedules} uploaded)
                            </span>
                          )}
                        </p>
                      </div>
                      {predictionResults && (
                        <Badge variant="default" className="bg-green-600">
                          AI Optimized
                        </Badge>
                      )}
                    </div>
                    
                    <Card className="dark:bg-gray-800/90 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="dark:text-white">Schedule Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!Array.isArray(schedules) || schedules.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No schedules available</p>
                            <p className="text-gray-500 dark:text-gray-500">Upload data to view train schedules</p>
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => {
                                setActiveTab('upload');
                                setCurrentPage('upload');
                              }}
                            >
                              Upload Data
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="text-center p-4 bg-blue-50/90 dark:bg-blue-900/20 rounded-lg backdrop-blur-sm">
                                <div className="text-2xl font-bold text-blue-600">{schedules.length}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total Schedules</div>
                                {hasUploadedData && uploadedDataStats && uploadedDataStats.schedules > 0 && (
                                  <div className="text-xs text-blue-600 mt-1">+{uploadedDataStats.schedules} uploaded</div>
                                )}
                              </div>
                              <div className="text-center p-4 bg-green-50/90 dark:bg-green-900/20 rounded-lg backdrop-blur-sm">
                                <div className="text-2xl font-bold text-green-600">
                                  {schedules.filter(s => s.status === 'scheduled').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Active Schedules</div>
                              </div>
                              <div className="text-center p-4 bg-purple-50/90 dark:bg-purple-900/20 rounded-lg backdrop-blur-sm">
                                <div className="text-2xl font-bold text-purple-600">
                                  {schedules.length > 0 
                                    ? Math.round(schedules.reduce((sum, s) => sum + (s.frequency || 0), 0) / schedules.length)
                                    : 0
                                  }min
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Frequency</div>
                              </div>
                            </div>
                            
                            <div className="max-h-96 overflow-auto bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm">
                              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                                <thead className="bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm">
                                  <tr>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Schedule ID</th>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Train</th>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Route</th>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Departure</th>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Arrival</th>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Frequency</th>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Load</th>
                                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left dark:text-white">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {schedules.slice(0, 50).map((schedule) => (
                                    <tr key={schedule.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 backdrop-blur-sm">
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 dark:text-gray-300">{schedule.id}</td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 dark:text-gray-300">{schedule.trainId}</td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 dark:text-gray-300">{schedule.routeId}</td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 dark:text-gray-300">{schedule.departureTime}</td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 dark:text-gray-300">{schedule.arrivalTime}</td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 dark:text-gray-300">{schedule.frequency}min</td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 dark:text-gray-300">{schedule.passengerLoad}</td>
                                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                                        <Badge 
                                          variant={schedule.status === 'scheduled' ? 'default' : 'secondary'}
                                        >
                                          {schedule.status}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {schedules.length > 50 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                                  Showing first 50 of {schedules.length} schedules
                                  {hasUploadedData && uploadedDataStats && (
                                    <span className="ml-2 text-blue-600">
                                      ({uploadedDataStats.schedules} from uploaded data)
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </ParallaxWrapper>

      {/* Scroll Toggle Button - Fixed position, always visible */}
      <ScrollToggleButton />
    </div>
  );
}