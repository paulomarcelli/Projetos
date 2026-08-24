print("Bem vindo ao jogo Pedra, Papel e Tesoura!")
# print - exibe uma mensagem no terminal

nome = input(str("Qual é o seu nome? "))
# input - recebe o nome do usuário
# str - transforma o valor em texto

print("Ola, ", nome)
# print - exibe uma mensagem junto com o nome do usuário

import random
# import - importa um módulo para ser utilizado no programa
# random - permite trabalhar com escolhas aleatórias

opcoes = ["Pedra", "Papel", "Tesoura"]
# opcoes - armazena as opções do jogo em uma lista
# [] - cria uma lista
# "Pedra", "Papel", "Tesoura" - são os valores armazenados na lista

while True:
    # while - repete um bloco de código enquanto uma condição for verdadeira
    # True - mantém a condição sempre verdadeira, criando um loop contínuo

    escolha = input("Escolha entre Pedra, Papel ou Tesoura: ")
    # input - recebe a escolha do usuário

    escolha_pc = random.choice(opcoes)
    # random.choice - escolhe aleatoriamente um item da lista opcoes
    # escolha_pc - armazena a escolha feita pelo computador

    print("O usuario escolheu: ", escolha)
    # print - exibe a escolha feita pelo usuário

    print("O computador escolheu: ", escolha_pc)
    # print - exibe a escolha feita pelo computador

    if escolha == "Pedra" and escolha_pc == "Tesoura":
        # if - verifica se uma condição é verdadeira
        # == - compara dois valores
        # and - verifica se duas condições são verdadeiras ao mesmo tempo

        print(f"O {nome} ganhou!")
        # print - exibe a mensagem de vitória
        # f - permite inserir uma variável dentro do texto
        # {nome} - insere o nome do usuário na mensagem

    elif escolha == "Papel" and escolha_pc == "Pedra":
        # elif - verifica uma nova condição caso a condição anterior seja falsae

        print(f"O {nome} ganhou!")

    elif escolha == "Tesoura" and escolha_pc == "Papel":
        # elif - verifica outra condição caso as anteriores sejam falsas

        print(f"O {nome} ganhou!")

    elif escolha == "Pedra" and escolha_pc == "Pedra":
        print("O jogo empatou!")

    elif escolha == "Papel" and escolha_pc == "Papel":
        print("O jogo empatou!")

    elif escolha == "Tesoura" and escolha_pc == "Tesoura":
        print("O jogo empatou!")

    else:
        # else - executa quando nenhuma das condições anteriores é verdadeira

        print("O computador ganhou!")

    jogar = input("Voce ainda quer jogar? ")
    # input - recebe a resposta do usuário sobre continuar jogando

    if jogar == "nao":
        # if - verifica se o usuário escolheu não continuar jogando

        break
        # break - interrompe o loop while imediatamente