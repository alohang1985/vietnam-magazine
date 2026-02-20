export async function callGeminiAPI(prompt) {
  // 가상의 제미나이 API 호출 예시
  return new Promise((resolve) => {
    setTimeout(() => resolve(`Gemini response to: ${prompt}`), 1000);
  });
}

export async function callChatGPTAPI(prompt) {
  // 가상의 챗GPT API 호출 예시
  return new Promise((resolve) => {
    setTimeout(() => resolve(`ChatGPT response to: ${prompt}`), 1200);
  });
}

export async function callCloudAIAPI(prompt) {
  // 가상의 클라우드 AI API 호출 예시
  return new Promise((resolve) => {
    setTimeout(() => resolve(`Cloud AI response to: ${prompt}`), 1100);
  });
}
