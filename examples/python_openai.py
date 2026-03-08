#!/usr/bin/env python3
"""
Qwen AI Service - Python Client Example (OpenAI SDK)
"""

from openai import OpenAI

# Initialize client
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="dummy"  # Not used, but required by SDK
)

def simple_chat():
    """Simple chat example"""
    print("=== Simple Chat ===\n")

    response = client.chat.completions.create(
        model="Qwen3.5-9B-Q6_K.gguf",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "你好，请介绍一下你自己"}
        ],
        temperature=0.7,
        max_tokens=500
    )

    print(f"Assistant: {response.choices[0].message.content}")
    print(f"\nTokens used: {response.usage.total_tokens}")


def streaming_chat():
    """Streaming chat example"""
    print("\n=== Streaming Chat ===\n")

    stream = client.chat.completions.create(
        model="Qwen3.5-9B-Q6_K.gguf",
        messages=[{"role": "user", "content": "用三句话介绍量子计算"}],
        stream=True,
        max_tokens=200
    )

    print("Assistant: ", end="", flush=True)
    for chunk in stream:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print("\n")


def multi_turn_conversation():
    """Multi-turn conversation example"""
    print("\n=== Multi-turn Conversation ===\n")

    messages = [
        {"role": "system", "content": "You are a helpful assistant."}
    ]

    while True:
        user_input = input("\nYou (or 'quit'): ")
        if user_input.lower() in ['quit', 'exit', 'q']:
            break

        messages.append({"role": "user", "content": user_input})

        response = client.chat.completions.create(
            model="Qwen3.5-9B-Q6_K.gguf",
            messages=messages,
            max_tokens=300
        )

        assistant_message = response.choices[0].message.content
        print(f"\nAssistant: {assistant_message}")

        messages.append({"role": "assistant", "content": assistant_message})


if __name__ == "__main__":
    try:
        # Test server connection
        models = client.models.list()
        print(f"Connected to Qwen AI Service")
        print(f"Available models: {len(models.data)}\n")

        # Run examples
        simple_chat()
        # streaming_chat()
        # multi_turn_conversation()

    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure:")
        print("1. Qwen AI Service is running (npm run dev)")
        print("2. llama.cpp is running on port 8001")
