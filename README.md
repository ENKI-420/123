# Multi-Model AI Platform

A flexible Node.js platform that integrates multiple AI models including ChatGPT, Gemini, Mistral, Perplexity, and TogetherAI, allowing seamless interaction with different AI providers through a unified interface.

## Features

- Support for multiple AI models:
- OpenAI ChatGPT
- Google Gemini
- Mistral AI
- Perplexity
- TogetherAI
- Unified API interface
- Orchestration layer for model coordination
- Express.js-based server
- Flexible configuration options

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- API keys for the AI services you plan to use

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd multi-model-ai-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```env
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
MISTRAL_API_KEY=your_mistral_key
PERPLEXITY_API_KEY=your_perplexity_key
TOGETHER_API_KEY=your_together_key
```

## Available AI Models

### ChatGPT
- Provider: OpenAI
- Models: GPT-3.5-turbo, GPT-4
- Best for: General conversation, code generation, creative writing

### Gemini
- Provider: Google
- Models: Gemini Pro, Gemini Pro Vision
- Best for: Multimodal tasks, general conversation

### Mistral
- Provider: Mistral AI
- Models: Mistral-7B
- Best for: Efficient language processing

### Perplexity
- Provider: Perplexity AI
- Features: Online search capabilities
- Best for: Real-time information access

### TogetherAI
- Provider: Together
- Features: Access to various open-source models
- Best for: Experimentation with different model architectures

## Usage

1. Start the server:
```bash
npm start
```

2. Make API requests to interact with AI models:
```bash
curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{
    "model": "chatgpt",
    "message": "Hello, how are you?",
    "options": {
        "temperature": 0.7
    }
    }'
```

3. Use the orchestrator for automated model selection:
```bash
curl -X POST http://localhost:3000/api/auto \
    -H "Content-Type: application/json" \
    -d '{
    "message": "Your query here",
    "preference": "fastest"
    }'
```

## Configuration

Model-specific configurations can be adjusted in the `.env` file or through the API request options.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

