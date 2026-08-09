print("nvidea.py started")

from openai import OpenAI

print("OpenAI imported")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)

print("Client created")

response = client.chat.completions.create(
    model="nvidia/nemotron-3-ultra-550b-a55b",
    messages=[
        {
            "role": "user",
            "content": "Say hello in one sentence."
        }
    ],
    max_tokens=50
)

print("Response received")
print(response.choices[0].message.content)