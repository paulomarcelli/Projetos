// Exemplo inicial de Programação Orientada a Objetos em JavaScript.
// Tema: uma playlist com músicas e podcasts.
// Adapte as classes ao enunciado da tarefa.

// Classe base: guarda o que toda mídia tem em comum.
class Midia {
  // Campos privados (#): só podem ser acessados dentro da classe (encapsulamento).
  #titulo;
  #duracaoEmSegundos;

  constructor(titulo, duracaoEmSegundos) {
    // Impede criar "Midia" diretamente: ela serve só de modelo (classe abstrata).
    if (new.target === Midia) {
      throw new Error("Midia é uma classe abstrata. Use Musica ou Podcast.");
    }
    this.#titulo = titulo;
    this.duracaoEmSegundos = duracaoEmSegundos; // passa pelo setter abaixo
  }

  // Getter: leitura controlada do campo privado.
  get titulo() {
    return this.#titulo;
  }

  get duracaoEmSegundos() {
    return this.#duracaoEmSegundos;
  }

  // Setter com validação: o objeto nunca fica com uma duração inválida.
  set duracaoEmSegundos(valor) {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error("A duração precisa ser um número inteiro maior que zero.");
    }
    this.#duracaoEmSegundos = valor;
  }

  // Ex.: 165 segundos -> "2:45"
  duracaoFormatada() {
    const minutos = Math.floor(this.#duracaoEmSegundos / 60);
    const segundos = String(this.#duracaoEmSegundos % 60).padStart(2, "0");
    return `${minutos}:${segundos}`;
  }

  // Método que as subclasses sobrescrevem (polimorfismo).
  descricao() {
    throw new Error("Cada tipo de mídia precisa implementar descricao().");
  }
}

// Herança: Musica "é uma" Midia e acrescenta o artista.
class Musica extends Midia {
  constructor(titulo, artista, duracaoEmSegundos) {
    super(titulo, duracaoEmSegundos); // chama o construtor da classe base
    this.artista = artista;
  }

  descricao() {
    return `🎵 ${this.titulo} — ${this.artista} (${this.duracaoFormatada()})`;
  }
}

// Herança: Podcast também "é uma" Midia, com apresentador e episódio.
class Podcast extends Midia {
  constructor(titulo, apresentador, episodio, duracaoEmSegundos) {
    super(titulo, duracaoEmSegundos);
    this.apresentador = apresentador;
    this.episodio = episodio;
  }

  descricao() {
    return `🎙️ ${this.titulo}, ep. ${this.episodio} — ${this.apresentador} (${this.duracaoFormatada()})`;
  }
}

// Composição: uma Playlist "tem" várias mídias.
class Playlist {
  #itens = [];

  constructor(nome) {
    this.nome = nome;
  }

  adicionar(midia) {
    if (!(midia instanceof Midia)) {
      throw new Error("Só é possível adicionar músicas ou podcasts.");
    }
    this.#itens.push(midia);
    return this; // permite encadear: playlist.adicionar(a).adicionar(b)
  }

  duracaoTotalEmSegundos() {
    return this.#itens.reduce((total, midia) => total + midia.duracaoEmSegundos, 0);
  }

  listar() {
    console.log(`Playlist: ${this.nome}`);
    // Polimorfismo: cada item responde a descricao() do seu próprio jeito.
    this.#itens.forEach((midia, i) => console.log(`${i + 1}. ${midia.descricao()}`));
    console.log(`Total: ${this.#itens.length} itens, ${this.duracaoTotalEmSegundos()} segundos`);
  }
}

// Teste rápido das classes.
const playlist = new Playlist("Estudos de POO");
playlist
  .adicionar(new Musica("Mariposas", "Karol Sevilla", 165))
  .adicionar(new Musica("Otro Mood", "Karol Sevilla", 170))
  .adicionar(new Podcast("Código em Pauta", "Ana", 12, 1800));

playlist.listar();

// Mostra que a validação do encapsulamento funciona.
try {
  new Musica("Sem duração", "Ninguém", -5);
} catch (erro) {
  console.log(`Erro esperado: ${erro.message}`);
}
