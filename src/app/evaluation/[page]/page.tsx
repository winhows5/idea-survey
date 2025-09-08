'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SurveyLayout from '../../../components/SurveyLayout';

interface Idea {
  text: string;
  originalNumber: number;
  displayIndex: number;
}

interface Selections {
  [originalNumber: number]: boolean;
}

const SOURCES = ['DBGNN', 'UFGC', 'COT', 'ZERO', 'VALIDATION'];
const PROGRESS_VALUES = [42, 56, 70, 84, 100];

// Helper function to shuffle array
const shuffleArray = (array: string[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to get or create randomized source order
const getSourceOrder = () => {
  const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
  
  // If pageOrder doesn't exist or is empty, create a randomized order
  if (!surveyState.pageOrder || surveyState.pageOrder.length === 0) {
    const randomizedSources = shuffleArray(SOURCES);
    surveyState.pageOrder = randomizedSources;
    localStorage.setItem('surveyState', JSON.stringify(surveyState));
    return randomizedSources;
  }
  
  return surveyState.pageOrder;
};

export default function EvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const pageNumber = parseInt(params.page as string);
  
  // Get randomized source order
  const sourceOrder = getSourceOrder();
  const sourceIndex = pageNumber - 1;
  const source = sourceOrder[sourceIndex];
  const progress = PROGRESS_VALUES[sourceIndex];
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selections, setSelections] = useState<Selections>({});
  const [noneSelected, setNoneSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [evaluatedApp, setEvaluatedApp] = useState('');
  const [appName, setAppName] = useState('');

  useEffect(() => {
    loadIdeas();
  }, [pageNumber]);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get survey state
      const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
      const appId = surveyState.evaluatedApp;
      
      if (!appId && source !== 'VALIDATION') {
        setError('No app selected for evaluation. Please restart the survey.');
        return;
      }
      
      setEvaluatedApp(appId);
      
      // Get app name from API
      if (appId && source !== 'VALIDATION') {
        const appsResponse = await fetch('/api/apps');
        const appsData = await appsResponse.json();
        if (appsData.success) {
          const app = appsData.apps.find((a: any) => a.app_id === appId);
          setAppName(app?.app_name || appId);
        }
      }
      
      // Fetch ideas from API
      const url = source === 'VALIDATION' 
        ? `/api/ideas?source=${source}&appId=NA`
        : `/api/ideas?source=${source}&appId=${appId}`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load ideas');
      }
      
      // Convert ideas to numbered format with original numbers preserved
      const formattedIdeas: Idea[] = data.ideas.map((idea: {text: string, originalNumber: number}, displayIndex: number) => ({
        text: idea.text,
        originalNumber: idea.originalNumber,
        displayIndex
      }));
      
      setIdeas(formattedIdeas);
      
      // Load existing selections if any
      const existingSelections = surveyState.evaluations?.[source] || [];
      const selectionsObj: Selections = {};
      
      // Convert from idea numbers back to boolean selections
      if (Array.isArray(existingSelections) && existingSelections.length > 0) {
        // Check if it's the new format (array of numbers) or old format (boolean array)
        if (typeof existingSelections[0] === 'number') {
          // New format: array of original idea numbers
          existingSelections.forEach((originalNumber: number) => {
            selectionsObj[originalNumber] = true;
          });
        } else {
          // Old format: boolean array (for backward compatibility)
          existingSelections.forEach((selected: boolean, index: number) => {
            // Convert old format to new format using display index + 1
            if (selected && formattedIdeas[index]) {
              selectionsObj[formattedIdeas[index].originalNumber] = true;
            }
          });
        }
      }
      
      setSelections(selectionsObj);
      
      // Check if "none" was previously selected
      const noneWasSelected = surveyState.evaluations?.[source + '_none'] || false;
      setNoneSelected(noneWasSelected);
      
    } catch (error) {
      console.error('Error loading ideas:', error);
      setError('Failed to load ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaToggle = (originalNumber: number) => {
    if (noneSelected) {
      setNoneSelected(false);
    }
    
    setSelections(prev => ({
      ...prev,
      [originalNumber]: !prev[originalNumber]
    }));
  };

  const handleNoneToggle = () => {
    if (!noneSelected) {
      // Clear all idea selections when "none" is selected
      setSelections({});
    }
    setNoneSelected(!noneSelected);
  };

  const validateForm = (): boolean => {
    const hasSelections = Object.values(selections).some(selected => selected) || noneSelected;
    if (!hasSelections) {
      setError('Please select at least one feature or "None of the above"');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update survey state
      const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
      
      // Get selected original idea numbers or 0 for "None of above"
      let selectedIdeaNumbers: number[] = [];
      
      if (noneSelected) {
        // If "None of above" is selected, save as [0]
        selectedIdeaNumbers = [0];
      } else {
        // Otherwise, get selected original idea numbers
        Object.entries(selections).forEach(([originalNumber, selected]) => {
          if (selected) {
            selectedIdeaNumbers.push(parseInt(originalNumber));
          }
        });
      }
      
      // Update evaluations for this source
      if (!surveyState.evaluations) {
        surveyState.evaluations = {
          DBGNN: [],
          UFGC: [],
          COT: [],
          ZERO: [],
          VALIDATION: [],
          DBGNN_none: false,
          UFGC_none: false,
          COT_none: false,
          ZERO_none: false,
          VALIDATION_none: false
        };
      }
      
      // Save selected idea numbers (or [0] for none)
      surveyState.evaluations[source] = selectedIdeaNumbers;
      surveyState.evaluations[source + '_none'] = noneSelected;
      surveyState.timestamp = new Date().toISOString();
      
      localStorage.setItem('surveyState', JSON.stringify(surveyState));
      
      // Navigate to next page or completion
      if (pageNumber < 5) {
        router.push(`/evaluation/${pageNumber + 1}`);
      } else {
        // All evaluations complete, go to completion page
        router.push('/complete');
      }
      
    } catch (error) {
      console.error('Error saving selections:', error);
      setError('Failed to save selections. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (pageNumber > 1) {
      router.push(`/evaluation/${pageNumber - 1}`);
    } else {
      router.push('/frequency');
    }
  };

  if (loading) {
    return (
      <SurveyLayout title="Loading" progress={progress}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading ideas...</span>
        </div>
      </SurveyLayout>
    );
  }

  if (error && ideas.length === 0) {
    return (
      <SurveyLayout title="" progress={progress}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadIdeas}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </SurveyLayout>
    );
  }

  const selectedCount = Object.values(selections).filter(Boolean).length;

  return (
    <SurveyLayout title="Idea Evaluation" progress={progress}>
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-800 font-medium">
            
              Below are 10 new features proposed for <span className="font-bold text-red-600">{appName}</span>, the mobile app. Please evaluate each idea, and SELECT ALL that you think you would use in the app. Do NOT select any features that are already available in the app.
            
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selections[idea.originalNumber] || false}
                  onChange={() => handleIdeaToggle(idea.originalNumber)}
                  disabled={noneSelected}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div className="flex-1">
                  {/* <h3 className="font-medium text-gray-900 mb-2">
                    Feature {index + 1}
                  </h3> */}
                  <p className="text-gray-700 leading-relaxed">{idea.text}</p>
                </div>
              </label>
            </div>
          ))}
          
          {/* None of the above option */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noneSelected}
                onChange={handleNoneToggle}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  None of the above
                </h3>
                {/* <p className="text-gray-600 text-sm">
                  I would not use any of these features
                </p> */}
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={handleBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">
              Page {pageNumber} of 5 • {noneSelected ? 'None selected' : `${selectedCount} feature${selectedCount !== 1 ? 's' : ''} selected`}
            </div>
          </div>
          
          <button
            onClick={handleNext}
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : (pageNumber < 5 ? 'Next Page' : 'Complete Survey')}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}