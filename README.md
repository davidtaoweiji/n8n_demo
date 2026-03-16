# n8n-nodes-minimax-chat

MiniMax Chat Model and TTS nodes for n8n - Use MiniMax AI models and speech in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[MiniMax](https://platform.minimax.io/) is an AI platform that provides various language models for chat, text generation, and more.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This package provides:

- MiniMax Chat Model node for n8n AI workflows
- MiniMax TTS node for text-to-speech generation

## Credentials

To use this node, you need a MiniMax API key:

1. Sign up at [MiniMax Platform](https://platform.minimax.io/)
2. Get your API Key from the console
3. Create a new credential in n8n with your API Key

## Compatibility

- Requires n8n version 1.19.0 or higher
- Uses `@n8n/ai-node-sdk`

## Usage

1. Install this community node in n8n
2. Add the "MiniMax Chat Model" node to your workflow
3. Connect it to an AI Chain node (like Basic LLM Chain)
4. Configure your MiniMax API credentials

## MiniMax TTS Usage

1. Add the "MiniMax TTS" node to your workflow
2. Configure Text, Voice ID, and optional Voice/Audio settings
3. Execute the node to receive synthesized audio response data

### TTS Endpoint

- Uses `POST /v1/t2a_v2`
- Supports model `speech-2.8-hd`
- Supports voice settings, audio settings, pronunciation tone list, and subtitles toggle
- Supports `Output Format` (`url` or `hex`) for non-streaming mode; default is `url`
- When response contains a URL audio payload, node also exposes it as `audio_url`

### Available Models

- MiniMax-M2.5
- MiniMax-M2.1

### Options

- **Sampling Temperature**: Controls randomness (0-1)
- **Nucleus Sampling (Top P)**: Controls diversity via nucleus sampling
- **Max Tokens**: Maximum tokens to generate

## Example Workflow

```
[Chat Trigger] → [MiniMax Chat Model] → [Basic LLM Chain]
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [MiniMax Platform](https://platform.minimax.io/)
- [MiniMax API Documentation](https://platform.minimax.io/docs)

## Version History

### 0.1.0

- Initial release
- Support for MiniMax Chat models
- API v2 endpoint integration
