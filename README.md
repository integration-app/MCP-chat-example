# AI Chat Agent Example

This is a template for an application showcasing integration capabilities using [Integration.app](https://integration.app). The app is built with Next.js and demonstrates how to implement user authentication and  token generation, as well as an AI-powered chat agent that can use tools from an MCP server.

## Prerequisites

- Node.js 18+ installed
- Integration.app workspace credentials (Workspace Key and Secret)
- LLM Credentials (Key and Model/Provider Name)
- MCP Server access (See [here](https://github.com/integration-app/mcp-server) to run MCP Server)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/integration-app/MCP-chat-example
cd MCP-chat-example
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
# Copy the sample environment file
cp .env-sample .env
```

4. Edit `.env` and add your Integration.app credentials and LLM API keys:

```env
INTEGRATION_APP_WORKSPACE_KEY=YOUR_KEY_HERE
INTEGRATION_APP_WORKSPACE_SECRET=YOUR_SECRET_HERE
OPENAI_API_KEY=YOUR_KEY_HERE
ANTHROPIC_API_KEY=YOUR_KEY_HERE
LLM_PROVIDER=openai # or anthropic
LLM_MODEL=gpt-4o # or your preferred model name
```

You can find these credentials in your Integration.app workspace settings.

## Running the Application

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app` - Next.js app router pages and API routes
  - `/integrations` - Integration connection UI
  - `/chat` - AI chat agent page (uses MCP tools)
  - `/tools` - List of available MCP tools
  - `/api` - Backend API routes for integration token and tool listing
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and helpers (including MCP agent logic)
- `/public` - Static assets

### Authentication

The template implements a simple authentication mechanism using a randomly generated UUID as the customer ID. This simulates a real-world scenario where your application can authentication users to provide the agent access to tools in their own personal accounts on external apps. The customer ID is used to:

- Identify the user/customer in the Integration.app workspace
- Generate integration app tokens for external app connections

### AI Chat Agent

The chat agent uses the latest LangChain and LangGraph libraries to connect to an MCP server and invoke tools from connected integrations. You can control the LLM provider and model via environment variables.

---
