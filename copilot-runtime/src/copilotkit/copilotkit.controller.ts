import { All, Controller, Req, Res } from '@nestjs/common';
import {
  CopilotRuntime,
  copilotRuntimeNestEndpoint,
  langGraphPlatformEndpoint,
  OpenAIAdapter,
} from '@copilotkit/runtime';
import { Request, Response } from 'express';
import OpenAI from 'openai';

@Controller()
export class CopilotkitController {
  private readonly openai = new OpenAI({
    apiKey: '',
  });

  private readonly llmAdapter = new OpenAIAdapter({ openai: this.openai, model: 'gpt-4o-mini' });

  private readonly runtime = new CopilotRuntime({
    remoteEndpoints: [
      langGraphPlatformEndpoint({
        deploymentUrl:
          process.env.LANGGRAPH_DEPLOYMENT_URL || 'http://localhost:8123',
        langsmithApiKey: process.env.LANGSMITH_API_KEY || '',
        agents: [
          {
            name: 'sample_agent',
            description: 'A helpful LLM agent.',
          },
        ],
      }),
    ],
  });

  @All('/copilotkit')
  copilotkit(@Req() req: Request, @Res() res: Response) {
    return copilotRuntimeNestEndpoint({
      runtime: this.runtime,
      serviceAdapter: this.llmAdapter,
      endpoint: '/copilotkit',
    })(req, res);
  }
}
