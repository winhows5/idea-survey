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

const SOURCES = ['SOURCE1', 'SOURCE2', 'SOURCE3', 'SOURCE4', 'SOURCE5', 'SOURCE6', 'SOURCE7', 'SOURCE8', 'SOURCE9', 'SOURCE10', 'VALIDATION'];
const NON_VALIDATION_SOURCES = ['SOURCE1', 'SOURCE2', 'SOURCE3', 'SOURCE4', 'SOURCE5', 'SOURCE6', 'SOURCE7', 'SOURCE8', 'SOURCE9', 'SOURCE10'];
const PROGRESS_VALUES = [56, 70, 84, 100];

// Helper function to shuffle array
const shuffleArray = (array: string[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to get or create randomized source order (3 random + validation)
const getSourceOrder = async (appId: string): Promise<string[]> => {
  // Check if we're in the browser environment
  if (typeof window === 'undefined') {
    console.log('Running on server, returning default SOURCES order');
    return ['SOURCE1', 'SOURCE2', 'SOURCE3', 'VALIDATION']; // Return default order on server
  }
  
  const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
  
  // If pageOrder doesn't exist or is empty, create a randomized order
  if (!surveyState.pageOrder || surveyState.pageOrder.length === 0) {
    try {
      // Fetch available sources for this app
      const response = await fetch(`/api/sources?appId=${appId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available sources');
      }
      
      const data = await response.json();
      const availableSources = data.sources || [];
      
      // Randomly select 3 sources from available sources
      const shuffledAvailable = shuffleArray(availableSources);
      const selectedSources = shuffledAvailable.slice(0, Math.min(3, availableSources.length));
      
      // Add validation source and shuffle the final order
      const finalSources = shuffleArray([...selectedSources, 'VALIDATION']);
      
      // Store both the page order and which sources were selected/unselected
      surveyState.pageOrder = finalSources;
      surveyState.selectedSources = finalSources;
      surveyState.unselectedSources = availableSources.filter((source: string) => !selectedSources.includes(source));
      
      localStorage.setItem('surveyState', JSON.stringify(surveyState));
      return finalSources;
    } catch (error) {
      console.error('Error fetching available sources, using fallback:', error);
      // Fallback to default sources if API fails
      const fallbackSources = ['SOURCE1', 'SOURCE2', 'SOURCE3', 'VALIDATION'];
      surveyState.pageOrder = fallbackSources;
      surveyState.selectedSources = fallbackSources;
      surveyState.unselectedSources = [];
      localStorage.setItem('surveyState', JSON.stringify(surveyState));
      return fallbackSources;
    }
  }
  
  return surveyState.pageOrder;
};

export default function EvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const pageNumber = parseInt(params.page as string);
  
  const [sourceOrder, setSourceOrder] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selections, setSelections] = useState<Selections>({});
  const [noneSelected, setNoneSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [evaluatedApp, setEvaluatedApp] = useState('');
  const [appName, setAppName] = useState('');
  const [surveyType, setSurveyType] = useState<string>('intent');

  const sourceIndex = pageNumber - 1;
  const source = sourceOrder[sourceIndex];
  const progress = PROGRESS_VALUES[sourceIndex];

  // Function to get intro text based on survey type
  const getIntroText = (appName: string, surveyType: string) => {
    const baseText = (
      <>
        Below are 10 new features proposed for <span className="font-bold text-red-600">{appName}</span>. Please evaluate each idea, and SELECT ALL that you think
      </>
    );
    
    switch (surveyType) {
      case 'intent':
        return <>{baseText} you would use in the app.</>;
      case 'usefulness':
        return <>{baseText} are useful (i.e., potentially beneficial or helpful).</>;
      case 'originality':
        return <>{baseText} are original (novel, different).</>;
      default:
        return <>{baseText} you would use in the app.</>;
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true);
        
        // Get survey state from localStorage
        const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
        const evaluatedAppId = surveyState.evaluatedApp;
        setSurveyType(surveyState.surveyType || 'intent');
        
        if (!evaluatedAppId) {
          console.error('No evaluated app found in survey state');
          router.push('/select');
          return;
        }
        
        setEvaluatedApp(evaluatedAppId);
        
        // Get source order (this will fetch available sources if needed)
        const sources = await getSourceOrder(evaluatedAppId);
        setSourceOrder(sources);
        
        console.log(`Evaluation Page ${pageNumber} - Source order: [${sources.join(', ')}]`);
        
        // Get the current source for this page
        const currentSource = sources[sourceIndex];
        if (!currentSource) {
          console.error('No source found for page', pageNumber);
          router.push('/complete');
          return;
        }
        
        console.log(`Evaluation Page ${pageNumber} - Current source: ${currentSource}, Progress: ${progress}%`);
        
        // Fetch ideas for this source and app
        const response = await fetch(`/api/ideas?appId=${evaluatedAppId}&source=${currentSource}`);
        if (!response.ok) {
          throw new Error('Failed to fetch ideas');
        }
        
        const data = await response.json();
        setIdeas(data.ideas || []);
        setAppName(data.appName || evaluatedAppId);
        
        // Load previous selections if they exist
        const previousSelections = surveyState.evaluations?.[currentSource] || [];
        const noneWasSelected = previousSelections.length === 1 && previousSelections[0] === 0;
        
        if (noneWasSelected) {
          setNoneSelected(true);
        } else if (previousSelections.length > 0 && previousSelections[0] !== -1) {
          // Convert array back to selections object
          const selectionsObj: Selections = {};
          previousSelections.forEach((ideaNumber: number) => {
            if (ideaNumber > 0) {
              selectionsObj[ideaNumber] = true;
            }
          });
          setSelections(selectionsObj);
        }
        
      } catch (error) {
        console.error('Error loading page data:', error);
        setError('Failed to load ideas. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [pageNumber, router, sourceIndex]);

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
        console.log(`Evaluation Page ${pageNumber} - User selected ideas: [${selectedIdeaNumbers.join(', ')}]`);
      }
      
      // Update evaluations for this source
      if (!surveyState.evaluations) {
        // Initialize evaluations object with all possible sources set to [-1]
        surveyState.evaluations = {};
        SOURCES.forEach(src => {
          surveyState.evaluations[src] = [-1];
        });
      }
      
      // Save selected idea numbers (or [0] for none)
      surveyState.evaluations[source] = selectedIdeaNumbers;
      surveyState.timestamp = new Date().toISOString();
      
      // Navigate to next page or completion
      if (pageNumber < 4) {
        localStorage.setItem('surveyState', JSON.stringify(surveyState));
        router.push(`/evaluation/${pageNumber + 1}`);
      } else {
        // All evaluations complete, set [-1] for unselected sources
        const unselectedSources = surveyState.unselectedSources || [];
        unselectedSources.forEach((unselectedSource: string) => {
          surveyState.evaluations[unselectedSource] = [-1];
        });
        
        localStorage.setItem('surveyState', JSON.stringify(surveyState));
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
      <SurveyLayout progress={progress} title={`Feature Evaluation - Page ${pageNumber} of 4`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SurveyLayout>
    );
  }

  const selectedCount = Object.values(selections).filter(Boolean).length;

  return (
    <SurveyLayout progress={progress} title={``}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            {getIntroText(appName, surveyType)}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {ideas.map((idea) => (
            <div key={idea.originalNumber} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                    Feature {idea.displayIndex}
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
              Page {pageNumber} of 4 • {noneSelected ? 'None selected' : `${selectedCount} feature${selectedCount !== 1 ? 's' : ''} selected`}
            </div>
          </div>
          
          <button
            onClick={handleNext}
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : (pageNumber < 4 ? 'Next Page' : 'Complete Survey')}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}