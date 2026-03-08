#!/usr/bin/env python3
"""
Qwen AI Service - Python Client Example (Anthropic SDK)
"""

from anthropic import Anthropic

# Initialize client
client = Anthropic(
    base_url="http://localhost:8000/v1",
    api_key="dummy"  # Not used, but required by SDK
)

def simple_message():
    """Simple message example"""
    print("=== Simple Message ===\n")

    message = client.messages.create(
        model="Qwen3.5-9B-Q6_K.gguf",
        max_tokens=500,
        system="You are a helpful assistant.",
        messages=[
            {"role": "user", "content": "你好，请介绍一下你自己"}
        ]
    )

    print(f"Assistant: {message.content[0].text}")
    print(f"\nTokens: {message.usage.input_tokens} in, {message.usage.output_tokens} out")


def streaming_message():
    """Streaming message example"""
    print("\n=== Streaming Message ===\n")

    with client.messages.stream(
        model="Qwen3.5-9B-Q6_K.gguf",
        max_tokens=200,
        messages=[{"role": "user", "content": "用三句话解释机器学习"}],
    ) as stream:
        print("Assistant: ", end="", flush=True)
        for text in stream.text_stream:
            print(text, end="", flush=True)
    print("\n")


if __name__ == "__main__":
    try:
        simple_message()
        # streaming_message()
    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure:")
        print("1. Qwen AI Service is running (npm run dev)")
        print("2. llama.cpp is running on port 8001")
