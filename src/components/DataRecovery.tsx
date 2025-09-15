import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Download, Upload, RotateCcw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { emergencySyncToGitHub } from '../utils/data-persistence';

interface DataRecoveryProps {
  onRecoveryComplete?: () => void;
}

export const DataRecovery: React.FC<DataRecoveryProps> = ({ onRecoveryComplete }) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'success' | 'error' | 'partial'>('idle');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryDetails, setRecoveryDetails] = useState<any>(null);

  const handleEmergencyRecovery = async () => {
    setIsRecovering(true);
    setRecoveryStatus('idle');
    setRecoveryMessage('Starting emergency recovery...');

    try {
      const results = await emergencySyncToGitHub();
      
      const successCount = Object.values(results).filter(Boolean).length;
      const totalCount = Object.keys(results).length;
      
      if (successCount === totalCount) {
        setRecoveryStatus('success');
        setRecoveryMessage('✅ Emergency recovery completed successfully! All data sources synced.');
      } else if (successCount > 0) {
        setRecoveryStatus('partial');
        setRecoveryMessage(`⚠️ Partial recovery completed. ${successCount}/${totalCount} data sources synced.`);
      } else {
        setRecoveryStatus('error');
        setRecoveryMessage('❌ Emergency recovery failed. No data sources could be synced.');
      }
      
      setRecoveryDetails(results);
      
      if (onRecoveryComplete) {
        onRecoveryComplete();
      }
    } catch (error) {
      setRecoveryStatus('error');
      setRecoveryMessage(`❌ Emergency recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Emergency recovery error:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        products: JSON.parse(localStorage.getItem('products') || '[]'),
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        highlights: JSON.parse(localStorage.getItem('highlights') || '[]'),
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setRecoveryMessage('✅ Data exported successfully!');
    } catch (error) {
      setRecoveryMessage(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
        if (data.orders) localStorage.setItem('orders', JSON.stringify(data.orders));
        if (data.highlights) localStorage.setItem('highlights', JSON.stringify(data.highlights));
        
        setRecoveryMessage('✅ Data imported successfully! Please refresh the page.');
        
        if (onRecoveryComplete) {
          onRecoveryComplete();
        }
      } catch (error) {
        setRecoveryMessage(`❌ Import failed: ${error instanceof Error ? error.message : 'Invalid file format'}`);
      }
    };
    
    reader.readAsText(file);
  };

  const getStatusIcon = () => {
    switch (recoveryStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-6 w-6" />
          Data Recovery & Backup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recoveryMessage && (
          <Alert className={recoveryStatus === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <AlertDescription className={recoveryStatus === 'error' ? 'text-red-800' : 'text-green-800'}>
                {recoveryMessage}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {recoveryDetails && (
          <div className="text-sm space-y-1">
            <p className="font-medium">Recovery Details:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className={recoveryDetails.products ? 'text-green-600' : 'text-red-600'}>
                Products: {recoveryDetails.products ? '✅ Synced' : '❌ Failed'}
              </li>
              <li className={recoveryDetails.orders ? 'text-green-600' : 'text-red-600'}>
                Orders: {recoveryDetails.orders ? '✅ Synced' : '❌ Failed'}
              </li>
              <li className={recoveryDetails.highlights ? 'text-green-600' : 'text-red-600'}>
                Highlights: {recoveryDetails.highlights ? '✅ Synced' : '❌ Failed'}
              </li>
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handleEmergencyRecovery}
            disabled={isRecovering}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isRecovering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Recovering...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Emergency Recovery
              </>
            )}
          </Button>

          <Button
            onClick={handleExportData}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 w-full"
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </div>
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Emergency Recovery:</strong> Attempts to sync local data to GitHub</p>
          <p><strong>Export Data:</strong> Downloads a backup of all local data</p>
          <p><strong>Import Data:</strong> Restores data from a backup file</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataRecovery;
