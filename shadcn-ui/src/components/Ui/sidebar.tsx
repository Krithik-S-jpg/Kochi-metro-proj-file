import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Map, 
  Settings, 
  Train, 
  Route, 
  Navigation,
  Moon,
  Sun,
  Bell,
  Globe,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Activity,
  TrendingUp,
  Upload,
  Brain,
  Clock
} from 'lucide-react';

interface SidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onNavigate, 
  currentPage, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Show sidebar when cursor is near left edge
      if (e.clientX <= 50 && !isOpen) {
        setIsOpen(true);
      }
      // Hide sidebar when cursor moves away
      else if (e.clientX > 300 && isOpen && !isSettingsOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen, isSettingsOpen]);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: TrendingUp,
      description: 'System overview and metrics'
    },
    {
      id: 'map',
      label: 'Live Map',
      icon: Map,
      description: 'Real-time train tracking',
      badge: 'Live'
    },
    {
      id: 'upload',
      label: 'Upload Data',
      icon: Upload,
      description: 'Import train schedules'
    },
    {
      id: 'ai-prediction',
      label: 'AI Prediction',
      icon: Brain,
      description: 'Schedule optimization'
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: Clock,
      description: 'View train schedules'
    }
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          width: '280px', 
          zIndex: 9999 // Very high z-index to ensure it's above everything including Leaflet map
        }}
        onMouseLeave={() => !isSettingsOpen && setIsOpen(false)}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Train className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">KMRL</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Metro Control</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-auto p-3 ${
                  isActive 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`h-5 w-5 ${
                    isActive ? "text-white" : "text-gray-600 dark:text-gray-300"
                  }`} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        isActive ? "text-white" : "text-gray-900 dark:text-white"
                      }`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      isActive ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Settings Section */}
        <div className="p-4">
          <Button
            variant={currentPage === 'settings' ? "default" : "ghost"}
            className={`w-full justify-start h-auto p-3 ${
              currentPage === 'settings'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => {
              onNavigate('settings');
              setIsSettingsOpen(!isSettingsOpen);
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <Settings className={`h-5 w-5 ${
                currentPage === 'settings' ? "text-white" : "text-gray-600 dark:text-gray-300"
              }`} />
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    currentPage === 'settings' ? "text-white" : "text-gray-900 dark:text-white"
                  }`}>
                    Settings
                  </span>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${
                      isSettingsOpen ? 'rotate-90' : ''
                    } ${currentPage === 'settings' ? "text-white" : "text-gray-400"}`} 
                  />
                </div>
                <p className={`text-xs mt-1 ${
                  currentPage === 'settings' ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                }`}>
                  System preferences
                </p>
              </div>
            </div>
          </Button>

          {/* Quick Settings Panel */}
          {isSettingsOpen && (
            <Card className="mt-2 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 space-y-4">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? (
                      <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Dark Mode
                    </span>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={onToggleDarkMode}
                  />
                </div>

                <Separator />

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Notifications
                    </span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                {/* Language */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Language
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    English
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hover Indicator */}
      {!isOpen && mousePosition.x <= 10 && (
        <div 
          className="fixed left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-blue-600 rounded-r-full animate-pulse" 
          style={{ zIndex: 9998 }} // High z-index for hover indicator
        />
      )}
    </>
  );
};

export default Sidebar;