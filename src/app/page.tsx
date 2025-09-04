'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  
  const handleStartSurvey = () => {
    setIsStarting(true);
    
    // Generate unique response ID and store start time
    const responseId = uuidv4();
    const startDate = new Date().toISOString();
    
    // Store in localStorage for survey state management
    localStorage.setItem('surveyState', JSON.stringify({
      responseId,
      startDate,
      selectedApps: [],
      evaluatedApp: '',
      prolificId: '',
      familiarity: 0,
      evaluations: {
        DBGNN: [],
        UFGC: [],
        COT: [],
        ZERO: [],
        VALIDATION: []
      },
      pageOrder: [],
      currentPage: 0
    }));
    
    router.push('/familiarity');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Mobile App Feature Survey
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Welcome to our research survey about mobile app features. This survey will take approximately 
            <strong> 10-15 minutes</strong> to complete.
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
