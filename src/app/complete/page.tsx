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
  const [surveyType, setSurveyType] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const hasAttemptedSubmission = useRef(false);

  // Redirect URLs based on survey type
  const redirectUrls = {
    intent: 'https://app.prolific.com/submissions/complete?cc=C18WUNLX',
    usefulness: 'https://app.prolific.com',
    originality: 'https://app.prolific.com',
    intent_student: 'https://smeal.qualtrics.com/jfe/form/SV_85FcguoLuL36f3v',
    usefulness_student: 'https://smeal.qualtrics.com/jfe/form/SV_85FcguoLuL36f3v',
    originality_student: 'https://smeal.qualtrics.com/jfe/form/SV_85FcguoLuL36f3v'
  };

  // Function to log errors to server
  const logToServer = async (logData: {
    type: string;
    message: string;
    surveyType?: string;
    redirectUrl?: string;
    error?: string;
    stack?: string;
  }) => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (serverLogError) {
      // Fallback to console if server logging fails
      console.error('Failed to log to server:', serverLogError);
      console.error('Original log data:', logData);
    }
  };

  useEffect(() => {
    // Get survey type from localStorage
    const surveyState = JSON.parse(localStorage.getItem('surveyState') || '{}');
    setSurveyType(surveyState.surveyType || 'intent');
    
    // Only submit once when component mounts
    if (!hasAttemptedSubmission.current) {
      hasAttemptedSubmission.current = true;
      submitSurveyData();
    }
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Start redirect timer after successful submission
    if (submitted && surveyType) {
      console.log('Starting redirect for survey type:', surveyType);
      setRedirecting(true);
      
      const redirectUrl = redirectUrls[surveyType as keyof typeof redirectUrls] || redirectUrls.intent;
      console.log('Redirect URL:', redirectUrl);
      
      const timer = setTimeout(async () => {
        try {
          console.log('Executing redirect to:', redirectUrl);
          window.location.href = redirectUrl;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown redirect error';
          
          // Log to server instead of just console
          await logToServer({
            type: 'redirect_error',
            message: 'Automatic redirect failed',
            surveyType,
            redirectUrl,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Try fallback redirect method
          try {
            window.open(redirectUrl, '_self');
          } catch (fallbackError) {
            const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
            
            await logToServer({
              type: 'redirect_fallback_error',
              message: 'Fallback redirect also failed',
              surveyType,
              redirectUrl,
              error: fallbackErrorMessage,
              stack: fallbackError instanceof Error ? fallbackError.stack : undefined
            });
          }
        }
      }, 1000);

      return () => {
        console.log('Cleaning up redirect timer');
        clearTimeout(timer);
      };
    }
  }, [submitted, surveyType]); // Removed redirectUrls and redirecting from dependencies

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
      console.log('Survey state:', surveyState);
      
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
      console.log('Submit result:', result);
      
      if (result.success) {
        setResponseId(result.responseId);
        setSubmitted(true);
        console.log('Submission successful, setting submitted to true');
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

  const handleManualRedirect = async () => {
    const redirectUrl = redirectUrls[surveyType as keyof typeof redirectUrls] || redirectUrls.intent;
    console.log('Manual redirect to:', redirectUrl);
    
    try {
      window.location.href = redirectUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown manual redirect error';
      
      // Log to server
      await logToServer({
        type: 'manual_redirect_error',
        message: 'Manual redirect failed',
        surveyType,
        redirectUrl,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Try fallback method
      try {
        window.open(redirectUrl, '_self');
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown manual fallback error';
        
        await logToServer({
          type: 'manual_redirect_fallback_error',
          message: 'Manual fallback redirect also failed',
          surveyType,
          redirectUrl,
          error: fallbackErrorMessage,
          stack: fallbackError instanceof Error ? fallbackError.stack : undefined
        });
        
        alert('Redirect failed. Please manually navigate to: ' + redirectUrl);
      }
    }
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
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
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
        
        {submitted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-800 font-medium">
                  {redirecting ? 'Redirecting automatically in a moment...' : 'Preparing redirect...'}
                </p>
              </div>
              
              <div className="border-t border-blue-200 pt-3">
                <button
                  onClick={handleManualRedirect}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Click here to redirect manually
                </button>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-gray-500">
          Thank you for your participation in our research.
        </p>
      </div>
    </SurveyLayout>
  );
}