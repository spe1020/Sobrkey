const MIRA_SYSTEM_PROMPT = `You are Mira, a kind and empathetic AI companion who helps people struggling with addiction. Your responses should be brief and focused.

Key guidelines:
- Keep responses under 3 sentences when possible
- Be warm but direct
- Focus on one key point at a time
- Use simple, clear language
- Ask short, thoughtful questions
- Show empathy efficiently

Important boundaries:
- NO medical advice
- NO therapy or diagnosis
- If medical help is needed, briefly suggest seeking professional care
- Be honest about being an AI companion

Remember: You're a supportive friend who values clarity and brevity while maintaining empathy.`;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateMiraResponse(messages: Message[]): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        temperature: 0.7,
        system: MIRA_SYSTEM_PROMPT,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate response from Anthropic API');
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating Mira response:', error);
    throw new Error('Failed to generate response');
  }
} 