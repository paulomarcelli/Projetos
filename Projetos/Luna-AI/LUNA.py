nome = input("Qual é o seu nome? ")

historico = []
memoria = {}

def identificar_intencao(mensagem):
    if mensagem == "sair":
        return "sair"
    
    elif "oi" in mensagem or "ola" in mensagem:
        return "saudacao"
    
    elif "musica" in mensagem:
        return "musica"
    
    elif "estudar" in mensagem:
        return "estudo"
    
    elif "python" in mensagem:
        return "python"
    
    elif "ia" in mensagem:
        return "ia"
    
    elif "rotina" in mensagem:
        return "rotina"
    
    elif "meu jogo favorito é" in mensagem:
        return "aprender_jogo"
    
    elif "qual é meu jogo favorito" in mensagem:
        return "lembrar_jogo"
    
    elif "jogo" in mensagem or "game" in mensagem:
        return "jogos"

    else:
        return "desconhecido"
        
def responder(intencao, nome, memoria):
    if intencao == "sair":
        return f"LUNA AI: Até mais, {nome}! Foi ótimo conversar com você."

    if intencao == "saudacao":
        return f"LUNA AI: Ola, {nome}! Que bom falar com você."
    
    elif intencao == "musica":
        return f"LUNA AI: Adoro música, {nome}! A minha melhor recomendacao é a Sabrina Carpenter"
    
    elif intencao == "estudo":
        return f"LUNA AI: Posso te ajudar a estudar Python ou Inteligência Artificial, {nome}?"
    
    elif intencao == "python":
        return f"LUNA AI: Python é uma linguagem de programação muito usada em Inteligência Artificial, {nome}."
    
    elif intencao == "ia":
        return f"LUNA AI: Inteligência Artificial é um campo fascinante de estudo, {nome}!"
    
    elif intencao == "rotina":
        return f"LUNA AI: Posso te ajudar a organizar sua rotina, {nome}!"
    
    elif intencao == "aprender_jogo":
        return f"LUNA AI: Entendi! Vou me lembrar do seu jogo favorito."
    
    elif intencao == "lembrar_jogo":
        if "jogo_favorito" in memoria:
            return f"LUNA AI: Seu jogo favorito é {memoria['jogo_favorito']}."
        else:
            return "LUNA AI: Você ainda não me disse qual é seu jogo favorito."

    elif intencao == "jogos" or intencao == "games":
        return f"LUNA AI: Eu adoro jogos, {nome}! Posso te ajudar a escolher um jogo para zerar."
    
    else:
        return f"LUNA AI: Desculpe, {nome}, ainda estou aprendendo e não entendi sua mensagem. Mas estou aqui para ajudar no que puder!"

print("Ola, eu sou a LUNA AI.")
print("Sou uma assistente virtual que pode conversar com você sobre diversos assuntos.")
print("Ainda estou aprendendo, mas ja consigo conversar um pouco.")

while True:
    mensagem = input(f"{nome}: ").lower()

    historico.append(mensagem)

    print(historico)

    intencao = identificar_intencao(mensagem)

    if intencao == "aprender_jogo":
        partes = mensagem.split()
        memoria ["jogo_favorito"] = partes[4]



    resposta = responder(intencao, nome, memoria)

    print(resposta)

    if intencao == "sair":
        break