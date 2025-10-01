'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurveyLayout from '../../components/SurveyLayout';

interface App {
  app_id: string;
  app_name: string;
}

export default function SelectPage() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNoneSelected, setShowNoneSelected] = useState(false);

  const loadRandomApps = async () => {
    try {
      setLoading(true);
      // Request 20 random apps from the backend
      const response = await fetch('/api/apps?random=true&count=20');
      const data = await response.json();

      if (data.success) {
        setApps(data.apps);
      } else {
        console.error('Failed to load apps:', data.error);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRandomApps();
  }, []);

  const handleAppToggle = (appId: string) => {
    setSelectedApps(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
    setShowNoneSelected(false);
  };

  const handleNoneSelected = () => {
    if (selectedApps.length === 0) {
      setShowNoneSelected(true);
      // Reload with new random apps
      loadRandomApps();
    } else {
      // Clear all selections
      setSelectedApps([]);
    }
  };

  const handleNext = () => {
    if (selectedApps.length === 0) {
      setShowNoneSelected(true);
      return;
    }
  
    setSubmitting(true);
    
    try {
      // Get existing survey state and update it
      const existingSurveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
      
      // Get full app objects for selected apps
      const selectedAppObjects = apps.filter(app => selectedApps.includes(app.app_id));
      
      const updatedSurveyState = {
        ...existingSurveyState,
        selectedApps: selectedApps, // Keep array of IDs for backward compatibility
        selectedAppObjects: selectedAppObjects, // Store full app objects
        evaluatedApp: selectedApps[Math.floor(Math.random() * selectedApps.length)],
        timestamp: new Date().toISOString()
      };
      
      console.log('Storing survey state:', updatedSurveyState);
      localStorage.setItem('surveyState', JSON.stringify(updatedSurveyState));
      
      // Small delay to ensure localStorage write completes
      setTimeout(() => {
        router.push('/frequency');
      }, 100);
      
    } catch (error) {
      console.error('Error storing survey state:', error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SurveyLayout title="Loading" progress={14}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading apps...</span>
        </div>
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout title="" progress={14}>
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-800 font-medium text-lg">
            Please select ALL the mobile apps below that you currently use or have used within the past 6 months.
          </p>
        </div>

        {showNoneSelected && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-yellow-800">
              We've loaded a new set for you to choose from.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <label
              key={app.app_id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedApps.includes(app.app_id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedApps.includes(app.app_id)}
                onChange={() => handleAppToggle(app.app_id)}
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-900 font-medium">{app.app_name}</span>
            </label>
          ))}
        </div>

        <div className="border-t pt-6">
          <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={false}
              onChange={handleNoneSelected}
              className="h-5 w-5 text-gray-600 rounded border-gray-300 focus:ring-gray-500"
            />
            <span className="ml-3 text-gray-700 font-medium">None of the above</span>
          </label>
        </div>

        <div className="flex justify-between items-center pt-6">
          <div className="text-sm text-gray-600">
            {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} selected
          </div>
          
          <button
            onClick={handleNext}
            disabled={submitting}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
              selectedApps.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Processing...' : 'Next'}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}