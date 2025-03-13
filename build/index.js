#!/usr/bin/env node
/**
 * This is a template MCP server that implements a Solana data query system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing Solana catalog metadata as resources
 * - Reading catalog data
 * - Querying Solana data via Flipside API
 * - Providing SQL query examples via prompts
 */
import dotenv from "dotenv";
dotenv.config();
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import solanaCatalog from "./resources/solana/defi_swap.json" with { type: "json" };
import { Flipside } from "@flipsidecrypto/sdk";
export const flipside = new Flipside(process.env.FLIPSIDE_API_KEY, "https://api-v2.flipsidecrypto.xyz");
const server = new Server({
    name: "spice",
    version: "0.1.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
// all metadata get from here https://github.com/FlipsideCrypto/solana-models
const catalogs = {
    "1": {
        title: "solana_defi_swap_metadata",
        data: JSON.stringify(solanaCatalog),
    },
};
/**
 * Handler for listing available catalogs as resources.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: Object.entries(catalogs).map(([id, catalog]) => ({
            uri: `catalog:///${id}`,
            mimeType: "text/plain",
            name: catalog.title,
            description: `A catalog metadata of ${catalog.title}`,
        })),
    };
});
/**
 * Handler for reading the contents of a specific catalog.
 * Takes a catalog:// URI and returns the catalog data as plain text.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const id = url.pathname.replace(/^\//, "");
    const catalog = catalogs[id];
    if (!catalog) {
        throw new Error(`Catalog ${id} not found`);
    }
    return {
        contents: [
            {
                uri: request.params.uri,
                mimeType: "application/json",
                text: catalog.data,
            },
        ],
    };
});
/**
 * Handler that lists available tools.
 * Exposes a solana_query tool that lets clients query Solana data.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "solana_query",
                description: "Query solana data",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Sql query",
                        },
                    },
                    required: ["query"],
                },
            },
        ],
    };
});
/**
 * Handler for the solana_query tool.
 * Executes SQL queries against Solana data via Flipside API.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case "solana_query": {
            try {
                const query = String(request.params.arguments?.query);
                if (!query) {
                    throw new Error("Query is required");
                }
                const queryResultSet = await flipside.query.run({ sql: query });
                let currentPageNumber = 1;
                let pageSize = 100;
                let totalPages = 2;
                let allRows = [];
                while (currentPageNumber <= totalPages) {
                    let results = await flipside.query.getQueryResults({
                        queryRunId: queryResultSet.queryId,
                        pageNumber: currentPageNumber,
                        pageSize: pageSize,
                    });
                    if (results.error) {
                        throw results.error;
                    }
                    totalPages = results.page?.totalPages ?? 0;
                    allRows = [...allRows, ...results.records];
                    currentPageNumber += 1;
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(allRows)
                        },
                    ],
                };
            }
            catch (err) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            // @ts-ignore
                            text: `Error: ${err?.message}`
                        }
                    ]
                };
            }
        }
        default:
            throw new Error("Unknown tool");
    }
});
/**
 * Handler that lists available prompts.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: "solana_sql_examples",
                description: "Example SQL queries for Solana blockchain data analysis",
            },
        ],
    };
});
/**
 * Handler for the solana query prompt.
 * Returns a prompt that requests template how to read solana catalog data.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name !== "solana_sql_examples") {
        throw new Error("Unknown prompt");
    }
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: "Get volume of swaps for last 24 hours",
                },
            },
            {
                role: "assistant",
                content: {
                    type: "text",
                    text: "SELECT SUM(SWAP_FROM_AMOUNT) AS volume FROM SOLANA.defi.fact_swaps WHERE block_timestamp > NOW() - INTERVAL '24 hours' AND SUCCEEDED = TRUE",
                },
            },
        ],
    };
});
/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map