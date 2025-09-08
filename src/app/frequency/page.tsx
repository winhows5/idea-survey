'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurveyLayout from '../../components/SurveyLayout';

interface App {
  app_id: string;
  app_name: string;
}

interface FrequencyData {
  [appId: string]: string;
}

export default function FrequencyPage() {
  const router = useRouter();
  const [evaluatedApp, setEvaluatedApp] = useState<App | null>(null);
  const [prolificId, setProlificId] = useState('');
  const [frequency, setFrequency] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{prolificId?: string; frequency?: string}>({});
  const [debugInfo, setDebugInfo] = useState('');

  const frequencyOptions = [
    { value: 'daily', label: 'Daily (at least once a day)' },
    { value: 'weekly', label: 'Weekly (at least once a week, but not daily)' },
    { value: 'monthly', label: 'Monthly (at least once a month, but not weekly)' },
    { value: 'yearly', label: 'Yearly or less (a few times a year or less often)' }
  ];

  useEffect(() => {
    // Get familiar apps from localStorage (set by familiarity page)
    const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
    const selectedAppIds = surveyState.selectedApps || [];
    
    // Debug info
    setDebugInfo(`Survey state: ${JSON.stringify(surveyState)}, Selected apps: ${selectedAppIds.length}`);
    console.log('Survey state from localStorage:', surveyState);
    console.log('Selected app IDs:', selectedAppIds);
    
    if (selectedAppIds.length === 0) {
      // If no familiar apps, redirect back to select page
      console.log('No selected apps found, redirecting to select page');
      router.push('/select');
      return;
    }

    // Load app details for familiar apps from API
    loadFamiliarApps(selectedAppIds);
  }, [router]);

  const loadFamiliarApps = async (appIds: string[]) => {
    try {
      setLoading(true);
      console.log('Loading familiar apps for IDs:', appIds);
      
      // Fetch all apps from API
      const response = await fetch('/api/apps');
      const data = await response.json();
      
      console.log('API response:', data);
      
      if (data.success) {
        // Filter to only include familiar apps
        const familiar = data.apps.filter((app: App) => appIds.includes(app.app_id));
        console.log('Filtered familiar apps:', familiar);
        
        // Randomly choose one familiar app for evaluation
        const randomIndex = Math.floor(Math.random() * familiar.length);
        const selectedApp = familiar[randomIndex];
        console.log('Randomly selected app for evaluation:', selectedApp);
        
        // Update survey state with the randomly selected app
        const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
        surveyState.evaluatedApp = selectedApp.app_id;
        localStorage.setItem('surveyState', JSON.stringify(surveyState));
        
        setEvaluatedApp(selectedApp);
      } else {
        console.error('Failed to load apps:', data.error);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    setFrequency(frequency);
    
    // Clear frequency error if it exists
    if (errors.frequency) {
      setErrors(prev => ({ ...prev, frequency: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {prolificId?: string; frequency?: string} = {};
    
    // Validate Prolific ID
    if (!prolificId.trim()) {
      newErrors.prolificId = 'Prolific ID is required';
    } else if (prolificId.trim().length < 3) {
      newErrors.prolificId = 'Prolific ID must be at least 3 characters';
    }
    
    // Validate frequency is selected
    if (!frequency) {
      newErrors.frequency = 'Please select usage frequency for the app';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update survey state with frequency data
      const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
      surveyState.prolificId = prolificId.trim();
      surveyState.frequencies = { [evaluatedApp!.app_id]: frequency };
      surveyState.timestamp = new Date().toISOString();
      
      localStorage.setItem('surveyState', JSON.stringify(surveyState));
      
      // Navigate to evaluation pages
      router.push('/evaluation/1');
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SurveyLayout title="Loading" progress={28}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading your familiar apps...</span>
        </div>
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout title="" progress={28}>
      <div className="space-y-6">
        {/* <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-800 font-medium">
            Please provide your Prolific ID and indicate how frequently you use each of the apps you marked as familiar.
          </p>
        </div> */}

        {/* Prolific ID Section */}
        <div className="space-y-3">
          <label htmlFor="prolificId" className="block text-lg font-medium text-gray-900">
            Please enter your Prolific ID below: 
          </label>
          <input
            type="text"
            id="prolificId"
            value={prolificId}
            onChange={(e) => {
              setProlificId(e.target.value);
              if (errors.prolificId) {
                setErrors(prev => ({ ...prev, prolificId: undefined }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.prolificId ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your Prolific ID"
          />
          {errors.prolificId && (
            <p className="text-sm text-red-600">{errors.prolificId}</p>
          )}
        </div>

        {/* Usage Frequency Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">

          </h2>
          <p className="text-gray-600">
            Before we begin, please tell us how often you use <span className="font-bold text-red-600">{evaluatedApp?.app_name || 'the selected app'}</span>, the mobile app.
          </p>
          
          {errors.frequency && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.frequency}</p>
            </div>
          )}

          {!evaluatedApp ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                No app selected. Please go back to the previous page.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">{evaluatedApp.app_name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-3">
                {frequencyOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      frequency === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={option.value}
                      checked={frequency === option.value}
                      onChange={() => handleFrequencyChange(option.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={() => router.push('/select')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          
          <div className="text-sm text-gray-500">
            Step 2 of 7
          </div>
          
          <button
            onClick={handleNext}
            disabled={submitting || !evaluatedApp}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Continue to Evaluation'}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}