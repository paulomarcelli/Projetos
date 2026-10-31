/**
 * Redefinir a senha a partir do link enviado por e-mail (`/redefinir-senha?token=...`).
 *
 * Sem token no endereço, a tela não mostra o formulário: explica que o link está incompleto e
 * leva a pedir um novo. Com token, pede a nova senha (com as mesmas regras do cadastro) e a
 * confirmação. A validade do token só o servidor decide: um token vencido volta como `erro`
 * no campo "token". "Senha alterada" só aparece com `ok` do servidor.
 */
import { ArrowLeft, CircleCheck, LinkIcon } from "lucide-react";
import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Aviso } from "../../components/feedback/Aviso";
import { BotaoEnviar, CampoSenha, RegrasDaSenha, Retorno, TituloAuth } from "../../features/autenticacao/components/pecas";
import { autenticacao, type ResultadoAuth } from "../../services/autenticacao";
import { validarSenhaNova } from "../../utils/validadores";
import { ROTAS } from "../../config/rotas";

export function PaginaRedefinirSenha() {
  const id = useId();
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<{ senha?: string; confirmacao?: string }>({});
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAuth | null>(null);

  if (!token || (resultado?.tipo === "erro" && resultado.campo === "token")) {
    return (
      <div className="flex flex-col gap-6">
        <LinkIcon size={26} strokeWidth={1.5} aria-hidden="true" className="text-ciano-texto" />
        <TituloAuth titulo="Link inválido ou incompleto">
          {resultado?.tipo === "erro" ? resultado.mensagem : "Este endereço não tem o código de redefinição. Abra o link completo do e-mail ou peça um novo."}
        </TituloAuth>
        <Link to={ROTAS.recuperarSenha} className="botao botao-secundario botao-grande w-full">
          Pedir um novo link
        </Link>
      </div>
    );
  }

  if (resultado?.tipo === "ok") {
    return (
      <div className="flex flex-col gap-6">
        <CircleCheck size={28} strokeWidth={1.5} aria-hidden="true" className="text-positivo" />
        <TituloAuth titulo="Senha alterada">A sua nova senha já vale. Entre com ela para continuar.</TituloAuth>
        <Link to={ROTAS.entrar} className="botao botao-primario botao-grande w-full">
          Entrar
        </Link>
      </div>
    );
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const novos = {
      senha: validarSenhaNova(senha),
      confirmacao: confirmacao && confirmacao === senha ? undefined : "As duas senhas precisam ser iguais.",
    };
    setErros(novos);
    setResultado(null);
    if (novos.senha) return document.getElementById(`${id}-senha`)?.focus();
    if (novos.confirmacao) return document.getElementById(`${id}-confirmacao`)?.focus();
    setCarregando(true);
    const r = await autenticacao.redefinirSenha({ token, senha });
    setCarregando(false);
    if (r.tipo === "erro" && (r.campo === "senha" || r.campo === "confirmacao")) setErros({ [r.campo]: r.mensagem });
    setResultado(r);
  };

  return (
    <div className="flex flex-col gap-8">
      <TituloAuth titulo="Crie uma nova senha">Escolha uma senha que você não use em outros serviços.</TituloAuth>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <CampoSenha
          id={`${id}-senha`}
          rotulo="Nova senha"
          autoComplete="new-password"
          value={senha}
          erro={erros.senha}
          dica={<RegrasDaSenha senha={senha} />}
          onChange={(e) => setSenha(e.target.value)}
        />
        <CampoSenha
          id={`${id}-confirmacao`}
          rotulo="Confirmar a nova senha"
          autoComplete="new-password"
          value={confirmacao}
          erro={erros.confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        <BotaoEnviar carregando={carregando} rotuloCarregando="Salvando…">
          Salvar nova senha
        </BotaoEnviar>
      </form>
      <Retorno chave={resultado?.tipo ?? null}>
        {resultado?.tipo === "indisponivel" && (
          <Aviso tom="atencao" titulo="Redefinição ainda não disponível">
            O servidor ainda não tem contas de usuário, então a senha não foi alterada.
          </Aviso>
        )}
        {resultado?.tipo === "erro" && !resultado.campo && <Aviso tom="erro">{resultado.mensagem}</Aviso>}
      </Retorno>
      <Link to={ROTAS.entrar} className="inline-flex w-fit items-center gap-1.5 text-corpo text-ciano-texto hover:underline">
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para a entrada
      </Link>
    </div>
  );
}

export default PaginaRedefinirSenha;
