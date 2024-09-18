'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// 不需要自定义 ExtendedCoreMessage，因为 CoreMessage 已经支持了我们需要的结构

export async function continueConversation(messages: CoreMessage[], model: string) {
  'use server';

  const result = await streamText({
    model: openai(model || 'gpt-4o'), 
    messages
  });

  const stream = createStreamableValue(result.textStream);
  return { message: stream.value };
}