client<llm> OpenrouterGptOssClient {
  provider "openai-generic"
  options {
    base_url "https://openrouter.ai/api/v1"
    api_key env.OPENROUTER_API_KEY
    model "openai/gpt-oss-120b"
    provider {
      only ["groq", "cerebras"]
    }
    headers {
      "HTTP-Referer" "https://r8y.app" 
      "X-Title" "r8y" 
    }
  }
}

