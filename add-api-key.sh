#!/bin/bash

# Add OpenRouter API key to .env file
echo "Adding OpenRouter API key to .env..."

# Update the OPENAI_API_KEY line in .env
if grep -q "^OPENAI_API_KEY=" .env; then
    sed -i.bak 's|^OPENAI_API_KEY=.*|OPENAI_API_KEY=your-openrouter-api-key-here|' .env
    echo "✅ Updated OPENAI_API_KEY in .env"
else
    echo "OPENAI_API_KEY=your-openrouter-api-key-here" >> .env
    echo "✅ Added OPENAI_API_KEY to .env"
fi

# Also update the OpenAI base URL for OpenRouter
if grep -q "^OPENAI_BASE_URL=" .env; then
    sed -i.bak 's|^OPENAI_BASE_URL=.*|OPENAI_BASE_URL=https://openrouter.ai/api/v1|' .env
else
    echo "OPENAI_BASE_URL=https://openrouter.ai/api/v1" >> .env
    echo "✅ Added OPENAI_BASE_URL for OpenRouter"
fi

echo ""
echo "🎉 Configuration complete!"
echo "Now restart the containers: docker-compose down && docker-compose up -d"
