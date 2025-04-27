import fetch from 'node-fetch';

async function testWorkoutGeneration() {
  try {
    const response = await fetch('http://localhost:3002/api/generate-workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: 25,
        height: 170,
        weight: 80,
        gender: 'male',
        goal: 'weight-loss',
        fitnessLevel: 'beginner',
        daysPerWeek: '3'
      })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorkoutGeneration(); 