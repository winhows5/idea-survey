'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isStarting, setIsStarting] = useState(false);
  const [surveyType, setSurveyType] = useState<string>('intent'); // default to intent
  const [isDirectVisit, setIsDirectVisit] = useState(false);
  
  useEffect(() => {
    // Get survey type from URL parameters
    const typeParam = searchParams.get('type');
    if (typeParam && ['intent', 'usefulness', 'originality', 'intent_student', 'usefulness_student', 'originality_student'].includes(typeParam)) {
      setSurveyType(typeParam);
      setIsDirectVisit(false);
    } else {
      // User visited directly without survey type parameter
      setIsDirectVisit(true);
    }
  }, [searchParams]);
  
  const handleStart = (surveyType: string) => {
    const responseId = uuidv4();
    const startDate = new Date().toISOString();
    
    // Store in localStorage for survey state management
    localStorage.setItem('surveyState', JSON.stringify({
      responseId,
      startDate,
      surveyType, // Store the survey type
      selectedApps: [],
      evaluatedApp: '',
      prolificId: '',
      familiarity: 0,
      evaluations: {
        SOURCE1: [],
        SOURCE2: [],
        SOURCE3: [],
        SOURCE4: [],
        SOURCE5: [],
        VALIDATION: []
      },
      pageOrder: [],
      currentPage: 0
    }));
    
    router.push('/select');
  };

  const handleStartSurvey = () => {
    setIsStarting(true);
    handleStart(surveyType);
  };

  // Show warning message for direct visits
  if (isDirectVisit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-500">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Access Not Available
            </h1>
            
            <div className="text-left space-y-4 mb-8">
              <p className="text-lg text-gray-700">
                This survey is not accessible through direct navigation.
              </p>
              
              <p className="text-lg text-gray-700">
                Please use the survey link provided to you by the research team or survey administrator.
              </p>
              
              <p className="text-sm text-gray-500 mt-6">
                If you believe you have reached this page in error, please contact the survey administrator for assistance.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Mobile App Feature Survey
          </h1>
          
          <p className="text-lg text-gray-600 mb-4 leading-relaxed text-left">
            Thank you for participating in our survey! In this survey, you will see 4 groups of proposed new mobile app features. Your task is to help us evaluate these ideas based on your experience. Please note that some ideas may include features that the surveyed mobile app already offers.
          </p>
          
          <p className="text-lg text-red-600 font-bold mb-8 text-left">
            If a feature already exists in the surveyed mobile app, please do not select it.
          </p>
          
          <button
            onClick={handleStartSurvey}
            disabled={isStarting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            {isStarting ? 'Starting Survey...' : 'Start Survey'}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            By participating, you consent to the use of your responses for research purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
