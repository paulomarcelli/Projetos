/**
 * Criar conta.
 *
 * Só os campos necessários: nome, e-mail institucional, senha e a confirmação (a senha não é
 * mostrada por padrão, então a confirmação evita erro de digitação). Nada de cargo, instituição
 * ou telefone. O aceite de termos e da política de privacidade ainda não aparece porque essas
 * páginas não existem; quando existirem, entra como caixa obrigatória com links para elas.
 *
 * Validação: no envio, com mensagem específica por campo e foco no primeiro inválido; as regras
 * da senha ficam visíveis o tempo todo e são marcadas enquanto se digita.
 * Resultado: `ok` mostra o estado "confirme o e-mail" (só depois do servidor); `indisponivel`
 * (situação atual) diz que nenhuma conta foi criada.
 */
import { ArrowRight, MailCheck } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router";
import { Aviso } from "../../components/common/Aviso";
import { BotaoEnviar, Campo, CampoSenha, RegrasDaSenha, Retorno, TituloAuth } from "../../components/autenticacao/pecas";
import { autenticacao, type CampoAuth, type ResultadoAuth } from "../../services/autenticacao";
import { validarEmail, validarSenhaNova } from "../../utils/validadores";
import { ROTAS } from "../../config/rotas";

type Erros = Partial<Record<CampoAuth, string>>;

export function PaginaCriarConta() {
  const id = useId();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAuth | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const novos: Erros = {
      nome: nome.trim().length >= 2 ? undefined : "Digite o seu nome.",
      email: validarEmail(email),
      senha: validarSenhaNova(senha),
      confirmacao: confirmacao && confirmacao === senha ? undefined : "As duas senhas precisam ser iguais.",
    };
    setErros(novos);
    setResultado(null);
    const primeiro = (["nome", "email", "senha", "confirmacao"] as const).find((c) => novos[c]);
    if (primeiro) return document.getElementById(`${id}-${primeiro}`)?.focus();

    setCarregando(true);
    const r = await autenticacao.criarConta({ nome: nome.trim(), email: email.trim(), senha });
    setCarregando(false);
    if (r.tipo === "erro" && r.campo) setErros({ [r.campo]: r.mensagem });
    setResultado(r);
  };

  // Conta criada (só com confirmação do servidor): a tela vira o próximo passo. Se o servidor
  // exigir confirmação de e-mail, diz isso; senão, leva direto à entrada.
  if (resultado?.tipo === "ok") {
    return (
      <div className="flex flex-col gap-6">
        <MailCheck size={28} strokeWidth={1.5} aria-hidden="true" className="text-ciano" />
        {resultado.confirmarEmail ? (
          <TituloAuth titulo="Confirme o seu e-mail">
            Enviamos um link de confirmação para <span className="text-texto">{email.trim()}</span>. Abra-o para ativar a conta; depois, entre com o seu e-mail e senha.
          </TituloAuth>
        ) : (
          <TituloAuth titulo="Conta criada">Entre com o seu e-mail e a senha que você acabou de definir.</TituloAuth>
        )}
        <Link to={ROTAS.entrar} className="botao botao-secundario botao-grande w-full">
          Ir para a entrada
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <TituloAuth titulo="Crie a sua conta">Só o necessário para começar: nome, e-mail e senha.</TituloAuth>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <Campo id={`${id}-nome`} rotulo="Nome" autoComplete="name" value={nome} erro={erros.nome} onChange={(e) => setNome(e.target.value)} />
        <Campo
          id={`${id}-email`}
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          erro={erros.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <CampoSenha
          id={`${id}-senha`}
          rotulo="Senha"
          autoComplete="new-password"
          value={senha}
          erro={erros.senha}
          dica={<RegrasDaSenha senha={senha} />}
          onChange={(e) => setSenha(e.target.value)}
        />
        <CampoSenha
          id={`${id}-confirmacao`}
          rotulo="Confirmar senha"
          autoComplete="new-password"
          value={confirmacao}
          erro={erros.confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        <BotaoEnviar carregando={carregando} rotuloCarregando="Criando a conta…">
          Criar conta
        </BotaoEnviar>
      </form>

      <Retorno chave={resultado?.tipo ?? null}>
        {resultado?.tipo === "indisponivel" && (
          <Aviso tom="atencao" titulo="Cadastro ainda não disponível">
            <span className="flex flex-col items-start gap-3">
              O servidor ainda não tem contas de usuário, então nenhuma conta foi criada e nenhum dado foi enviado. Nesta versão de desenvolvimento, o acesso é aberto.
              <Link to={ROTAS.inicio} className="botao botao-secundario botao-pequeno">
                Continuar para a plataforma
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </span>
          </Aviso>
        )}
        {resultado?.tipo === "erro" && !resultado.campo && <Aviso tom="erro">{resultado.mensagem}</Aviso>}
      </Retorno>

      <p className="text-corpo text-texto-2">
        Já tem conta?{" "}
        <Link to={ROTAS.entrar} className="text-ciano-texto hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

export default PaginaCriarConta;
