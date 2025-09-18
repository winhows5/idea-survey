// Simple test script to verify the logging API endpoint
const testLogging = async () => {
  try {
    console.log('Testing logging API endpoint...');
    
    const testLogData = {
      type: 'test_redirect_error',
      message: 'Test redirect failure',
      surveyType: 'intent',
      redirectUrl: 'https://example.com/test',
      error: 'Test error message',
      stack: 'Test stack trace'
    };

    const response = await fetch('http://localhost:3000/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLogData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Logging test successful:', result);
      
      // Test retrieving logs
      const getResponse = await fetch('http://localhost:3000/api/logs');
      const logs = await getResponse.json();
      console.log('📋 Recent logs:', logs);
      
    } else {
      console.error('❌ Logging test failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testLogging();