// Summarization: Summarize contract in plain language
export async function summarizeContract(contractText, options = {}) {
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const promptText = `Summarize this contract in plain language for a non-lawyer.\n\nContract:\n${contractText}`;
  const openaiPayload = {
    model: options.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: promptText }],
    max_tokens: 512,
  };
  const responseObj = await fetch(openaiUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(openaiPayload),
  });
  if (!responseObj.ok) {
    const errorText = await responseObj.text();
    console.error('[OpenAI summarizeContract] Error:', errorText);
    throw new Error(`OpenAI API error: ${responseObj.status} ${responseObj.statusText}. Body: ${errorText}`);
  }
  const resultObj = await responseObj.json();
  return resultObj.choices[0].message.content || JSON.stringify(resultObj);
}

// Legal Review Mode: Review contract for legal risks
export async function legalReview(contractText, options = {}) {
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const promptText = `You are a legal expert. Review the following contract for legal risks and suggest improvements.\n\nContract:\n${contractText}\n\nRespond with a list of risks and clear suggestions.`;
  const openaiPayload = {
    model: options.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: promptText }],
    max_tokens: 512,
  };
  const responseObj = await fetch(openaiUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(openaiPayload),
  });
  if (!responseObj.ok) {
    const errorText = await responseObj.text();
    console.error('[OpenAI legalReview] Error:', errorText);
    throw new Error(`OpenAI API error: ${responseObj.status} ${responseObj.statusText}. Body: ${errorText}`);
  }
  const resultObj = await responseObj.json();
  return resultObj.choices[0].message.content || JSON.stringify(resultObj);
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
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const clauses = [];
  for (let i = 0; i < numClauses; i++) {
    const promptText = buildClausePrompt({ title, description, amount, deadline, requirements, tone, language, includeDispute });
    const openaiPayload = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: promptText }],
      max_tokens: 512,
    };
    // eslint-disable-next-line no-await-in-loop
    const responseObj = await fetch(openaiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      method: 'POST',
      body: JSON.stringify(openaiPayload),
    });
    if (!responseObj.ok) {
      const errorText = await responseObj.text();
      console.error(`[OpenAI query] Error #${i+1}:`, errorText);
      throw new Error(`OpenAI API error: ${responseObj.status} ${responseObj.statusText}. Body: ${errorText}`);
    }
    const resultObj = await responseObj.json();
    if (resultObj && resultObj.choices && resultObj.choices[0].message.content) {
      clauses.push(resultObj.choices[0].message.content);
    } else {
      clauses.push(JSON.stringify(resultObj));
    }
  }
  return clauses;
}

// Example usage:
// query('Generate 1 professional escrow contract clause for the following project:\nTitle: Clean up\nDescription: To clean up a single bedroom, kitchen and bathroom')
//   .then(response => {
//   });

export async function generateDisputeClause(contractText, options = {}) {
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const promptText = `Write a dispute resolution clause for this contract.\nRespond in ${options.language || 'English'}.\n\nContract:\n${contractText}`;
  const openaiPayload = {
    model: options.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: promptText }],
    max_tokens: 512,
  };
  const responseObj = await fetch(openaiUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(openaiPayload),
  });
  if (!responseObj.ok) {
    const errorText = await responseObj.text();
    console.error('[OpenAI generateDisputeClause] Error:', errorText);
    throw new Error(`OpenAI API error: ${responseObj.status} ${responseObj.statusText}. Body: ${errorText}`);
  }
  const resultObj = await responseObj.json();
  return resultObj.choices[0].message.content || JSON.stringify(resultObj);
}

export async function aiChat(messages, options = {}) {
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const openaiPayload = {
    model: options.model || 'gpt-3.5-turbo',
    messages,
    max_tokens: 512,
  };
  const responseObj = await fetch(openaiUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(openaiPayload),
  });
  if (!responseObj.ok) {
    const errorText = await responseObj.text();
    console.error('[OpenAI aiChat] Error:', errorText);
    throw new Error(`OpenAI API error: ${responseObj.status} ${responseObj.statusText}. Body: ${errorText}`);
  }
  const resultObj = await responseObj.json();
  return resultObj.choices[0].message.content || JSON.stringify(resultObj);
}

