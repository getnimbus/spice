# spice MCP Server

A Model Context Protocol server for Solana blockchain data

This is a TypeScript-based MCP server that implements a Solana data query system. It demonstrates core MCP concepts by providing:

- Resources representing Solana catalog metadata
- Tools for querying Solana blockchain data via Flipside API
- Prompts for SQL query examples

## Features

### Resources
- Access Solana catalog metadata via `catalog:///` URIs
- Each catalog contains structured metadata about Solana data tables
- JSON format for easy parsing and exploration

### Tools
- `solana_query` - Query Solana blockchain data
  - Takes SQL query as a required parameter
  - Executes queries against Flipside API
  - Returns results in JSON format

### Prompts
- `solana_sql_examples` - Provides example SQL queries for Solana data analysis
  - Includes sample queries for common use cases
  - Helps users understand how to query Solana data effectively

## Development

### Prerequisites
- Node.js and npm/yarn
- Flipside API key (get one at https://flipsidecrypto.xyz/)

### Setup
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Copy `.env.example` to `.env` and add your Flipside API key:
```bash
cp .env.example .env
```
4. Edit `.env` and set `FLIPSIDE_API_KEY` to your actual API key

### Building
Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spice": {
      "command": "node",
      "env": {
        "FLIPSIDE_API_KEY": "your_flipside_api_key_here"
      },
      "args": [
        "/absolute/path/to/build/index.js"
      ]
    }
  }
}
```

Replace `/absolute/path/to/build/index.js` with the actual path to the built index.js file on your system.

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Example Queries

Here are some example SQL queries you can run with the `solana_query` tool:

```sql
-- Get volume of swaps for last 24 hours
SELECT SUM(SWAP_FROM_AMOUNT) AS volume 
FROM SOLANA.defi.fact_swaps 
WHERE block_timestamp > NOW() - INTERVAL '24 hours' 
AND SUCCEEDED = TRUE
```

## Resources

- [Flipside Crypto Documentation](https://docs.flipsidecrypto.com/)
- [Solana Models on GitHub](https://github.com/FlipsideCrypto/solana-models)
- [Model Context Protocol](https://modelcontextprotocol.ai/)
