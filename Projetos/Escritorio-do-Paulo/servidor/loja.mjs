// Persistência local em arquivos. Cada gravação vai para um arquivo temporário e é renomeada por cima do
// definitivo: se o processo cair no meio, o arquivo antigo continua inteiro.
import fs from 'node:fs';
import path from 'node:path';

export function criarLoja(pasta) {
  fs.mkdirSync(pasta, { recursive: true });
  const caminho = nome => path.join(pasta, nome);

  return {
    pasta,
    ler(nome, padrao) {
      try {
        return JSON.parse(fs.readFileSync(caminho(nome), 'utf8'));
      } catch {
        return padrao;
      }
    },
    gravar(nome, dado) {
      const destino = caminho(nome);
      const temp = `${destino}.${process.pid}.tmp`;
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(temp, JSON.stringify(dado, null, 2));
      fs.renameSync(temp, destino);
    },
    gravarTexto(nome, texto) {
      const destino = caminho(nome);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      const temp = `${destino}.${process.pid}.tmp`;
      fs.writeFileSync(temp, texto);
      fs.renameSync(temp, destino);
    },
    lerTexto(nome) {
      try {
        return fs.readFileSync(caminho(nome), 'utf8');
      } catch {
        return null;
      }
    },
    // Histórico: uma linha JSON por evento, só acrescenta.
    anexar(nome, objeto) {
      fs.appendFileSync(caminho(nome), JSON.stringify(objeto) + '\n');
    },
    ultimasLinhas(nome, quantas) {
      let texto;
      try {
        texto = fs.readFileSync(caminho(nome), 'utf8');
      } catch {
        return [];
      }
      const linhas = texto.split('\n').filter(Boolean).slice(-quantas);
      const saida = [];
      for (const linha of linhas) {
        try {
          saida.push(JSON.parse(linha));
        } catch {
          // linha cortada por uma queda no meio da escrita: ignora
        }
      }
      return saida;
    },
  };
}
