/**
 * Recuperar a senha: pede o e-mail e solicita o link de redefinição.
 *
 * Privacidade: com o servidor funcionando, a mensagem de sucesso é a MESMA exista ou não uma
 * conta com o e-mail ("se houver uma conta…"), para não revelar quem está cadastrado.
 * Hoje (`indisponivel`), a tela diz que nenhum e-mail foi enviado: não simula o envio.
 */
import { ArrowLeft, MailCheck } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router";
import { Aviso } from "../../components/common/Aviso";
import { BotaoEnviar, Campo, Retorno, TituloAuth } from "../../components/autenticacao/pecas";
import { autenticacao, type ResultadoAuth } from "../../services/autenticacao";
import { validarEmail } from "../../utils/validadores";
import { ROTAS } from "../../config/rotas";

export function PaginaRecuperarSenha() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAuth | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalido = validarEmail(email);
    setErro(invalido);
    setResultado(null);
    if (invalido) return document.getElementById(`${id}-email`)?.focus();
    setCarregando(true);
    const r = await autenticacao.solicitarRecuperacao({ email: email.trim() });
    setCarregando(false);
    if (r.tipo === "erro" && r.campo === "email") setErro(r.mensagem);
    setResultado(r);
  };

  const voltar = (
    <Link to={ROTAS.entrar} className="inline-flex w-fit items-center gap-1.5 text-corpo text-ciano-texto hover:underline">
      <ArrowLeft size={15} aria-hidden="true" />
      Voltar para a entrada
    </Link>
  );

  if (resultado?.tipo === "ok") {
    return (
      <div className="flex flex-col gap-6">
        <MailCheck size={28} strokeWidth={1.5} aria-hidden="true" className="text-ciano" />
        <TituloAuth titulo="Verifique o seu e-mail">
          Se houver uma conta com <span className="text-texto">{email.trim()}</span>, você vai receber um link para criar uma nova senha. O link vale por tempo limitado.
        </TituloAuth>
        {voltar}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <TituloAuth titulo="Recuperar a senha">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</TituloAuth>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <Campo
          id={`${id}-email`}
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          erro={erro}
          onChange={(e) => setEmail(e.target.value)}
        />
        <BotaoEnviar carregando={carregando} rotuloCarregando="Enviando…">
          Enviar link de recuperação
        </BotaoEnviar>
      </form>
      <Retorno chave={resultado?.tipo ?? null}>
        {resultado?.tipo === "indisponivel" && (
          <Aviso tom="atencao" titulo="Recuperação ainda não disponível">
            O servidor ainda não tem contas nem envio de e-mail, então nenhuma mensagem foi enviada.
          </Aviso>
        )}
        {resultado?.tipo === "erro" && !resultado.campo && <Aviso tom="erro">{resultado.mensagem}</Aviso>}
      </Retorno>
      {voltar}
    </div>
  );
}

export default PaginaRecuperarSenha;
