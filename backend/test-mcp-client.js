import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  ListToolsResultSchema,
  CallToolResultSchema
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';

const testMcp = async () => {
  const mcpPath = path.resolve('../mcp/mcpServer.js');
  console.log('Spawning MCP Server at:', mcpPath);

  const transport = new StdioClientTransport({
    command: 'node',
    args: [mcpPath]
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('Connected to MCP server!');

  // Test List Tools
  const toolsResponse = await client.request({
    method: 'tools/list'
  }, ListToolsResultSchema);
  console.log('Available Tools:', toolsResponse.tools.map(t => t.name));

  // Test Call Text Tool
  const callResponse = await client.request({
    method: 'tools/call',
    params: {
      name: 'TextAnalysisTool',
      arguments: { text: 'Congratulations lottery winner claim prize' }
    }
  }, CallToolResultSchema);
  console.log('Tool Call Response:', callResponse.content[0].text);

  await transport.close();
  console.log('Transport closed successfully!');
};

testMcp().catch(err => {
  console.error('Test client failed:', err);
  process.exit(1);
});
