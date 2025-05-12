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

// Serve static files
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Choose LLM based on env
const llmProvider = process.env.LLM_PROVIDER || "openai";
const modelName = process.env.LLM_MODEL || (llmProvider === "anthropic" ? "claude-3-sonnet-20240229" : "gpt-4o");

let model;
if (llmProvider === "anthropic") {
  model = new ChatAnthropic({
    modelName,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
  });
} else {
  model = new ChatOpenAI({
    modelName,
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
  });
}

// MCP server config (edit as needed)
const mcpServers = {
  main: {
    transport: "sse",
    url: "https://mcp-sse-03ad87b9bdee.herokuapp.com/sse?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWE4ZDk1YzIxOWRiNWVjNjJjOTQ3NCIsImlzcyI6ImY4OGY1MmJjLTU3YTktNDdlMy05M2IzLTg0M2ZhMGRkNTcwOCIsImV4cCI6MTc3NTEzNDg3MH0.440grQgTeHaENfkMPwAAgb-4Cyd2sdraQG3q1njy4kc",
  },
  // Add more servers here if needed
};

const client = new MultiServerMCPClient({ mcpServers });

let agent;
let tools;

async function setupAgent() {
  tools = await client.getTools();
  agent = createReactAgent({ llm: model, tools });
}

// Setup agent on startup
setupAgent().then(() => {
  console.log("Agent and MCP tools ready.");
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });
  try {
    const response = await agent.invoke({
      messages: [{ role: "user", content: message }],
    });
    // Extract the message content and clean it up
    const messageContent = response.messages[response.messages.length - 1].content;
    // Remove the thinking process if present
    const cleanResponse = messageContent.replace(/<thinking>.*?<\/thinking>/s, '').trim();
    res.json({ response: cleanResponse });
  } catch (e) {
    res.status(500).json({ error: e.message || e.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await client.close();
  process.exit();
}); 