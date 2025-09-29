import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/Ui/slider';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Clock, 
  Palette, 
  Volume2,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Eye,
  Zap,
  Wifi
} from 'lucide-react';

interface SettingsProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    trainAlerts: boolean;
    scheduleUpdates: boolean;
    systemMaintenance: boolean;
    aiOptimizations: boolean;
    emailNotifications: boolean;
    emailAddress: string;
    pushNotifications: boolean;
    soundEnabled: boolean;
  };
  display: {
    compactMode: boolean;
    showAnimations: boolean;
    highContrast: boolean;
    fontSize: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  data: {
    autoSave: boolean;
    dataRetention: number;
    cacheEnabled: boolean;
    offlineMode: boolean;
  };
  security: {
    sessionTimeout: number;
    twoFactorAuth: boolean;
    dataEncryption: boolean;
    auditLog: boolean;
  };
  performance: {
    animationSpeed: number;
    maxRecords: number;
    preloadData: boolean;
    compressionEnabled: boolean;
  };
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  timezone: 'Asia/Kolkata',
  notifications: {
    trainAlerts: true,
    scheduleUpdates: true,
    systemMaintenance: true,
    aiOptimizations: true,
    emailNotifications: false,
    emailAddress: '',
    pushNotifications: true,
    soundEnabled: true
  },
  display: {
    compactMode: false,
    showAnimations: true,
    highContrast: false,
    fontSize: 14,
    autoRefresh: true,
    refreshInterval: 30,
  },
  data: {
    autoSave: true,
    dataRetention: 30,
    cacheEnabled: true,
    offlineMode: false,
  },
  security: {
    sessionTimeout: 60,
    twoFactorAuth: false,
    dataEncryption: true,
    auditLog: true,
  },
  performance: {
    animationSpeed: 1,
    maxRecords: 1000,
    preloadData: true,
    compressionEnabled: true,
  },
};

