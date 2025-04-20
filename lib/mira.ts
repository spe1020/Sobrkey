export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithMira(messages: Message[]): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error('Failed to chat with Mira');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error chatting with Mira:', error);
    throw new Error('Sorry, I had trouble responding. Please try again.');
  }
} 