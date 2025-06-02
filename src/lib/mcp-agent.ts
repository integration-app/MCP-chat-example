import { generateIntegrationToken } from './integration-token';
import type { AuthCustomer } from './auth';

async function getLangchainDeps() {
  const { MultiServerMCPClient } = await import('@langchain/mcp-adapters');
  const { ChatOpenAI } = await import('@langchain/openai');
  const { ChatAnthropic } = await import('@langchain/anthropic');
  const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
  return { MultiServerMCPClient, ChatOpenAI, ChatAnthropic, createReactAgent };
}

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export async function invokeMCPAgent({
  auth,
  message,
  llmProvider = process.env.LLM_PROVIDER || 'anthropic',
  modelName = process.env.LLM_MODEL || 'claude-3-opus-20240229',
}: {
  auth: AuthCustomer,
  message: string,
  llmProvider?: string,
  modelName?: string,
}): Promise<string> {
  const { MultiServerMCPClient, ChatOpenAI, ChatAnthropic, createReactAgent } = await getLangchainDeps();
  const token = await generateIntegrationToken(auth);

  // Choose LLM
  let llm;
  if (llmProvider === 'anthropic') {
    llm = new ChatAnthropic({
      modelName,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  } else {
    llm = new ChatOpenAI({
      modelName,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Setup MCP client with dynamic token (SSE transport)
  const mcpServers = {
    main: {
      url: `http://localhost:3000/sse?token=${token}`,
      transport: 'sse' as const,
    },
  };
  const client = new MultiServerMCPClient(mcpServers);
  const tools = await client.getTools();
  // Pass tools directly to createReactAgent (they are already Runnables)
  const agent = createReactAgent({ llm, tools });

  const response = await agent.invoke({
    messages: [{ role: 'user', content: message }],
  });
  const lastMessage = response.messages[response.messages.length - 1];
  let messageContent = '';
  if (isString((lastMessage as { content: unknown }).content)) {
    messageContent = (lastMessage as { content: string }).content;
  } else if (Array.isArray((lastMessage as { content: unknown }).content)) {
    // If content is an array, join all string parts
    messageContent = ((lastMessage as { content: unknown[] }).content).map((c) => (isString(c) ? c : '')).join(' ');
  } else {
    messageContent = '';
  }
  // Remove <thinking>...</thinking> if present
  const cleanResponse = messageContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
  await client.close();
  return cleanResponse;
}

export async function getAvailableMcpTools(auth: AuthCustomer) {
  const { MultiServerMCPClient } = await getLangchainDeps();
  const token = await generateIntegrationToken(auth);
  const mcpServers = {
    main: {
      url: `https://mcp-sse-03ad87b9bdee.herokuapp.com/sse?token=${token}`,
      transport: 'sse' as const,
    },
  };
  const client = new MultiServerMCPClient(mcpServers);
  const tools = await client.getTools();
  await client.close();

  // Group tools by connection/source
  const grouped: Record<string, { name: string; description: string }[]> = {};
  for (const t of tools as unknown[]) {
    // Extract connection/source
    let connection = 'Other';
    const toolObj = t as { name: string; description?: string };
    const match = toolObj.name.match(/mcp__main__(.*?)--/);
    if (match && match[1]) {
      connection = match[1].replace(/-/g, ' ');
      connection = connection.charAt(0).toUpperCase() + connection.slice(1);
    } else if (toolObj.name.toLowerCase().includes('salesforce')) {
      connection = 'Salesforce';
    } else if (toolObj.name.toLowerCase().includes('hubspot')) {
      connection = 'HubSpot';
    } else if (toolObj.name.toLowerCase().includes('notion')) {
      connection = 'Notion';
    }
    if (!grouped[connection]) grouped[connection] = [];
    // Clean up tool name: extract only the action (e.g., 'create contact')
    let cleanName = '';
    const actionMatch = toolObj.name.match(/--([a-z0-9_-]+)$/i);
    if (actionMatch && actionMatch[1]) {
      cleanName = actionMatch[1].replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
    } else if (toolObj.description) {
      // Fallback: use the part after the colon if the description starts with the connection name
      const descParts = toolObj.description.split(':');
      if (descParts.length > 1 && descParts[0].toLowerCase().includes(connection.toLowerCase())) {
        cleanName = descParts.slice(1).join(':').trim();
      } else {
        cleanName = descParts[0].trim();
      }
    } else {
      cleanName = toolObj.name;
    }
    // Remove connection name from the start if present
    cleanName = cleanName.replace(new RegExp('^' + connection + '\s*', 'i'), '').trim();
    // Capitalize each word
    cleanName = cleanName.replace(/\b\w/g, c => c.toUpperCase());
    grouped[connection].push({
      name: cleanName,
      description: toolObj.description || ''
    });
  }
  return grouped;
} 