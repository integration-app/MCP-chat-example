# AI Chat Agent (Example MCP Client)

This project provides a chat interface that connects to an MCP (Model Control Protocol) SSE server, allowing you to interact with AI models through a user-friendly web interface. The agent uses Anthropic's Claude as the underlying language model and can access tools provided by your MCP server.

See here for instructions to implement a remote Integration App MCP Server:
- Remote MCP Server (SSE or Streamable HTTP)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm (comes with Node.js)
- An MCP server running and accessible 
- An Anthropic API key (for Claude 3 Sonnet)

## Installation

1. Clone this repository:
```bash
git clone <your-repository-url>
cd MCP-chat-example
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
ANTHROPIC_API_KEY= your_anthropic_key
OPENAI_API_KEY= your_openai_key #backup to Anthropic
LLM_PROVIDER=anthropic 
LLM_MODEL=claude-3-opus-20240229   #or preferred model
```

### Agent Architecture
The agent is built using Langchain's graph-based architecture:
1. **Input Processing**: User messages are processed through the chat interface
2. **Tool Selection**: The agent uses Langgraph to determine which MCP tools to use
3. **Execution**: Selected tools are executed through the MCP adapter
4. **Response Generation**: The LLM generates responses based on tool outputs

### MCP Integration
The project uses the Langchain MCP adapter to:
- Connect to your MCP server
- Discover available tools
- Execute tool calls
- Handle streaming responses

## Configuration

### MCP Server Connection

The agent is configured to connect to your MCP server. You can specify the MCP server URL in two ways:

1. Through the `.env` file:
```env
MCP_SERVER_URL=http://your-mcp-server:port
```

2. Or by modifying the `agent.js` file directly:
```javascript
const mcpAdapter = new MCPAdapter({
    serverUrl: "http://your-mcp-server:port"
});
```

### LLM Configuration
You can configure the LLM provider and model in the `.env` file:
```env
LLM_PROVIDER=anthropic  # or 'openai'
LLM_MODEL=claude-3-opus-20240229  # or your preferred model
```

## Running the Application

1. Start the server:
```bash
node agent.js
```

2. Open your web browser and navigate to:
```
http://localhost:3000
```

## Features

- Real-time chat interface with AI models
- Integration with MCP server tools and capabilities
- Support for Claude LLM
- Web-based user interface for easy interaction
- Flexible LLM provider selection (Anthropic/OpenAI)
- Graph-based agent architecture for complex reasoning

## Project Structure

- `agent.js` - Main server file that handles the MCP connection and chat logic
- `index.html` - Web interface for the chat application
- `package.json` - Project dependencies and configuration
- `static/` - Directory containing static assets

## Troubleshooting

If you encounter any issues:

1. Ensure your MCP server is running and accessible
2. Verify your Anthropic API key is valid
3. Check that all environment variables are properly set
4. Ensure you're using a compatible Node.js version
5. Verify Langchain dependencies are properly installed
6. Check the console for any MCP connection errors
