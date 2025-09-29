import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ExportButton } from '../components/export/ExportButton';
import { ExportHistory } from '../components/export/ExportHistory';
import { QuickExport } from '../components/export/QuickExport';
import { Download, History, Zap, Settings } from 'lucide-react';

export const Export: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Data Export Center
              </h1>
              <p className="text-gray-600">
                Export your KMRL train scheduling data in multiple formats
              </p>
            </div>
            <ExportButton size="lg" />
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="quick" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Export
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Export History
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-6">
            <QuickExport />
            
            <Card>
              <CardHeader>
                <CardTitle>Export Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                      <Download className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium mb-2">Multiple Formats</h3>
                    <p className="text-sm text-gray-600">
                      Export data in JSON, CSV, or Excel formats
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                      <Settings className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium mb-2">Flexible Options</h3>
                    <p className="text-sm text-gray-600">
                      Filter by date range and include metadata
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                      <History className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium mb-2">Export History</h3>
                    <p className="text-sm text-gray-600">
                      Track and re-download previous exports
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <ExportHistory />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Batch Export</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Export multiple data types simultaneously with custom configurations.
                      </p>
                      <ExportButton variant="outline" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Scheduled Exports</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Set up automated exports to run at specified intervals.
                      </p>
                      <ExportButton variant="outline" />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-3">Export Templates</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Save frequently used export configurations as templates for quick access.
                    </p>
                    <div className="flex space-x-3">
                      <ExportButton variant="outline" />
                      <ExportButton variant="ghost" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};