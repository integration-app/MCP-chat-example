import express from "express";
import dotenv from "dotenv";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the static directory
app.use('/static', express.static(join(__dirname, 'static')));

// Serve chat interface at root
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Choose LLM based on env
const llmProvider = process.env.LLM_PROVIDER || "anthropic";
const modelName = process.env.LLM_MODEL || "claude-3-opus-20240229";

let llm;
if (llmProvider === "anthropic") {
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

let client;
let agent;
let tools;

// Remove all dynamic token handling and always use the static token for MCP connections
const STATIC_MCP_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWE4ZDk1YzIxOWRiNWVjNjJjOTQ3NCIsImlzcyI6ImY4OGY1MmJjLTU3YTktNDdlMy05M2IzLTg0M2ZhMGRkNTcwOCIsImV4cCI6MTc3ODY5ODk4OX0.C4AZGitgYexhwxMqJ-2DUp9nUr0IJXfsIaFK50ccY1Q";

async function setupAgent() {
  // Configure MCP server with the static token
  const mcpServers = {
    main: {
      transport: "sse",
      url: `https://mcp-sse-03ad87b9bdee.herokuapp.com/sse?token=${encodeURIComponent(STATIC_MCP_TOKEN)}`,
    },
  };

  console.log('Connecting to MCP server...');
  
  client = new MultiServerMCPClient({ mcpServers });
  tools = await client.getTools();
  
  // Helper function to transform property names
  const transformPropertyNames = (schema) => {
    if (!schema?.properties) return schema;
    
    const transformedProperties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      // Convert spaces to underscores and ensure valid characters
      const validKey = key.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 64);
      transformedProperties[validKey] = value;
    }
    schema.properties = transformedProperties;
    return schema;
  };

  // Transform tool schemas to ensure they match the required pattern
  const transformedTools = tools.map(tool => {
    const transformedTool = { ...tool };
    
    // Transform the main schema
    if (transformedTool.schema) {
      transformedTool.schema = transformPropertyNames(transformedTool.schema);
    }
    
    // Transform the schema in lc_kwargs
    if (transformedTool.lc_kwargs?.schema) {
      transformedTool.lc_kwargs.schema = transformPropertyNames(transformedTool.lc_kwargs.schema);
    }
    
    return transformedTool;
  });

  console.log('Transformed tools:', JSON.stringify(transformedTools, null, 2));
  agent = createReactAgent({ llm: llm, tools: transformedTools });
}

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Setup or update agent with the static token
    await setupAgent();

    // Process the message with the agent
    const response = await agent.invoke({
      messages: [{ role: "user", content: message }],
    });

    // Extract the message content and clean it up
    const messageContent = response.messages[response.messages.length - 1].content;
    // Remove the thinking process if present
    const cleanResponse = messageContent.replace(/<thinking>.*?<\/thinking>/s, '').trim();

    res.json({ response: cleanResponse });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to get available tools, grouped by connection/source
app.get('/tools', async (req, res) => {
  try {
    if (!tools) {
      await setupAgent();
    }
    // Group tools by connection/source
    const grouped = {};
    for (const t of tools) {
      // Extract connection/source
      let connection = 'Other';
      const match = t.name.match(/mcp__main__(.*?)--/);
      if (match && match[1]) {
        connection = match[1].replace(/-/g, ' ');
        connection = connection.charAt(0).toUpperCase() + connection.slice(1);
      } else if (t.name.toLowerCase().includes('salesforce')) {
        connection = 'Salesforce';
      } else if (t.name.toLowerCase().includes('hubspot')) {
        connection = 'HubSpot';
      } else if (t.name.toLowerCase().includes('notion')) {
        connection = 'Notion';
      }
      if (!grouped[connection]) grouped[connection] = [];
      // Clean up tool name: extract only the action (e.g., 'create contact')
      let cleanName = '';
      const actionMatch = t.name.match(/--([a-z0-9_-]+)$/i);
      if (actionMatch && actionMatch[1]) {
        cleanName = actionMatch[1].replace(/[_-]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
      } else if (t.description) {
        // Fallback: use the part after the colon if the description starts with the connection name
        const descParts = t.description.split(':');
        if (descParts.length > 1 && descParts[0].toLowerCase().includes(connection.toLowerCase())) {
          cleanName = descParts.slice(1).join(':').trim();
        } else {
          cleanName = descParts[0].trim();
        }
      } else {
        cleanName = t.name;
      }
      // Remove connection name from the start if present
      cleanName = cleanName.replace(new RegExp('^' + connection + '\s*', 'i'), '').trim();
      // Capitalize each word
      cleanName = cleanName.replace(/\b\w/g, c => c.toUpperCase());
      grouped[connection].push({
        name: cleanName,
        description: t.description || ''
      });
    }
    res.json({ tools: grouped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  if (client) {
    await client.close();
  }
  process.exit();
}); 