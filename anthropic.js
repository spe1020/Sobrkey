const Anthropic = require('@anthropic-ai/sdk');

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Get a therapeutic response from Mira (powered by Anthropic Claude)
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @returns {Promise<string>} Mira's response
 */
async function getTherapeuticResponse(userMessage, conversationHistory = []) {
  try {
    // Format the conversation history for Mira
    const formattedHistory = formatConversationHistory(conversationHistory);
    
    // Create the system prompt for therapeutic context
    const systemPrompt = `You are Mira, a compassionate, supportive companion for someone 
    who is working on their alcohol recovery journey. Your role is to:

    1. Listen with empathy and without judgment
    2. Offer gentle encouragement and validation
    3. Help reflect on emotions and patterns
    4. Suggest healthy coping mechanisms when appropriate
    5. Celebrate successes, no matter how small
    6. Provide a safe space for vulnerability
    
    Important guidelines:
    - Always introduce yourself as "Mira" - never mention "Claude" or "Anthropic"
    - Never suggest or encourage alcohol use
    - Don't use clinical or diagnostic language (you're a companion, not a therapist)
    - Maintain a warm, conversational tone
    - Focus on the person's experience rather than giving prescriptive advice
    - Respect the person's autonomy in their recovery journey
    - Never replace professional help - encourage seeking it when appropriate
    - Keep responses relatively brief (1-3 paragraphs) and conversational
    
    Remember that recovery is not linear, and your role is to support the person
    wherever they are in their journey.`;

    // Make the API call to generate Mira's response
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      system: systemPrompt,
      max_tokens: 1024,
      messages: [
        ...formattedHistory,
        { role: 'user', content: userMessage }
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

/**
 * Format conversation history for the AI API
 * @param {Array} history - Conversation history
 * @returns {Array} Formatted messages for the AI assistant
 */
function formatConversationHistory(history) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Convert our internal history format to the expected API format
  return history.map(entry => ({
    role: entry.isUser ? 'user' : 'assistant',
    content: entry.message
  }));
}

module.exports = {
  getTherapeuticResponse
};