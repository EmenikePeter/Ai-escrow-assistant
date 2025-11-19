import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn('[OpenAI] OPENAI_API_KEY environment variable is not set. AI features will fail until it is configured.');
}

const openaiClient = apiKey ? new OpenAI({ apiKey }) : null;

async function createChatCompletion({ model = 'gpt-3.5-turbo', messages, maxTokens = 512, logScope }) {
  if (!openaiClient) {
    throw new Error('OpenAI client is not configured. Set OPENAI_API_KEY in the server environment.');
  }
  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
    });
    return response?.choices?.[0]?.message?.content || JSON.stringify(response);
  } catch (error) {
    const status = error?.status ?? 'unknown';
    const message = error?.error?.message || error?.message || 'OpenAI request failed';
    const details = error?.error || error;
    if (logScope) {
      console.error(`[OpenAI ${logScope}] Error:`, details);
    } else {
      console.error('[OpenAI] Error:', details);
    }
    throw new Error(`OpenAI API error: ${status} ${message}`.trim());
  }
}

// Summarization: Summarize contract in plain language
export async function summarizeContract(contractText, options = {}) {
  const promptText = `Summarize this contract in plain language for a non-lawyer.\n\nContract:\n${contractText}`;
  return createChatCompletion({
    model: options.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: promptText }],
    maxTokens: 512,
    logScope: 'summarizeContract',
  });
}

// Legal Review Mode: Review contract for legal risks
export async function legalReview(contractText, options = {}) {
  const promptText = `You are a legal expert. Review the following contract for legal risks and suggest improvements.\n\nContract:\n${contractText}\n\nRespond with a list of risks and clear suggestions.`;
  return createChatCompletion({
    model: options.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: promptText }],
    maxTokens: 512,
    logScope: 'legalReview',
  });
}

export function buildClausePrompt({ title, description, amount, deadline, requirements = '', tone = 'formal', language = 'English', includeDispute = false }) {
  let prompt = `You are a legal expert. Write a clear, enforceable escrow contract clause for the following project.\n`;
  prompt += `Project Title: ${title}\n`;
  prompt += `Description: ${description}\n`;
  prompt += `Amount (USD): ${amount}\n`;
  prompt += `Deadline: ${deadline}\n`;
  if (requirements) {
    prompt += `Additional requirements: ${requirements}\n`;
  }
  prompt += `Write a concise clause suitable for a professional contract. Use ${tone} language.\n`;
  prompt += `Include payment terms, completion criteria, and dispute resolution steps.\n`;
  if (includeDispute) {
    prompt += `Also include a dispute resolution clause.\n`;
  }
  prompt += `Write the clause in ${language}.`;
  return prompt;
}

export async function query(inputs) {
  const {
    title,
    description,
    amount,
    deadline,
    requirements = '',
    tone = 'formal',
    language = 'English',
    includeDispute = false,
    numClauses = 1
  } = typeof inputs === 'object' ? inputs : {};
  const clauses = [];
  for (let i = 0; i < numClauses; i += 1) {
    const promptText = buildClausePrompt({ title, description, amount, deadline, requirements, tone, language, includeDispute });
    // eslint-disable-next-line no-await-in-loop
    const clause = await createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: promptText }],
      maxTokens: 512,
      logScope: `query#${i + 1}`,
    });
    clauses.push(clause);
  }
  return clauses;
}

// Example usage:
// query('Generate 1 professional escrow contract clause for the following project:\nTitle: Clean up\nDescription: To clean up a single bedroom, kitchen and bathroom')
//   .then(response => {
//   });

export async function generateDisputeClause(contractText, options = {}) {
  const promptText = `Write a dispute resolution clause for this contract.\nRespond in ${options.language || 'English'}.\n\nContract:\n${contractText}`;
  return createChatCompletion({
    model: options.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: promptText }],
    maxTokens: 512,
    logScope: 'generateDisputeClause',
  });
}

export async function aiChat(messages, options = {}) {
  return createChatCompletion({
    model: options.model || 'gpt-3.5-turbo',
    messages,
    maxTokens: 512,
    logScope: 'aiChat',
  });
}

