async function listModels() {
  const apiKey = 'AIzaSyClEKe33-2pyfSBOjEJEKcywrl7inMzkXg';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

listModels();

