from google import genai

client = genai.Client()

while True:
    pergunta = input("Você: ")
    
    resposta = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=pergunta
    )
    
    print(resposta.text)