const Settings: React.FC<SettingsProps> = ({ darkMode, onDarkModeToggle }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const { language, setLanguage } = useLanguage();
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('kmrl-app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark' || (settings.theme === 'system' && darkMode)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply font size
    root.style.fontSize = `${settings.display.fontSize}px`;
    
    // Apply animation preferences
    if (!settings.display.showAnimations) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', `${1 / settings.performance.animationSpeed}s`);
    }
  }, [settings.theme, settings.display.fontSize, settings.display.showAnimations, settings.performance.animationSpeed, darkMode]);

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
    if (path === 'language') {
      setLanguage(value);
    }
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('kmrl-app-settings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('saved');
      setHasChanges(false);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    setShowResetConfirm(false);
    localStorage.removeItem('kmrl-app-settings');
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `kmrl-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings({ ...defaultSettings, ...importedSettings });
          setHasChanges(true);
        } catch (error) {
          console.error('Failed to import settings:', error);
          setSaveStatus('error');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    // Clear all localStorage data
    const keysToRemove = [
      'kmrl-app-settings',
      'kmrl-uploaded-data',
      'kmrl-ai-predictions',
      'kmrl-schedules',
      'kmrl-user-preferences'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    setShowClearDataConfirm(false);
    setSaveStatus('saved');
    
    // Reload page to reset application state
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('KMRL System Test', {
          body: 'Notification system is working correctly!',
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('KMRL System Test', {
              body: 'Notification system is working correctly!',
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your KMRL Train Scheduling experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saveStatus === 'saving'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {saveStatus === 'saved' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully! Changes have been applied.
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Display
              </CardTitle>
              <CardDescription>
                Customize the visual appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Theme</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') => {
                      updateSetting('theme', value);
                      if (value === 'dark') {
                        onDarkModeToggle();
                      } else if (value === 'light') {
                        if (darkMode) onDarkModeToggle();
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <SettingsIcon className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Font Size</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adjust text size for better readability
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{settings.display.fontSize}px</span>
                    <Slider
                      value={[settings.display.fontSize]}
                      onValueChange={([value]) => updateSetting('display.fontSize', value)}
                      max={20}
                      min={12}
                      step={1}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Compact Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reduce spacing and padding for more content
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.compactMode}
                    onCheckedChange={(checked) => updateSetting('display.compactMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Animations</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable smooth transitions and animations
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.showAnimations}
                    onCheckedChange={(checked) => updateSetting('display.showAnimations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">High Contrast</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Increase contrast for better accessibility
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.highContrast}
                    onCheckedChange={(checked) => updateSetting('display.highContrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto Refresh</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically refresh data at intervals
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.autoRefresh}
                    onCheckedChange={(checked) => updateSetting('display.autoRefresh', checked)}
                  />
                </div>

                {settings.display.autoRefresh && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Refresh Interval</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        How often to refresh data (seconds)
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{settings.display.refreshInterval}s</span>
                      <Slider
                        value={[settings.display.refreshInterval]}
                        onValueChange={([value]) => updateSetting('display.refreshInterval', value)}
                        max={300}
                        min={10}
                        step={10}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Train Alerts</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Delays, cancellations, and service updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.trainAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications.trainAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Schedule Updates</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Changes to train schedules and timetables
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.scheduleUpdates}
                    onCheckedChange={(checked) => updateSetting('notifications.scheduleUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">System Maintenance</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Planned maintenance and system updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemMaintenance}
                    onCheckedChange={(checked) => updateSetting('notifications.systemMaintenance', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">AI Optimizations</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      AI-generated schedule improvements and suggestions
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.aiOptimizations}
                    onCheckedChange={(checked) => updateSetting('notifications.aiOptimizations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive scheduling conflicts via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => {
                      console.log('Email Notifications Toggle:', checked);
                      updateSetting('notifications.emailNotifications', checked);
                      import('@/lib/emailService').then(({ setEmailConfig }) => {
                        console.log('Current Email Address:', settings.notifications.emailAddress);

                        if (!settings.notifications.emailAddress || !/.+@.+\..+/.test(settings.notifications.emailAddress)) {
                          console.error('Invalid email address provided.');
                          return;
                        }

                        setEmailConfig({
                          enabled: checked,
                          recipientEmail: settings.notifications.emailAddress
                        });
                      });
                    }}
                  />
                </div>

                {settings.notifications.emailNotifications && (
                  <div className="flex flex-col space-y-2 mt-4">
                    <Label className="text-base font-medium" htmlFor="notification-email">Email Address</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={settings.notifications.emailAddress}
                      onChange={(e) => {
                        const email = e.target.value;
                        console.log('Email Address Input Changed:', email);
                        updateSetting('notifications.emailAddress', email);
                        import('@/lib/emailService').then(({ setEmailConfig }) => {
                          if (!email || !/.+@.+\..+/.test(email)) {
                            console.error('Invalid email address provided.');
                            return;
                          }

                          setEmailConfig({
                            enabled: settings.notifications.emailNotifications,
                            recipientEmail: email
                          });
                        });
                      }}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email address for receiving scheduling conflict notifications
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                    {settings.notifications.emailNotifications && settings.notifications.emailAddress && (
                      <span className="text-xs text-blue-600">{settings.notifications.emailAddress}</span>
                    )}
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const email = prompt("Enter your email to receive notifications:");
                        if (email && email.trim() !== "") {
                          updateSetting('notifications.emailNotifications', true);
                          updateSetting('notifications.emailAddress', email.trim());
                          alert(`Email saved: ${email.trim()}`);
                        } else {
                          alert("Email is required to enable notifications.");
                          updateSetting('notifications.emailNotifications', false);
                        }
                      } else {
                        updateSetting('notifications.emailNotifications', false);
                        updateSetting('notifications.emailAddress', '');
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications.pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Sound Alerts</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Play sound for important notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.soundEnabled}
                    onCheckedChange={(checked) => updateSetting('notifications.soundEnabled', checked)}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={testNotification} variant="outline">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Notification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Settings */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Control how your data is stored and managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto Save</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically save changes as you work
                    </p>
                  </div>
                  <Switch
                    checked={settings.data.autoSave}
                    onCheckedChange={(checked) => updateSetting('data.autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Data Retention</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      How long to keep historical data (days)
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{settings.data.dataRetention} days</span>
                    <Slider
                      value={[settings.data.dataRetention]}
                      onValueChange={([value]) => updateSetting('data.dataRetention', value)}
                      max={365}
                      min={7}
                      step={7}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Cache Enabled</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cache data locally for faster loading
                    </p>
                  </div>
                  <Switch
                    checked={settings.data.cacheEnabled}
                    onCheckedChange={(checked) => updateSetting('data.cacheEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Offline Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow limited functionality when offline
                    </p>
                  </div>
                  <Switch
                    checked={settings.data.offlineMode}
                    onCheckedChange={(checked) => updateSetting('data.offlineMode', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Data Operations</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={exportSettings} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Settings
                    </Button>
                    
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importSettings}
                        className="hidden"
                        id="import-settings"
                      />
                      <Button asChild variant="outline" className="flex items-center gap-2 w-full">
                        <label htmlFor="import-settings" className="cursor-pointer">
                          <Upload className="h-4 w-4" />
                          Import Settings
                        </label>
                      </Button>
                    </div>
                    
                    <Button
                      onClick={() => setShowClearDataConfirm(true)}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage security settings and data privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Session Timeout</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically log out after inactivity (minutes)
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{settings.security.sessionTimeout}min</span>
                    <Slider
                      value={[settings.security.sessionTimeout]}
                      onValueChange={([value]) => updateSetting('security.sessionTimeout', value)}
                      max={240}
                      min={15}
                      step={15}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSetting('security.twoFactorAuth', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Data Encryption</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Encrypt sensitive data in local storage
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.dataEncryption}
                    onCheckedChange={(checked) => updateSetting('security.dataEncryption', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Audit Log</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Keep a log of important system actions
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.auditLog}
                    onCheckedChange={(checked) => updateSetting('security.auditLog', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Optimization
              </CardTitle>
              <CardDescription>
                Optimize application performance and resource usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Animation Speed</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Control the speed of UI animations
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{settings.performance.animationSpeed}x</span>
                    <Slider
                      value={[settings.performance.animationSpeed]}
                      onValueChange={([value]) => updateSetting('performance.animationSpeed', value)}
                      max={3}
                      min={0.5}
                      step={0.5}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Maximum Records</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Limit the number of records displayed at once
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{settings.performance.maxRecords}</span>
                    <Slider
                      value={[settings.performance.maxRecords]}
                      onValueChange={([value]) => updateSetting('performance.maxRecords', value)}
                      max={5000}
                      min={100}
                      step={100}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Preload Data</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Load data in advance for faster navigation
                    </p>
                  </div>
                  <Switch
                    checked={settings.performance.preloadData}
                    onCheckedChange={(checked) => updateSetting('performance.preloadData', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Compression</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Compress data to reduce storage usage
                    </p>
                  </div>
                  <Switch
                    checked={settings.performance.compressionEnabled}
                    onCheckedChange={(checked) => updateSetting('performance.compressionEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                System Preferences
              </CardTitle>
              <CardDescription>
                Configure system-wide preferences and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Language</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Select your preferred language
                    </p>
                  </div>
                  <Select
                    value={language}
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                      <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Timezone</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set your local timezone
                    </p>
                  </div>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting('timezone', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-lg font-medium">System Actions</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => setShowResetConfirm(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reload Application
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Reset Settings
              </CardTitle>
              <CardDescription>
                Are you sure you want to reset all settings to default values? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                onClick={resetSettings}
                variant="destructive"
                className="flex-1"
              >
                Reset Settings
              </Button>
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showClearDataConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Clear All Data
              </CardTitle>
              <CardDescription>
                This will permanently delete all your data including uploaded files, settings, and preferences. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                onClick={clearAllData}
                variant="destructive"
                className="flex-1"
              >
                Clear All Data
              </Button>
              <Button
                onClick={() => setShowClearDataConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;