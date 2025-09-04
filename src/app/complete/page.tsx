'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SurveyLayout from '../../components/SurveyLayout';

export default function CompletePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [responseId, setResponseId] = useState('');
  const hasAttemptedSubmission = useRef(false);

  useEffect(() => {
    // Only submit once when component mounts
    if (!hasAttemptedSubmission.current) {
      hasAttemptedSubmission.current = true;
      submitSurveyData();
    }
  }, []); // Empty dependency array - only run once on mount

  const submitSurveyData = async () => {
    // Prevent multiple simultaneous submissions
    if (submitting || submitted) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Get all survey data from localStorage
      const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
      
      // Add start time if not present
      if (!surveyState.startTime) {
        surveyState.startTime = new Date().toISOString();
      }
      
      // Submit to API
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyState)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResponseId(result.responseId);
        setSubmitted(true);
        // Clear localStorage after successful submission
        localStorage.removeItem('surveyState');
      } else {
        throw new Error(result.error || 'Failed to submit survey');
      }
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    // Reset the ref to allow retry
    hasAttemptedSubmission.current = false;
    submitSurveyData();
  };

  const handleRestart = () => {
    localStorage.removeItem('surveyState');
    router.push('/');
  };

  if (submitting) {
    return (
      <SurveyLayout title="Submitting Survey" progress={100}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitting Your Responses</h2>
          <p className="text-gray-600">Please wait while we save your survey data...</p>
        </div>
      </SurveyLayout>
    );
  }

  if (error) {
    return (
      <SurveyLayout title="Submission Error" progress={100}>
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Submission Failed</h2>
          <p className="text-gray-600 mb-6">There was an error submitting your survey:</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleRestart}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Restart Survey
            </button>
          </div>
        </div>
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout title="Survey Complete" progress={100}>
      <div className="text-center py-12">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
        <p className="text-lg text-gray-600 mb-6">
          Your survey responses have been successfully submitted.
        </p>
        
        {responseId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">Response ID:</p>
            <p className="text-green-700 font-mono text-sm">{responseId}</p>
          </div>
        )}
        
        <p className="text-gray-500 mb-8">
          You can now close this window or return to the beginning.
        </p>
        
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start New Survey
        </button>
      </div>
    </SurveyLayout>
  );
}