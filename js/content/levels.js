// Trilha de níveis — organizada pelos assuntos da FOE, com dificuldade crescente.
// Cardinalidades no padrão de aula (Heuser/brModelo): o par em links [ENTIDADE, card] é o que fica JUNTO àquela entidade.

const S_CARD = (a, b, r = 'relacionamento') => `Para cada lado pergunte: “um(a) <b>${a}</b> se associa a quantos(as) <b>${b}</b>?” e escreva a resposta <b>junto a ${b}</b>. Depois inverta (${b} → ${a}). Use o painel do ${r} para ver a frase de leitura.`;

export const WORLDS = [
// =====================================================================
{
  id: 'w1', tag: 'conceitos', theory: 'conceitos', title: 'Mundo 1 — Fundamentos',
  desc: 'Conceitos básicos, arquitetura e modelagem.',
  levels: [
    {
      id: '1-1', type: 'quiz', diff: 1, tag: 'conceitos', theory: 'conceitos', title: 'Conceitos básicos de BD', desc: 'BD, SGBD, ACID, papéis, linguagens.',
      intro: '<p>Responda às questões sobre os conceitos introdutórios. Depois de corrigir, leia as explicações.</p>',
      questions: [
        { q: 'Qual definição descreve melhor um <b>banco de dados</b>?', opts: ['Qualquer conjunto de arquivos guardados no mesmo disco', 'Uma coleção de dados relacionados, com significado, que representa um minimundo e tem uma finalidade', 'O software que controla o acesso aos dados', 'Uma planilha com muitas linhas'], a: 1, exp: 'BD = dados <b>relacionados</b> com significado inerente, representando o minimundo. O software é o SGBD.' },
        { q: 'Qual destas NÃO é uma função do SGBD?', opts: ['Definição (metadados no catálogo)', 'Construção (armazenar os dados)', 'Manipulação (consultas e atualizações)', 'Elaborar automaticamente o modelo conceitual a partir do minimundo'], a: 3, exp: 'Definição, construção, manipulação e compartilhamento são funções do SGBD. A modelagem conceitual é trabalho do projetista.' },
        { q: 'Numa transferência bancária, o débito foi feito mas o sistema caiu antes do crédito. Ao reiniciar, o débito é desfeito. Qual propriedade foi garantida?', opts: ['Atomicidade', 'Isolamento', 'Durabilidade', 'Consistência de domínio'], a: 0, exp: 'Atomicidade: tudo ou nada. (Durabilidade é manter o que foi confirmado com COMMIT.)' },
        { q: 'Quem é responsável por criar e manter os bancos de dados, controlar acesso e desempenho?', opts: ['Administrador de Dados (AD)', 'DBA (Administrador de Banco de Dados)', 'Usuário final', 'Projetista do SGBD'], a: 1, exp: 'DBA cria/mantém os BDs. AD cuida do ambiente de dados corporativo; o administrador do SGBD instala e mantém o software.' },
        { q: '<code>CREATE TABLE</code>, <code>ALTER TABLE</code> e <code>DROP TABLE</code> pertencem a qual sublinguagem?', opts: ['DML', 'DDL', 'DCL', 'DQL'], a: 1, exp: 'DDL = definição de dados. DML = SELECT/INSERT/UPDATE/DELETE. DCL = GRANT/REVOKE.' },
        { q: 'Um problema clássico de sistemas baseados em arquivos que o SGBD resolve é:', opts: ['A dependência programa-dados (a estrutura do arquivo fica embutida no programa)', 'A falta de linguagens de programação', 'O uso de discos magnéticos', 'A existência de chaves primárias'], a: 0, exp: 'Com arquivos, mudar a estrutura obriga a mudar os programas; também há redundância e inconsistência.' },
      ],
    },
    {
      id: '1-2', type: 'quiz', diff: 1, tag: 'arquitetura', theory: 'arquitetura', title: 'Arquitetura de três esquemas', desc: 'Níveis externo/conceitual/interno e independência de dados.',
      intro: '<p>Arquitetura ANSI/SPARC, independência de dados e a diferença entre esquema e instância.</p>',
      questions: [
        { q: 'O DBA criou um índice na coluna <code>salario</code> para acelerar consultas, sem mudar nenhuma aplicação. Isso ilustra:', opts: ['Independência lógica', 'Independência física', 'Integridade referencial', 'Atomicidade'], a: 1, exp: 'Mudou o nível <b>interno</b> sem afetar o conceitual → independência física.' },
        { q: 'Foi adicionada a coluna <code>email</code> na tabela EMPREGADO e as visões existentes continuaram funcionando. Isso ilustra:', opts: ['Independência lógica', 'Independência física', 'Durabilidade', 'Normalização'], a: 0, exp: 'Mudou o esquema <b>conceitual</b> sem afetar os esquemas externos → independência lógica.' },
        { q: 'Qual nível descreve apenas a parte do BD de interesse de um grupo de usuários?', opts: ['Interno', 'Conceitual', 'Externo', 'Físico'], a: 2, exp: 'Nível externo = visões (CREATE VIEW).' },
        { q: '“O conjunto de dados armazenados no BD num determinado instante” é o(a):', opts: ['Esquema', 'Modelo de dados', 'Instância (estado)', 'Catálogo'], a: 2, exp: 'Esquema é a descrição (muda pouco). Instância é o conteúdo num instante (muda sempre).' },
        { q: 'Qual nível descreve estruturas de armazenamento e caminhos de acesso?', opts: ['Externo', 'Conceitual', 'Interno', 'Lógico'], a: 2, exp: 'Nível interno: como os dados ocupam o disco, índices etc.' },
        { q: 'Qual tipo de independência é considerado mais difícil de obter?', opts: ['Física', 'Lógica', 'Ambas são igualmente fáceis', 'Nenhuma, o SGBD sempre garante as duas'], a: 1, exp: 'As aplicações dependem da estrutura lógica, por isso a independência lógica é mais difícil.' },
      ],
    },
    {
      id: '1-3', type: 'quiz', diff: 1, tag: 'modelagem', theory: 'modelagem', title: 'Modelagem conceitual e lógica', desc: 'Etapas do projeto, abstrações, estratégias.',
      intro: '<p>Etapas do projeto de BD, mecanismos de abstração e diretrizes de modelagem.</p>',
      questions: [
        { q: 'Qual a ordem correta das etapas do projeto de BD?', opts: ['Lógico → conceitual → físico → requisitos', 'Requisitos → conceitual → lógico → físico', 'Requisitos → lógico → conceitual → físico', 'Conceitual → requisitos → físico → lógico'], a: 1, exp: 'Requisitos → projeto conceitual (independente de SGBD) → lógico → físico (dependente do SGBD).' },
        { q: 'A abstração por <b>classificação</b> estabelece qual relação entre a classe e seus objetos?', opts: ['“é parte de”', '“é um”', '“é membro de”', '“depende de”'], a: 2, exp: 'Classificação: “é membro de” (a bicicleta da Bia é membro de BICICLETA). Agregação: “é parte de”. Generalização: “é um”.' },
        { q: 'Estratégia que começa pelos conceitos centrais do negócio e se expande para a periferia:', opts: ['Top-down', 'Bottom-up', 'Inside-out', 'Mista'], a: 2, exp: 'Inside-out é um caso especial do bottom-up.' },
        { q: 'Numa loja de tintas, cada COR tem código, nome e fabricante próprio, e várias latas usam a mesma cor. COR deve ser:', opts: ['Um atributo de LATA', 'Uma entidade relacionada a LATA', 'Uma especialização de LATA', 'Um atributo multivalorado'], a: 1, exp: 'Tem atributos próprios e se relaciona com outra entidade → entidade. Modelar como atributo é erro semântico.' },
        { q: '“Estudante de pós-graduação” deve ser uma especialização de ESTUDANTE quando…', opts: ['sempre que houver estudantes de pós', 'ele tiver atributos próprios ou participar de relacionamentos exclusivos (ex.: orientado por professor)', 'houver mais de 100 estudantes', 'nunca; use um atributo tipo'], a: 1, exp: 'Especialize quando o subgrupo tiver propriedades/relacionamentos específicos.' },
        { q: 'O modelo ER é um modelo…', opts: ['Conceitual', 'Lógico (de implementação)', 'Físico', 'Hierárquico'], a: 0, exp: 'ER é conceitual; o relacional é lógico.' },
      ],
    },
  ],
},
// =====================================================================
{
  id: 'w2', tag: 'er', theory: 'er', title: 'Mundo 2 — Modelo ER',
  desc: 'Do minimundo ao diagrama (notação brModelo).',
  levels: [
    {
      id: '2-1', type: 'quiz', diff: 1, title: 'Lendo cardinalidades', desc: 'A posição (mín,máx) usada em aula.',
      intro: `<p>Em aula usamos a posição de <b>Heuser/Chen</b> (a mesma do brModelo): o par (mín,máx) escrito <b>junto à entidade X</b> diz com quantos X <i>uma ocorrência da outra entidade</i> se associa.</p>
<pre>CLIENTE (1,1) ──&lt;faz&gt;── (0,n) PEDIDO</pre>`,
      questions: [
        { q: 'No diagrama acima, quantos pedidos um cliente pode fazer?', opts: ['Exatamente 1', 'De 0 a n', 'De 1 a n', 'Nenhum'], a: 1, exp: 'O par junto a PEDIDO é (0,n): um cliente faz de 0 a n pedidos.' },
        { q: 'No mesmo diagrama, um pedido é feito por quantos clientes?', opts: ['De 0 a n', 'Exatamente 1', 'De 1 a n', 'No máximo 1, podendo ser nenhum'], a: 1, exp: 'O par junto a CLIENTE é (1,1): todo pedido tem exatamente um cliente.' },
        { q: '“Todo empregado está lotado em exatamente um departamento; um departamento pode não ter empregados ou ter vários.” Qual par vai <b>junto a DEPARTAMENTO</b>?', opts: ['(0,n)', '(1,n)', '(1,1)', '(0,1)'], a: 2, exp: 'Um empregado → quantos departamentos? exatamente 1 → (1,1) junto a DEPARTAMENTO. Junto a EMPREGADO fica (0,n).' },
        { q: 'HOMEM (0,1) ──&lt;casa&gt;── (0,1) MULHER representa:', opts: ['1:1 com participação obrigatória dos dois lados', '1:1 com participação opcional dos dois lados', '1:n', 'n:m'], a: 1, exp: 'Máximas 1 e 1 → 1:1; mínimas 0 → ninguém é obrigado a casar.' },
        { q: 'A cardinalidade mínima 1 indica:', opts: ['Participação opcional', 'Participação obrigatória', 'Relacionamento ternário', 'Atributo identificador'], a: 1, exp: 'Mínima = participação: 0 opcional, 1 obrigatória.' },
        { q: 'No ternário MÉDICO–PRESCREVE–(PACIENTE, MEDICAMENTO), a pergunta “um médico atendendo um paciente pode prescrever quantos medicamentos?” determina o par escrito junto a…', opts: ['MÉDICO', 'PACIENTE', 'MEDICAMENTO', 'PRESCREVE'], a: 2, exp: 'No n-ário fixa-se o par das outras entidades e conta-se a terceira; a resposta vai junto à entidade contada (MEDICAMENTO).' },
      ],
    },
    {
      id: '2-2', type: 'er', diff: 1, title: 'Escola: binários 1:n', desc: 'Professor, turma e aluno.',
      intro: `<p><b>Minimundo — Sistema de Gestão Escolar</b> (exercício de aula)</p>
<ul><li>A escola possui vários <b>professores</b>. De cada professor cadastra-se o CPF (único), o nome e o telefone.</li>
<li>Cada professor pode lecionar em uma ou mais <b>turmas</b>, mas uma turma é lecionada por apenas um professor.</li>
<li>Cada turma possui um código (único), um ano letivo e uma sala.</li>
<li>Cada turma é composta por vários <b>alunos</b> (pelo menos um), e um aluno está matriculado em apenas uma turma (considere só o ano corrente).</li>
<li>De cada aluno guarda-se a matrícula (única), o nome e a data de nascimento.</li></ul>
<p>Desenhe o diagrama ER no editor ao lado.</p>`,
      steps: [
        { t: 'Identifique as entidades', html: 'Substantivos com identidade própria: <b>PROFESSOR</b>, <b>TURMA</b>, <b>ALUNO</b>. Use a ferramenta <i>Entidade</i> e clique no espaço vazio; renomeie no painel da direita.' },
        { t: 'Atributos e identificadores', html: 'Com <i>Identificador</i> clique na entidade para criar o atributo ● (cpf, código, matrícula). Com <i>Atributo</i> crie os demais (○).' },
        { t: 'Relacionamentos', html: 'Verbos que ligam entidades: PROFESSOR <b>leciona</b> TURMA; TURMA <b>possui</b> ALUNO. Crie os losangos e use <i>Ligar</i> (clique no losango e depois na entidade).' },
        { t: 'Cardinalidades', html: S_CARD('PROFESSOR', 'TURMA') + '<br>Ex.: um professor leciona 1..n turmas → <code>(1,n)</code> junto a TURMA; uma turma tem exatamente 1 professor → <code>(1,1)</code> junto a PROFESSOR.' },
        { t: 'Verifique', html: 'Clique em <b>Verificar modelo</b>. O corretor aceita sinônimos comuns de nomes.' },
      ],
      gabarito: {
        entities: [
          { name: 'PROFESSOR', at: [0, 0], attrs: ['#cpf', 'nome', 'telefone|fone'] },
          { name: 'TURMA|CLASSE', at: [2, 0], attrs: ['#codigo|codTurma|codigoTurma|cod', 'anoLetivo|ano', 'sala'] },
          { name: 'ALUNO', at: [4, 0], attrs: ['#matricula', 'nome', 'dataNascimento|dataNasc|nascimento|datanascimento'] },
        ],
        rels: [
          { name: 'leciona|ministra|da_aula|ensina', at: [1, 0], links: [['PROFESSOR', '(1,1)'], ['TURMA', '(1,n)']] },
          { name: 'possui|pertence|compoe|tem|matricula|matriculado', at: [3, 0], links: [['TURMA', '(1,1)'], ['ALUNO', '(1,n)']] },
        ],
      },
      explain: '<p>Leitura: <i>um professor leciona de 1 a n turmas</i> (junto a TURMA); <i>uma turma é lecionada por exatamente 1 professor</i> (junto a PROFESSOR). Os dois relacionamentos são <b>1:n</b>.</p>',
    },
    {
      id: '2-3', type: 'er', diff: 1, title: 'Streaming: n:m com atributo', desc: 'Atributo que pertence ao relacionamento.',
      intro: `<p><b>Minimundo — Plataforma de Streaming de Música</b></p>
<ul><li>O sistema cadastra <b>artistas</b>: ID (único), nome artístico e país de origem.</li>
<li>Um artista pode lançar vários <b>álbuns</b> (ou nenhum ainda), mas cada álbum pertence a um único artista.</li>
<li>De cada álbum registra-se o ID (único), o título e o ano de lançamento.</li>
<li><b>Usuários</b> têm ID (único), nome e e-mail.</li>
<li>Um usuário pode favoritar vários álbuns, e um álbum pode ser favoritado por diversos usuários (ambos opcionais). Quando um usuário favorita um álbum, registra-se a <b>data do favorito</b>.</li></ul>`,
      steps: [
        { t: 'Entidades', html: 'ARTISTA, ÁLBUM e USUÁRIO.' },
        { t: 'Onde fica a data do favorito?', html: 'A data não descreve só o usuário nem só o álbum — descreve o <b>par</b> (usuário, álbum). Logo é atributo do <b>relacionamento</b> favorita. Colocá-la numa entidade é erro semântico.' },
        { t: 'Cardinalidades', html: 'lança: um artista lança 0..n álbuns → <code>(0,n)</code> junto a ÁLBUM; um álbum tem exatamente 1 artista → <code>(1,1)</code> junto a ARTISTA.<br>favorita: <code>(0,n)</code> dos dois lados (n:m).' },
      ],
      gabarito: {
        entities: [
          { name: 'ARTISTA', at: [0, 0], attrs: ['#idArtista|id|codigo|codArtista', 'nomeArtistico|nome', 'paisOrigem|pais'] },
          { name: 'ÁLBUM|ALBUM|DISCO', at: [2, 0], attrs: ['#idAlbum|id|codigo|codAlbum', 'titulo|nome', 'anoLancamento|ano'] },
          { name: 'USUÁRIO|USUARIO|OUVINTE', at: [4, 0], attrs: ['#idUsuario|id|codigo|codUsuario', 'nome', 'email|e_mail'] },
        ],
        rels: [
          { name: 'lança|lanca|lancamento|grava|publica|possui', at: [1, 0], links: [['ARTISTA', '(1,1)'], ['ÁLBUM', '(0,n)']] },
          { name: 'favorita|favorito|curte', at: [3, 0], links: [['ÁLBUM', '(0,n)'], ['USUÁRIO', '(0,n)']], attrs: ['dataFavorito|data|dataFav'] },
        ],
      },
      explain: '<p>O enunciado menciona playlists, mas não dá atributos nem regras para elas — não é necessário modelá-las aqui (completude se verifica pelas consultas pedidas).</p>',
    },
    {
      id: '2-4', type: 'er', diff: 1, title: 'Clínica veterinária: 1:1', desc: 'Participações obrigatórias.',
      intro: `<p><b>Minimundo — Clínica Veterinária</b></p>
<ul><li>A clínica atende <b>tutores</b> (donos): CPF (único), nome e endereço.</li>
<li>Um tutor possui um ou vários <b>pacientes</b> (animais), mas cada paciente pertence a apenas um tutor.</li>
<li>Do paciente: ID do pet (único), nome, espécie e raça.</li>
<li>Cada paciente possui exatamente uma <b>carteira de vacinação</b>, e cada carteira pertence exclusivamente a um paciente.</li>
<li>A carteira tem número de registro (único) e data de emissão.</li></ul>`,
      steps: [
        { t: 'Entidades', html: 'TUTOR, PACIENTE e CARTEIRA (de vacinação) — a carteira tem identificador próprio, então é entidade.' },
        { t: 'Tutor–Paciente (1:n)', html: 'Um tutor possui 1..n pacientes → <code>(1,n)</code> junto a PACIENTE. Um paciente tem 1 tutor → <code>(1,1)</code> junto a TUTOR.' },
        { t: 'Paciente–Carteira (1:1)', html: '<code>(1,1)</code> nos dois lados: obrigatório e exclusivo.' },
      ],
      gabarito: {
        entities: [
          { name: 'TUTOR|DONO', at: [0, 0], attrs: ['#cpf', 'nome', 'endereco'] },
          { name: 'PACIENTE|PET|ANIMAL', at: [2, 0], attrs: ['#idPet|id|codigo', 'nome', 'especie', 'raca'] },
          { name: 'CARTEIRA|CARTEIRA_VACINACAO|CARTEIRADEVACINACAO', at: [4, 0], attrs: ['#numRegistro|numero|registro|nRegistro', 'dataEmissao|emissao|data'] },
        ],
        rels: [
          { name: 'possui|pertence|tem|cuida', at: [1, 0], links: [['TUTOR', '(1,1)'], ['PACIENTE', '(1,n)']] },
          { name: 'tem|possui|registra|vacinacao', at: [3, 0], links: [['PACIENTE', '(1,1)'], ['CARTEIRA', '(1,1)']] },
        ],
      },
      explain: '<p>No mapeamento, um 1:1 com (1,1) dos dois lados permite fundir PACIENTE e CARTEIRA numa só tabela (o número da carteira vira chave candidata).</p>',
    },
    {
      id: '2-5', type: 'er', diff: 2, title: 'Empresa completa', desc: 'Fraca, multivalorado, composto, dois relacionamentos no mesmo par.',
      intro: `<p><b>Minimundo — Empresa</b> (base do script <code>emp</code> da disciplina)</p>
<ul><li>A empresa é organizada em <b>departamentos</b>, com sigla (única) e nome.</li>
<li>Cada <b>empregado</b> tem matrícula (única), nome, data de nascimento, endereço (rua, número e cidade) e <b>um ou mais telefones</b>.</li>
<li>Todo empregado é lotado em exatamente um departamento; todo departamento tem pelo menos um empregado lotado.</li>
<li>Cada departamento é gerenciado por exatamente um empregado; um empregado gerencia no máximo um departamento.</li>
<li><b>Projetos</b> (código único, nome, localização) são controlados por exatamente um departamento; um departamento controla vários projetos ou nenhum.</li>
<li>Empregados trabalham em vários projetos (ou nenhum), registrando as <b>horas</b> semanais; todo projeto tem pelo menos um empregado.</li>
<li><b>Dependentes</b> de um empregado (nome, sexo, data de nascimento, parentesco) só existem vinculados a ele e são identificados pelo nome <i>dentro</i> do empregado.</li></ul>`,
      steps: [
        { t: 'Atributos especiais de EMPREGADO', html: 'Endereço é <b>composto</b>: crie o atributo endereco e, clicando nele com a ferramenta Atributo, crie rua, numero e cidade. Telefone é <b>multivalorado</b>: no painel do atributo escolha a cardinalidade <code>(1,n)</code>.' },
        { t: 'Dois relacionamentos entre EMPREGADO e DEPARTAMENTO', html: '“Lotação” e “gerência” são fatos diferentes — fundi-los é erro semântico. Crie dois losangos.' },
        { t: 'Entidade fraca', html: 'DEPENDENTE não tem identificador próprio: marque <i>Entidade fraca</i>, marque <b>nome</b> como identificador (parcial) e ligue-o a EMPREGADO por um relacionamento (possui) com <code>(1,1)</code> junto a EMPREGADO.' },
        { t: 'Cardinalidades', html: 'lotação: <code>(1,1)</code> junto a DEPARTAMENTO, <code>(1,n)</code> junto a EMPREGADO.<br>gerencia: cada depto tem exatamente 1 gerente → <code>(1,1)</code> junto a EMPREGADO; um empregado gerencia 0 ou 1 depto → <code>(0,1)</code> junto a DEPARTAMENTO.<br>controla: <code>(1,1)</code> junto a DEPARTAMENTO, <code>(0,n)</code> junto a PROJETO.<br>trabalha (atributo horas): <code>(0,n)</code> junto a PROJETO, <code>(1,n)</code> junto a EMPREGADO.' },
      ],
      gabarito: {
        entities: [
          { name: 'EMPREGADO|FUNCIONARIO', at: [0, 1], attrs: ['#matricula', 'nome', 'dataNasc|dataNascimento|nascimento|datanasc', 'endereco{rua,numero,cidade}', 'telefone(1,n)|telefones|fone'] },
          { name: 'DEPARTAMENTO|DEPTO', at: [2.2, 1], attrs: ['#sigla', 'nome'] },
          { name: 'PROJETO', at: [2.2, 2.9], attrs: ['#codigo|pcodigo|codProjeto', 'nome|pnome', 'localizacao|local|plocalizacao'] },
          { name: 'DEPENDENTE', at: [0, 3], weak: true, attrs: ['#nome|depnome', 'sexo', 'dataNasc|dataNascimento|nascimento', 'parentesco'] },
        ],
        rels: [
          { name: 'lotação|lotacao|lotado|trabalha_em_depto|pertence', at: [1.1, 0.45], links: [['EMPREGADO', '(1,n)'], ['DEPARTAMENTO', '(1,1)']] },
          { name: 'gerencia|gerente|chefia', at: [1.1, 1.55], links: [['EMPREGADO', '(1,1)'], ['DEPARTAMENTO', '(0,1)']] },
          { name: 'controla|coordena|possui', at: [2.2, 1.95], links: [['DEPARTAMENTO', '(1,1)'], ['PROJETO', '(0,n)']] },
          { name: 'trabalha|trabalha_em|alocacao|participa', at: [1.1, 2.35], links: [['EMPREGADO', '(1,n)'], ['PROJETO', '(0,n)']], attrs: ['horas'] },
          { name: 'possui|tem|dependencia', at: [0, 2], links: [['EMPREGADO', '(1,1)'], ['DEPENDENTE', '(0,n)']] },
        ],
      },
      explain: '<p>Pontos de atenção: (1) <b>horas</b> é do relacionamento trabalha; (2) lotação e gerência são relacionamentos distintos; (3) DEPENDENTE é fraca — seu identificador é misto (matrícula do empregado + nome).</p>',
    },
    {
      id: '2-6', type: 'er', diff: 2, title: 'Prescrição: ternário', desc: 'Quando três entidades são indissociáveis.',
      intro: `<p><b>Minimundo — Prescrição Médica Hospitalar</b> (exercício de aula)</p>
<ul><li><b>Médicos</b>: CRM (único) e nome. <b>Pacientes</b>: CPF (único) e nome.</li>
<li><b>Medicamentos</b>: código (único), nome comercial e princípio ativo.</li>
<li>Um médico prescreve um medicamento para um paciente. Um médico pode prescrever vários medicamentos para o mesmo paciente; vários médicos podem prescrever o mesmo medicamento para pacientes diferentes.</li>
<li>Para cada prescrição armazena-se a data/hora, a dosagem e a posologia.</li>
<li>Médicos, pacientes e medicamentos podem estar cadastrados sem nenhuma prescrição.</li></ul>`,
      steps: [
        { t: 'Por que ternário?', html: 'O fato “prescrição” só tem sentido com médico, paciente <b>e</b> medicamento juntos. Três binários causariam armadilha de conexão (não saberíamos qual médico prescreveu qual remédio a qual paciente).' },
        { t: 'Crie um único losango ligado às três entidades', html: 'Use <i>Ligar</i> três vezes a partir do mesmo losango. Os atributos dataHora, dosagem e posologia ficam no relacionamento.' },
        { t: 'Cardinalidade fixando pares', html: '(médico, paciente) → vários medicamentos; (médico, medicamento) → vários pacientes; (paciente, medicamento) → vários médicos. Todas as máximas são n; mínimas 0 (podem existir sem prescrição).' },
      ],
      gabarito: {
        entities: [
          { name: 'MÉDICO|MEDICO', at: [0, 0], attrs: ['#crm', 'nome'] },
          { name: 'PACIENTE', at: [2, 0], attrs: ['#cpf', 'nome'] },
          { name: 'MEDICAMENTO|REMEDIO', at: [1, 1.2], attrs: ['#codMedicamento|codigo|cod', 'nomeComercial|nome', 'principioAtivo|principio'] },
        ],
        rels: [
          { name: 'prescreve|prescricao|receita', at: [1, 0], lenientMin: true, links: [['MÉDICO', '(0,n)'], ['PACIENTE', '(0,n)'], ['MEDICAMENTO', '(0,n)']], attrs: ['dataHora|data', 'dosagem|dose', 'posologia'] },
        ],
      },
      explain: '<p>Cardinalidade do ternário: N:M:P (todas as pontas “muitos”). No mapeamento vira a tabela PRESCRICAO com as três chaves estrangeiras compondo a chave primária.</p>',
    },
    {
      id: '2-7', type: 'er', diff: 3, title: 'Universidade: especialização e auto-relacionamento', desc: 'Herança (t,e), orientação e pré-requisitos.',
      intro: `<p><b>Minimundo — Universidade</b></p>
<ul><li>Toda <b>pessoa</b> cadastrada tem CPF (único), nome e um ou mais e-mails.</li>
<li>Toda pessoa é <b>aluno</b> ou <b>professor</b>, nunca ambos. Do aluno guarda-se o ano de ingresso; do professor, a titulação.</li>
<li>Um professor pode orientar vários alunos; um aluno tem no máximo um orientador (pode não ter).</li>
<li><b>Disciplinas</b> têm código (único) e nome. Uma disciplina pode ter várias disciplinas como pré-requisito e ser pré-requisito de várias outras.</li></ul>`,
      steps: [
        { t: 'Especialização', html: 'Crie PESSOA com cpf (●), nome e email <code>(1,n)</code>. Com a ferramenta <i>Especialização</i> clique em PESSOA; depois ligue o triângulo a ALUNO e a PROFESSOR. Cobertura: toda pessoa é um dos dois (<b>total</b>) e nunca ambos (<b>exclusiva</b>) → <code>(t,e)</code>.' },
        { t: 'Atributos herdados', html: 'ALUNO e PROFESSOR herdam cpf e nome — não repita. Coloque só os específicos (anoIngresso, titulacao).' },
        { t: 'orienta', html: 'Um aluno tem no máximo 1 orientador → <code>(0,1)</code> junto a PROFESSOR; um professor orienta 0..n alunos → <code>(0,n)</code> junto a ALUNO. O relacionamento é com as entidades <b>específicas</b>.' },
        { t: 'Auto-relacionamento', html: 'Crie o losango pre_requisito e ligue-o <b>duas vezes</b> a DISCIPLINA. Dê papéis às ligações (ex.: requisito / dependente). Ambos <code>(0,n)</code>.' },
      ],
      gabarito: {
        entities: [
          { name: 'PESSOA', at: [1, 0], attrs: ['#cpf', 'nome', 'email(1,n)|emails'] },
          { name: 'ALUNO|ESTUDANTE', at: [0, 1.4], attrs: ['anoIngresso|ingresso|ano'] },
          { name: 'PROFESSOR|DOCENTE', at: [2, 1.4], attrs: ['titulacao|titulo'] },
          { name: 'DISCIPLINA', at: [3.6, 0], attrs: ['#codigo|codDisciplina|cod', 'nome'] },
        ],
        specs: [{ parent: 'PESSOA', kind: 't,e', children: ['ALUNO', 'PROFESSOR'] }],
        rels: [
          { name: 'orienta|orientacao|orientador', at: [1, 2.3], links: [['PROFESSOR', '(0,1)'], ['ALUNO', '(0,n)']] },
          { name: 'pre_requisito|prerequisito|requisito|requer|depende', at: [3.6, 1.2], links: [['DISCIPLINA', '(0,n)', 'requisito'], ['DISCIPLINA', '(0,n)', 'dependente']] },
        ],
      },
      explain: '<p>Se uma pessoa pudesse ser aluno e professor ao mesmo tempo (monitor), a cobertura seria <b>(t,i)</b>. Se pudessem existir pessoas que não são nem um nem outro, seria parcial (p,…).</p>',
    },
    {
      id: '2-8', type: 'quiz', diff: 2, title: 'Verificação de esquemas', desc: 'Erro sintático × semântico, redundância, aspecto temporal.',
      intro: '<p>Critérios de verificação: correção (sintática e semântica), completude, redundância e aspecto temporal — como na dinâmica de aula.</p>',
      questions: [
        { q: 'Um diagrama tem a entidade FESTA com atributos data e local, mas nenhum atributo identificador. Isso é:', opts: ['Erro sintático', 'Erro semântico', 'Redundância', 'Nenhum erro'], a: 0, exp: 'Regra do modelo ER: toda entidade tem (ou herda) identificador. Violar uma regra do modelo = erro sintático.' },
        { q: 'TIPO DE EVENTO especializa-se em ANIVERSÁRIO e CASAMENTO, e o atributo <b>porte</b>, comum aos dois, foi colocado em cada especialização. Isso é:', opts: ['Correto', 'Erro sintático (atributos comuns devem ficar na genérica)', 'Erro de redundância temporal', 'Erro de completude'], a: 1, exp: 'Atributos comuns a todas as especializações ficam na entidade genérica (conforme a dinâmica de aula).' },
        { q: '“Uma festa (com data específica) é contratada por exatamente um cliente”, mas o diagrama permite que a festa seja contratada por vários clientes. Isso é:', opts: ['Erro sintático', 'Erro semântico', 'Redundância', 'Aspecto temporal'], a: 1, exp: 'O diagrama é válido no ER, mas contradiz o minimundo → erro semântico (cardinalidade errada).' },
        { q: 'O atributo <b>tot_emp</b> em DEPARTAMENTO, que pode ser obtido contando os empregados lotados, caracteriza:', opts: ['Completude', 'Redundância (atributo derivado)', 'Erro sintático', 'Entidade fraca'], a: 1, exp: 'Atributo calculável a partir de outros elementos do esquema é redundante.' },
        { q: 'A empresa precisa guardar o histórico de cargos de cada empregado. O relacionamento EMPREGADO (1,1)–ocupa–(1,n) CARGO deve…', opts: ['permanecer igual', 'virar n:m com atributo data (aspecto temporal)', 'virar especialização', 'ser eliminado'], a: 1, exp: 'Relacionamentos 1:1 ou 1:n que mudam no tempo tornam-se n:m com atributo de tempo.' },
        { q: 'PESSOA “se relaciona com” CIDADE para representar tanto onde a pessoa <i>mora</i> quanto onde <i>nasceu</i>. O problema é:', opts: ['Erro semântico — fundir dois relacionamentos diferentes em um', 'Erro sintático', 'Nenhum', 'Redundância de atributo'], a: 0, exp: 'Morar e nascer são fatos distintos: dois relacionamentos.' },
      ],
    },
  ],
},
// =====================================================================
{
  id: 'w3', tag: 'mapeamento', theory: 'mapeamento', title: 'Mundo 3 — Modelo relacional e mapeamento',
  desc: 'Chaves, restrições e as regras ER → relacional.',
  levels: [
    {
      id: '3-1', type: 'quiz', diff: 1, tag: 'relacional', theory: 'relacional', title: 'Chaves e restrições', desc: 'Superchave, candidata, PK, FK e integridade.',
      intro: '<p>Conceitos do modelo relacional e restrições de integridade.</p>',
      questions: [
        { q: 'Uma <b>chave candidata</b> é:', opts: ['qualquer conjunto de atributos', 'uma superchave mínima', 'a chave estrangeira', 'um atributo que aceita nulo'], a: 1, exp: 'Superchave = não repete. Candidata = superchave da qual não se pode retirar nenhum atributo.' },
        { q: 'Inserir uma tupla com chave primária NULL viola a restrição de integridade…', opts: ['de domínio', 'de entidade', 'referencial', 'semântica'], a: 1, exp: 'Integridade de entidade: PK nunca é nula.' },
        { q: 'Inserir um empregado com depto = \'XYZ\', que não existe em DEPARTAMENTO, viola a integridade…', opts: ['de chave', 'de entidade', 'referencial', 'de domínio'], a: 2, exp: 'A FK precisa referenciar um valor existente (ou ser nula).' },
        { q: 'O <b>grau</b> de uma relação é:', opts: ['o número de tuplas', 'o número de atributos', 'o número de chaves', 'o número de FKs'], a: 1, exp: 'Grau = aridade (colunas). Cardinalidade = número de tuplas.' },
        { q: 'Sobre a ordem das tuplas numa relação:', opts: ['é a ordem de inserção', 'não existe — a relação é um conjunto', 'é a ordem da chave primária', 'é alfabética'], a: 1, exp: 'Relação = conjunto: sem ordem e sem duplicatas.' },
        { q: 'A FK <code>depto</code> de EMPREGADO foi criada com <code>ON DELETE SET NULL</code>. Ao apagar um departamento:', opts: ['o DELETE é recusado', 'os empregados dele também são apagados', 'os empregados dele ficam com depto nulo', 'nada acontece com os empregados'], a: 2, exp: 'SET NULL anula as referências. CASCADE apagaria; RESTRICT recusaria.' },
        { q: 'Ao adotar uma chave artificial (surrogate) como PK, o que se deve fazer com a chave natural (ex.: CPF)?', opts: ['Apagá-la', 'Declará-la como chave candidata (UNIQUE)', 'Transformá-la em FK', 'Nada'], a: 1, exp: 'Mantém-se a natural como candidata para busca e unicidade.' },
      ],
    },
    {
      id: '3-2', type: 'map', diff: 1, title: 'Mapeando 1:n e n:m', desc: 'FK no lado n; tabela própria para n:m.',
      intro: '<p>Transforme o esquema ER abaixo em esquema relacional (notação resumida). Lembre: em <code>EMPREGADO (1,n)—lotação—(1,1) DEPARTAMENTO</code>, cada empregado tem no máximo 1 departamento.</p>',
      steps: [
        { t: 'Uma tabela por entidade', html: 'EMPREGADO, DEPARTAMENTO e PROJETO com seus identificadores como PK (<code>#</code>).' },
        { t: '1:n → FK no lado n', html: 'O lado com máxima 1 por ocorrência é EMPREGADO (cada empregado → 1 departamento). Acrescente <code>sigla</code> em EMPREGADO e escreva <code>sigla referencia DEPARTAMENTO</code>.' },
        { t: 'n:m → nova tabela', html: 'TRABALHA (#matricula, #codigo, horas): PK composta pelas PKs das duas entidades, cada uma também FK. O atributo do relacionamento (horas) vai junto.' },
      ],
      diagram: {
        entities: [
          { name: 'EMPREGADO', at: [0, 0], attrs: ['#matricula', 'nome', 'salario'] },
          { name: 'DEPARTAMENTO', at: [2, 0], attrs: ['#sigla', 'nome'] },
          { name: 'PROJETO', at: [0, 1.6], attrs: ['#codigo', 'nome'] },
        ],
        rels: [
          { name: 'lotação', at: [1, 0], links: [['EMPREGADO', '(1,n)'], ['DEPARTAMENTO', '(1,1)']] },
          { name: 'trabalha', at: [0, 0.8], links: [['EMPREGADO', '(1,n)'], ['PROJETO', '(0,n)']], attrs: ['horas'] },
        ],
      },
      gabarito: `DEPARTAMENTO|DEPTO (#sigla, nome)
EMPREGADO|FUNCIONARIO (#matricula|mat, nome, salario, sigla|siglaDepto|depto|siglaDepartamento|departamento)
  sigla referencia DEPARTAMENTO
PROJETO (#codigo|codProjeto|codigoProjeto|cod, nome)
TRABALHA|TRABALHA_EM|TRABALHAEM|ALOCACAO|EMPREGADO_PROJETO (#matricula|mat|matEmp|matriculaEmpregado|empregado, #codigo|codProjeto|codigoProjeto|projeto|cod, horas)
  matricula referencia EMPREGADO
  codigo referencia PROJETO`,
      explain: '<p>Como DEPARTAMENTO tem mínima 1 em EMPREGADO, a FK <code>sigla</code> é obrigatória (NOT NULL). O n:m vira tabela independentemente das cardinalidades mínimas.</p>',
    },
    {
      id: '3-3', type: 'map', diff: 2, title: 'Mapeando 1:1, multivalorado e composto', desc: 'Fusão, nova tabela para multivalorado.',
      intro: '<p>Mapeie o esquema. Decisões de projeto pedidas: <b>funda</b> PACIENTE e CARTEIRA numa única tabela (1:1 com (1,1) dos dois lados), elimine o atributo composto e trate o multivalorado.</p>',
      steps: [
        { t: 'Atributo composto', html: 'endereco{rua, numero, cidade} → colunas <code>rua, numero, cidade</code> em TUTOR (elimina-se o nível intermediário).' },
        { t: 'Atributo multivalorado', html: 'telefone (1,n) → nova tabela <code>TELEFONE_TUTOR (#cpf, #telefone)</code>, com <code>cpf referencia TUTOR</code>.' },
        { t: '1:n', html: 'Cada paciente tem 1 tutor → FK <code>cpf</code> (ou cpfTutor) em PACIENTE.' },
        { t: '1:1 com fusão', html: 'Junte os atributos da carteira em PACIENTE: <code>numRegistro, dataEmissao</code>; declare <code>numRegistro é chave candidata</code>.' },
      ],
      diagram: {
        entities: [
          { name: 'TUTOR', at: [0, 0], attrs: ['#cpf', 'nome', 'endereco{rua,numero,cidade}', 'telefone(1,n)'] },
          { name: 'PACIENTE', at: [2, 0], attrs: ['#idPet', 'nome', 'especie'] },
          { name: 'CARTEIRA', at: [2, 1.5], attrs: ['#numRegistro', 'dataEmissao'] },
        ],
        rels: [
          { name: 'possui', at: [1, 0], links: [['TUTOR', '(1,1)'], ['PACIENTE', '(1,n)']] },
          { name: 'tem', at: [2, 0.75], links: [['PACIENTE', '(1,1)'], ['CARTEIRA', '(1,1)']] },
        ],
      },
      gabarito: `TUTOR|DONO (#cpf, nome, rua, numero, cidade)
TELEFONE_TUTOR|TELEFONE|TELEFONES|TUTOR_TELEFONE|FONE (#cpf|cpfTutor|tutor, #telefone|fone|numeroTelefone)
  cpf referencia TUTOR
PACIENTE|PET (#idPet|id, nome, especie, cpf|cpfTutor|tutor, numRegistro|registro|numCarteira|numeroRegistro, dataEmissao|emissao)
  cpf referencia TUTOR
  numRegistro é chave candidata`,
      explain: '<p>Alternativa (sem fusão): CARTEIRA (#numRegistro, dataEmissao, idPet) com <code>idPet referencia PACIENTE</code> e <code>idPet é chave candidata</code> (UNIQUE) — garante o 1:1.</p>',
    },
    {
      id: '3-4', type: 'map', diff: 2, title: 'Mapeando fraca e auto-relacionamento', desc: 'Identificador externo e FK para a própria tabela.',
      intro: '<p>Mapeie o esquema. Para o auto-relacionamento 1:n, use a solução com tolerância a nulos (FK na própria tabela).</p>',
      steps: [
        { t: 'Entidade fraca', html: 'DEPENDENTE recebe a PK da forte: <code>DEPENDENTE (#matricula, #nome, parentesco)</code> com <code>matricula referencia EMPREGADO</code>.' },
        { t: 'Auto-relacionamento 1:n', html: 'Cada empregado tem no máximo 1 supervisor → coluna <code>matSupervisor</code> em EMPREGADO, <code>matSupervisor referencia EMPREGADO</code> (admite nulo).' },
      ],
      diagram: {
        entities: [
          { name: 'EMPREGADO', at: [0, 0], attrs: ['#matricula', 'nome', 'salario'] },
          { name: 'DEPENDENTE', at: [2, 0], weak: true, attrs: ['#nome', 'parentesco'] },
        ],
        rels: [
          { name: 'possui', at: [1, 0], links: [['EMPREGADO', '(1,1)'], ['DEPENDENTE', '(0,n)']] },
          { name: 'supervisiona', at: [0, 1.1], links: [['EMPREGADO', '(0,1)', 'supervisor'], ['EMPREGADO', '(0,n)', 'supervisionado']] },
        ],
      },
      gabarito: `EMPREGADO|FUNCIONARIO (#matricula|mat, nome, salario, matSupervisor|supervisor|matSup|supermat|matriculaSupervisor|chefe|matChefe)
  matSupervisor referencia EMPREGADO
DEPENDENTE (#matricula|mat|matEmp|matriculaEmpregado|empregado, #nome|nomeDependente|depnome, parentesco)
  matricula referencia EMPREGADO`,
      explain: '<p>Sem tolerância a nulos, o auto-relacionamento viraria a tabela <code>SUPERVISIONA (#matSub, matSupervisor)</code>, cuja PK é o lado que participa no máximo uma vez.</p>',
    },
    {
      id: '3-5', type: 'map', diff: 3, title: 'Mapeando ternário e especialização', desc: 'Distribuição com coluna tipo; tabela do n-ário.',
      intro: '<p>Mapeie o esquema usando <b>distribuição</b> para a hierarquia (uma tabela para a genérica, com coluna <code>tipo</code>, e uma para cada específica).</p>',
      steps: [
        { t: 'Hierarquia por distribuição', html: '<code>PESSOA (#cpf, nome, tipo)</code>; <code>MEDICO (#cpf, crm)</code> e <code>PACIENTE (#cpf, planoSaude)</code>, onde o cpf das específicas é PK <b>e</b> FK para PESSOA.' },
        { t: 'Ternário', html: 'Nova tabela com as chaves das três participantes (cada uma FK) e os atributos do relacionamento. Como todas as máximas são n, a PK é formada pelas três.' },
        { t: 'Atenção às referências', html: 'A prescrição referencia MEDICO e PACIENTE (as específicas), não PESSOA.' },
      ],
      diagramHeight: 440,
      diagram: {
        entities: [
          { name: 'PESSOA', at: [1, 0], attrs: ['#cpf', 'nome'] },
          { name: 'MÉDICO', at: [0, 1.2], attrs: ['crm'] },
          { name: 'PACIENTE', at: [2, 1.2], attrs: ['planoSaude'] },
          { name: 'MEDICAMENTO', at: [1, 2.9], attrs: ['#codigo', 'nome'] },
        ],
        specs: [{ parent: 'PESSOA', kind: 't,e', children: ['MÉDICO', 'PACIENTE'] }],
        rels: [{ name: 'prescreve', at: [1, 2], links: [['MÉDICO', '(0,n)'], ['PACIENTE', '(0,n)'], ['MEDICAMENTO', '(0,n)']], attrs: ['data', 'dosagem'] }],
      },
      gabarito: `PESSOA (#cpf, nome, tipo)
MEDICO|MÉDICO (#cpf|cpfMedico, crm)
  cpf referencia PESSOA
  crm é chave candidata
PACIENTE (#cpf|cpfPaciente, planoSaude|plano)
  cpf referencia PESSOA
MEDICAMENTO|REMEDIO (#codigo|codMedicamento|cod, nome)
PRESCRICAO|PRESCREVE|RECEITA (#cpfMedico|cpfMed|medico|crm, #cpfPaciente|cpfPac|paciente, #codigo|codMedicamento|medicamento|cod, data, dosagem)
  cpfMedico referencia MEDICO
  cpfPaciente referencia PACIENTE
  codigo referencia MEDICAMENTO`,
      explain: '<p>Por que manter <code>tipo</code> na genérica? Para saber a qual específica a pessoa pertence sem varrer todas as tabelas e para conferir a cobertura total/exclusiva. Na <b>fusão</b>, tudo iria para PESSOA (crm e planoSaude opcionais) — mais nulos e menos restrições garantidas.</p><p>Se fosse preciso registrar o mesmo remédio várias vezes para o mesmo par médico-paciente, <code>data</code> entraria na PK.</p>',
    },
    {
      id: '3-6', type: 'map', diff: 3, title: 'Exercício de mapeamento (Heuser)', desc: 'Locadora: o exercício resolvido em aula.',
      intro: '<p>Esquema do exercício de mapeamento da aula (locadora de veículos). Use distribuição na hierarquia TIPO_VEICULO, com coluna de subtipo na genérica. CONTRATO é numerado <i>dentro</i> de cada escritório (entidade fraca) e CLIENTE é identificado pela habilitação: número + estado.</p>',
      steps: [
        { t: 'Identificador externo', html: 'CONTRATO é fraca de ESCRITORIO: PK = (numEsc, numCon).' },
        { t: 'Identificador composto', html: 'CLIENTE (#numHab, #estadoHab, …). Quem referencia CLIENTE usa FK composta: <code>(numHab, estadoHab) referencia CLIENTE</code>.' },
        { t: 'Relacionamentos 1:n', html: 'gerencia (escritório→contrato) já vem pela PK da fraca; realiza → FK composta do cliente em CONTRATO; aloca → FK numVeic em CONTRATO; tipo → FK codTipo em VEICULO.' },
        { t: 'Hierarquia e auto-relacionamento n:m', html: 'AUTOMOVEL e ONIBUS com PK = codTipo (FK para TIPO_VEICULO). SIMILARIDADE (n:m de TIPO_VEICULO com ele mesmo) → tabela com duas FKs para TIPO_VEICULO.' },
      ],
      diagramHeight: 520,
      diagram: {
        entities: [
          { name: 'ESCRITORIO', at: [0, 0], attrs: ['#num', 'local'] },
          { name: 'CONTRATO', at: [2, 0], weak: true, attrs: ['#numero', 'data', 'duracao'] },
          { name: 'CLIENTE', at: [4, 0], attrs: ['#numHab', '#estadoHab', 'nome', 'endereco', 'telefone'] },
          { name: 'VEICULO', at: [2, 1.4], attrs: ['#numero', 'dataProxManut', 'placa'] },
          { name: 'TIPO_VEICULO', at: [2, 2.8], attrs: ['#codigo', 'nome', 'arCond'] },
          { name: 'AUTOMOVEL', at: [1, 4.1], attrs: ['numPortas', 'dirHidraulica', 'cambioAuto'] },
          { name: 'ONIBUS', at: [3, 4.1], attrs: ['numPassageiros', 'leito', 'sanitario'] },
        ],
        specs: [{ parent: 'TIPO_VEICULO', kind: 't,e', children: ['AUTOMOVEL', 'ONIBUS'] }],
        rels: [
          { name: 'gerencia', at: [1, 0], links: [['ESCRITORIO', '(1,1)'], ['CONTRATO', '(0,n)']] },
          { name: 'realiza', at: [3, 0], links: [['CONTRATO', '(1,n)'], ['CLIENTE', '(1,1)']] },
          { name: 'aloca', at: [2, 0.7], links: [['CONTRATO', '(0,n)'], ['VEICULO', '(1,1)']] },
          { name: 'tipo', at: [2, 2.1], links: [['VEICULO', '(0,n)'], ['TIPO_VEICULO', '(1,1)']] },
          { name: 'similaridade', at: [3.4, 2.8], links: [['TIPO_VEICULO', '(0,n)', 'ref'], ['TIPO_VEICULO', '(0,n)', 'similar']] },
        ],
      },
      gabarito: `ESCRITORIO (#numEsc|num|numero|numEscritorio, local)
CONTRATO (#numEsc|num|numEscritorio|escritorio, #numCon|numero|numContrato, data, duracao, numHab|numeroHabilitacao, estadoHab|estHab|estadoHabilitacao, numVeic|numVeiculo|veiculo)
  numEsc referencia ESCRITORIO
  (numHab, estadoHab) referencia CLIENTE
  numVeic referencia VEICULO
CLIENTE (#numHab|numeroHabilitacao, #estadoHab|estHab|estadoHabilitacao, nome, endereco|end, telefone|tel)
VEICULO (#numVeic|numero|numVeiculo, dataProxManut|dtProxMan|dataProxManutencao, placa, codTipo|codTipVeic|codigoTipo|tipo|codTipoVeiculo)
  codTipo referencia TIPO_VEICULO
TIPO_VEICULO|TIPOVEICULO|TIPOVEIC (#codTipo|codigo|codTipVeic|codTipoVeiculo, nome, arCond|arCondicionado, subtipo|tipo|subtipoVeic|subTipVeic)
AUTOMOVEL (#codTipo|codigo|codTipVeic|codTipoVeiculo, numPortas, dirHidraulica|dirHidra, cambioAuto)
  codTipo referencia TIPO_VEICULO
ONIBUS (#codTipo|codigo|codTipVeic|codTipoVeiculo, numPassageiros|numPassag, leito, sanitario)
  codTipo referencia TIPO_VEICULO
SIMILARIDADE (#codTipoRef|codTVRef|tipoRef|ref|referencia, #codTipoSimilar|codTVSimilar|similar)
  codTipoRef referencia TIPO_VEICULO
  codTipoSimilar referencia TIPO_VEICULO`,
      explain: '<p>Solução da aula: <code>dom(SUBTIPOVEIC) = {"Automovel", "Onibus"}</code> (cobertura total e exclusiva). SIMILARIDADE não garante simetria — isso não se expressa no modelo relacional (precisaria de trigger).</p>',
    },
  ],
},
// =====================================================================
{
  id: 'w4', tag: 'algebra', theory: 'algebra', title: 'Mundo 4 — Álgebra relacional',
  desc: 'Banco da empresa do caderno de exercícios (esquema ar).',
  levels: [
    {
      id: '4-1', type: 'ra', db: 'algebra', diff: 1, title: 'Seleção composta (σ)', desc: 'Condições com ∧ e ∨.',
      intro: '<p>Selecione os empregados que trabalham no departamento <b>4</b> e ganham mais de 25000 <b>ou</b> que trabalham no departamento <b>5</b> e ganham mais de 30000 (todos os atributos).</p>',
      steps: [{ t: 'Monte a condição', html: '<code>(dnum = 4 ∧ salario &gt; 25000) ∨ (dnum = 5 ∧ salario &gt; 30000)</code> — use parênteses.' }, { t: 'Aplique σ', html: '<code>σ condição (EMPREGADO)</code>' }],
      solution: 'SELECT * FROM ar.empregado WHERE (dnum = 4 AND salario > 25000) OR (dnum = 5 AND salario > 30000)',
      raSolution: 'σ (dnum = 4 ∧ salario > 25000) ∨ (dnum = 5 ∧ salario > 30000) (EMPREGADO)',
    },
    {
      id: '4-2', type: 'ra', db: 'algebra', diff: 1, title: 'Projeção e composição (π ∘ σ)', desc: 'Filtrar e escolher colunas.',
      intro: '<p>Obtenha o prenome (<code>pnome</code>), o sobrenome (<code>snome</code>) e o salário dos empregados do departamento 5.</p>',
      steps: [{ t: 'Primeiro filtre', html: '<code>σ dnum = 5 (EMPREGADO)</code>' }, { t: 'Depois projete', html: '<code>π pnome, snome, salario ( … )</code>' }],
      solution: 'SELECT DISTINCT pnome, snome, salario FROM ar.empregado WHERE dnum = 5',
      raSolution: 'π pnome, snome, salario (σ dnum = 5 (EMPREGADO))',
    },
    {
      id: '4-3', type: 'ra', db: 'algebra', diff: 1, title: 'União (∪)', desc: 'Compatibilidade de união.',
      intro: '<p>Obtenha a matrícula dos empregados que trabalham no departamento 5 <b>ou</b> que supervisionam diretamente algum empregado do departamento 5.</p>',
      steps: [{ t: 'Conjunto A', html: '<code>π mat (σ dnum = 5 (EMPREGADO))</code>' }, { t: 'Conjunto B', html: '<code>π matsup (σ dnum = 5 (EMPREGADO))</code> — mesma aridade (1 coluna), domínios compatíveis.' }, { t: 'Una', html: '<code>A ∪ B</code> — duplicatas somem.' }],
      solution: 'SELECT mat FROM ar.empregado WHERE dnum = 5 UNION SELECT matsup FROM ar.empregado WHERE dnum = 5',
      raSolution: 'π mat (σ dnum = 5 (EMPREGADO)) ∪ π matsup (σ dnum = 5 (EMPREGADO))',
    },
    {
      id: '4-4', type: 'ra', db: 'algebra', diff: 2, title: 'Produto cartesiano (×) + seleção', desc: 'Empregadas e seus dependentes.',
      intro: '<p>Recupere o prenome e o sobrenome das empregadas (sexo = \'F\') e o nome (<code>depnome</code>) de seus dependentes. Use <b>×</b> seguido de σ.</p><p class="small muted">Dica: EMPREGADO e DEPENDENTE têm ambos o atributo <code>sexo</code> — filtre/projete antes do produto para evitar ambiguidade.</p>',
      steps: [{ t: 'Filtre e projete as empregadas', html: '<code>F ← π mat, pnome, snome (σ sexo = \'F\' (EMPREGADO))</code>' }, { t: 'Produto + seleção de junção', html: '<code>σ mat = emat (F × DEPENDENTE)</code>' }, { t: 'Projete', html: '<code>π pnome, snome, depnome (…)</code>' }],
      solution: "SELECT DISTINCT e.pnome, e.snome, d.depnome FROM ar.empregado e, ar.dependente d WHERE e.mat = d.emat AND e.sexo = 'F'",
      raSolution: "F ← π mat, pnome, snome (σ sexo = 'F' (EMPREGADO))\nπ pnome, snome, depnome (σ mat = emat (F × DEPENDENTE))",
    },
    {
      id: '4-5', type: 'ra', db: 'algebra', diff: 2, title: 'Junção θ (⋈ cond)', desc: 'Departamentos e gerentes.',
      intro: '<p>Liste o nome de cada departamento (<code>dnome</code>) e o prenome e sobrenome do respectivo gerente (<code>matger</code> = <code>mat</code>).</p>',
      steps: [{ t: 'Junção condicional', html: '<code>DEPARTAMENTO ⋈ matger = mat EMPREGADO</code>' }, { t: 'Projeção', html: '<code>π dnome, pnome, snome (…)</code>' }],
      solution: 'SELECT d.dnome, e.pnome, e.snome FROM ar.departamento d JOIN ar.empregado e ON d.matger = e.mat',
      raSolution: 'π dnome, pnome, snome (DEPARTAMENTO ⋈ matger = mat EMPREGADO)',
    },
    {
      id: '4-6', type: 'ra', db: 'algebra', diff: 2, title: 'Junção natural (⋈)', desc: 'Atributos de mesmo nome.',
      intro: '<p>Para os projetos localizados em <b>São Paulo</b>, mostre o nome do projeto (<code>projnome</code>) e o nome do departamento que o controla. PROJETO e DEPARTAMENTO têm o atributo <code>dnum</code> em comum.</p>',
      steps: [{ t: 'Filtre os projetos', html: "<code>σ plocal = 'São Paulo' (PROJETO)</code>" }, { t: 'Junção natural', html: '<code>… ⋈ DEPARTAMENTO</code> iguala automaticamente <code>dnum</code>.' }],
      solution: "SELECT p.projnome, d.dnome FROM ar.projeto p JOIN ar.departamento d ON p.dnum = d.dnum WHERE p.plocal = 'São Paulo'",
      raSolution: "π projnome, dnome (σ plocal = 'São Paulo' (PROJETO) ⋈ DEPARTAMENTO)",
    },
    {
      id: '4-7', type: 'ra', db: 'algebra', diff: 2, title: 'Renomeação (ρ) e auto-junção', desc: 'Empregado e supervisor.',
      intro: '<p>Para cada empregado que tem supervisor, mostre seu prenome e sobrenome e o prenome do supervisor. É preciso usar a mesma relação duas vezes — renomeie com <b>ρ</b>.</p>',
      steps: [{ t: 'Duas cópias', html: '<code>ρ E (EMPREGADO)</code> e <code>ρ S (EMPREGADO)</code>' }, { t: 'Junte', html: '<code>E ⋈ E.matsup = S.mat S</code>' }, { t: 'Projete com nomes qualificados', html: '<code>π E.pnome, E.snome, S.pnome (…)</code>' }],
      solution: 'SELECT e.pnome, e.snome, s.pnome FROM ar.empregado e JOIN ar.empregado s ON e.matsup = s.mat',
      raSolution: 'π E.pnome, E.snome, S.pnome (ρ E (EMPREGADO) ⋈ E.matsup = S.mat ρ S (EMPREGADO))',
    },
    {
      id: '4-8', type: 'ra', db: 'algebra', diff: 2, title: 'Diferença (−)', desc: 'Quem NÃO tem…',
      intro: '<p>Liste matrícula e prenome dos empregados que <b>não</b> possuem dependentes.</p>',
      steps: [{ t: 'Todos', html: '<code>π mat, pnome (EMPREGADO)</code>' }, { t: 'Os que têm', html: '<code>π mat, pnome (EMPREGADO ⋈ mat = emat DEPENDENTE)</code>' }, { t: 'Subtraia', html: 'A diferença exige as mesmas colunas dos dois lados.' }],
      solution: 'SELECT mat, pnome FROM ar.empregado WHERE mat NOT IN (SELECT emat FROM ar.dependente)',
      raSolution: 'π mat, pnome (EMPREGADO) − π mat, pnome (EMPREGADO ⋈ mat = emat DEPENDENTE)',
    },
    {
      id: '4-9', type: 'ra', db: 'algebra', diff: 3, title: 'Divisão (÷)', desc: 'Consultas com “todos”.',
      intro: '<p>Liste prenome e sobrenome dos empregados que trabalham em <b>todos</b> os projetos em que o empregado João Rocha trabalha.</p>',
      steps: [
        { t: 'Divisor: projetos do João', html: "<code>JP ← π pnum (TRABALHA_EM ⋈ σ pnome = 'João' ∧ snome = 'Rocha' (EMPREGADO))</code>" },
        { t: 'Dividendo: pares (mat, pnum)', html: '<code>A ← π mat, pnum (TRABALHA_EM)</code>' },
        { t: 'Divida e recupere os nomes', html: '<code>π pnome, snome ((A ÷ JP) ⋈ EMPREGADO)</code>' },
      ],
      solution: "SELECT e.pnome, e.snome FROM ar.empregado e WHERE NOT EXISTS (SELECT 1 FROM ar.trabalha_em j JOIN ar.empregado x ON x.mat = j.mat WHERE x.pnome = 'João' AND x.snome = 'Rocha' AND NOT EXISTS (SELECT 1 FROM ar.trabalha_em t WHERE t.mat = e.mat AND t.pnum = j.pnum))",
      raSolution: "JP ← π pnum (TRABALHA_EM ⋈ σ pnome = 'João' ∧ snome = 'Rocha' (EMPREGADO))\nA ← π mat, pnum (TRABALHA_EM)\nπ pnome, snome ((A ÷ JP) ⋈ EMPREGADO)",
      explain: '<p>Equivalência: R ÷ S = π<sub>γ</sub>(R) − π<sub>γ</sub>((π<sub>γ</sub>(R) × S) − R).</p>',
    },
    {
      id: '4-10', type: 'ra', db: 'algebra', diff: 2, title: 'Agregação (γ)', desc: 'Agrupar e contar.',
      intro: '<p>Para cada departamento (<code>dnum</code>), obtenha o número de empregados e a média salarial. Sintaxe: <code>γ atributos_de_grupo; funcao(attr)→nome (R)</code>. (Em aula: <code>dnum ℑ COUNT(mat), AVG(salario) (EMPREGADO)</code>.)</p>',
      solution: 'SELECT dnum, COUNT(*), AVG(salario) FROM ar.empregado GROUP BY dnum',
      raSolution: 'γ dnum; count(*)→qtd, avg(salario)→media (EMPREGADO)',
    },
    {
      id: '4-11', type: 'ra', db: 'algebra', diff: 2, title: 'Junção externa (⟕)', desc: 'Manter quem não tem par.',
      intro: '<p>Liste o prenome de <b>todos</b> os empregados e, se houver, o nome de seus dependentes (quem não tem dependente aparece com nulo).</p>',
      solution: 'SELECT DISTINCT e.pnome, d.depnome FROM ar.empregado e LEFT JOIN ar.dependente d ON e.mat = d.emat',
      raSolution: 'π pnome, depnome (EMPREGADO ⟕ mat = emat DEPENDENTE)',
    },
  ],
},
// =====================================================================
{
  id: 'w5', tag: 'ddl', theory: 'ddl', title: 'Mundo 5 — SQL DDL',
  desc: 'Criar e alterar esquemas no PostgreSQL.',
  levels: [
    {
      id: '5-1', type: 'sql', db: 'vazio', mode: 'script', diff: 1, title: 'CREATE TABLE e chave primária', desc: 'PK, NOT NULL, UNIQUE.',
      intro: '<p>Crie a tabela <code>departamento</code> com:</p><ul><li><code>sigla</code> CHAR(5) — chave primária</li><li><code>nome</code> VARCHAR(30) — obrigatório e único</li></ul>',
      steps: [{ t: 'Estrutura', html: '<pre>CREATE TABLE departamento (\n  sigla CHAR(5) ...,\n  nome  VARCHAR(30) ...\n);</pre>' }, { t: 'Restrições', html: 'PRIMARY KEY na sigla; NOT NULL e UNIQUE no nome.' }],
      starter: '-- crie a tabela aqui\n',
      solution: 'CREATE TABLE departamento (\n  sigla CHAR(5) PRIMARY KEY,\n  nome  VARCHAR(30) NOT NULL UNIQUE\n);',
      checks: [
        { kind: 'pk', table: 'departamento', cols: ['sigla'] },
        { kind: 'notnull', table: 'departamento', col: 'nome' },
        { kind: 'unique', table: 'departamento', cols: ['nome'] },
        { test: "INSERT INTO departamento (sigla, nome) VALUES ('DES', 'Desenvolvimento')", desc: 'Inserir um departamento válido' },
        { test: "INSERT INTO departamento (sigla, nome) VALUES ('DES', 'Outro')", desc: 'Inserir sigla repetida' },
        { test: "INSERT INTO departamento (sigla, nome) VALUES ('PROD', NULL)", desc: 'Inserir nome nulo' },
        { test: "INSERT INTO departamento (sigla, nome) VALUES ('XX', 'Desenvolvimento')", desc: 'Inserir nome repetido' },
      ],
    },
    {
      id: '5-2', type: 'sql', db: 'vazio', mode: 'script', diff: 2, title: 'Chaves estrangeiras e PK composta', desc: 'projeto e trabalha_em.',
      intro: '<p>As tabelas <code>departamento(sigla, nome)</code> e <code>empregado(matricula, nome, depto)</code> já existem. Crie:</p><ul><li><code>projeto</code>(<code>pcodigo</code> INT PK, <code>pnome</code> VARCHAR(30) NOT NULL UNIQUE, <code>depto</code> CHAR(5) NOT NULL → departamento)</li><li><code>trabalha_em</code>(<code>empmat</code> CHAR(9) → empregado, <code>pcodigo</code> INT → projeto, <code>horas</code> NUMERIC(3,1) NOT NULL; PK = (empmat, pcodigo))</li></ul>',
      setup: "CREATE TABLE departamento (sigla CHAR(5) PRIMARY KEY, nome VARCHAR(30) NOT NULL UNIQUE);\nCREATE TABLE empregado (matricula CHAR(9) PRIMARY KEY, nome VARCHAR(30) NOT NULL, depto CHAR(5) REFERENCES departamento);\nINSERT INTO departamento VALUES ('DES','Desenvolvimento');\nINSERT INTO empregado VALUES ('001','Maria','DES');",
      steps: [{ t: 'FK de coluna ou de tabela', html: '<code>depto CHAR(5) NOT NULL REFERENCES departamento(sigla)</code> ou <code>FOREIGN KEY (depto) REFERENCES departamento (sigla)</code>.' }, { t: 'PK composta', html: '<code>PRIMARY KEY (empmat, pcodigo)</code> no fim da tabela.' }, { t: 'Ordem', html: 'Crie <code>projeto</code> antes de <code>trabalha_em</code>.' }],
      solution: `CREATE TABLE projeto (
  pcodigo INT PRIMARY KEY,
  pnome   VARCHAR(30) NOT NULL UNIQUE,
  depto   CHAR(5) NOT NULL REFERENCES departamento (sigla)
);
CREATE TABLE trabalha_em (
  empmat  CHAR(9) REFERENCES empregado (matricula),
  pcodigo INT REFERENCES projeto (pcodigo),
  horas   NUMERIC(3,1) NOT NULL,
  PRIMARY KEY (empmat, pcodigo)
);`,
      checks: [
        { kind: 'pk', table: 'projeto', cols: ['pcodigo'] },
        { kind: 'fk', table: 'projeto', cols: ['depto'], ref: 'departamento' },
        { kind: 'pk', table: 'trabalha_em', cols: ['empmat', 'pcodigo'] },
        { kind: 'fk', table: 'trabalha_em', cols: ['empmat'], ref: 'empregado' },
        { kind: 'fk', table: 'trabalha_em', cols: ['pcodigo'], ref: 'projeto' },
        { test: "INSERT INTO projeto (pcodigo, pnome, depto) VALUES (1, 'Tamar', 'DES')", desc: 'Projeto válido' },
        { test: "INSERT INTO projeto (pcodigo, pnome, depto) VALUES (2, 'Jubarte', 'XYZ')", desc: 'Projeto com departamento inexistente' },
        { test: "INSERT INTO trabalha_em (empmat, pcodigo, horas) VALUES ('001', 1, 20)", desc: 'Alocação válida' },
        { test: "INSERT INTO trabalha_em (empmat, pcodigo, horas) VALUES ('001', 1, 10)", desc: 'Mesma alocação repetida' },
        { test: "INSERT INTO trabalha_em (empmat, pcodigo, horas) VALUES ('999', 1, 10)", desc: 'Empregado inexistente' },
      ],
    },
    {
      id: '5-3', type: 'sql', db: 'vazio', mode: 'script', diff: 2, title: 'CHECK, DEFAULT e ON DELETE CASCADE', desc: 'Restrições de domínio e ação referencial.',
      intro: '<p>A tabela <code>empregado(matricula CHAR(9) PK, nome)</code> já existe. Crie <code>dependente</code>:</p><ul><li><code>empmat</code> CHAR(9) → empregado, <b>apagando os dependentes quando o empregado for apagado</b></li><li><code>depnome</code> VARCHAR(15)</li><li><code>sexo</code> CHAR(1), aceitando apenas \'M\' ou \'F\'</li><li><code>parentesco</code> VARCHAR(8) com valor padrão \'filho\'</li><li>PK = (empmat, depnome)</li></ul>',
      setup: "CREATE TABLE empregado (matricula CHAR(9) PRIMARY KEY, nome VARCHAR(30) NOT NULL);\nINSERT INTO empregado VALUES ('001','Maria'), ('002','João');",
      solution: `CREATE TABLE dependente (
  empmat     CHAR(9) REFERENCES empregado (matricula) ON DELETE CASCADE,
  depnome    VARCHAR(15),
  sexo       CHAR(1) CHECK (sexo IN ('M', 'F')),
  parentesco VARCHAR(8) DEFAULT 'filho',
  PRIMARY KEY (empmat, depnome)
);`,
      checks: [
        { kind: 'pk', table: 'dependente', cols: ['empmat', 'depnome'] },
        { kind: 'fk', table: 'dependente', cols: ['empmat'], ref: 'empregado', onDelete: 'CASCADE' },
        { test: "INSERT INTO dependente (empmat, depnome, sexo) VALUES ('001', 'Sofia', 'F')", desc: 'Dependente válido (sem informar parentesco)' },
        { test: "INSERT INTO dependente (empmat, depnome, sexo) VALUES ('002', 'Lia', 'X')", desc: "Sexo 'X'" },
        { sql: "SELECT parentesco FROM dependente WHERE depnome = 'Sofia'", desc: "Parentesco padrão = 'filho'" },
        { test: "DELETE FROM empregado WHERE matricula = '001'", desc: 'Apagar empregado com dependente' },
        { sql: 'SELECT count(*) FROM dependente', desc: 'Dependentes do empregado apagado foram removidos (CASCADE)' },
      ],
    },
    {
      id: '5-4', type: 'sql', db: 'vazio', mode: 'script', diff: 2, title: 'ALTER TABLE', desc: 'Evoluindo um esquema existente.',
      intro: '<p>A tabela <code>empregado(matricula PK, nome, snome, salario, supermat)</code> já existe, com dados. Usando <b>ALTER TABLE</b>:</p><ol><li>adicione a coluna <code>email</code> VARCHAR(50) única;</li><li>garanta que <code>salario</code> seja maior que zero;</li><li>transforme <code>supermat</code> em FK para o próprio empregado, anulando-a se o supervisor for apagado;</li><li>renomeie <code>snome</code> para <code>sobrenome</code>.</li></ol>',
      setup: "CREATE TABLE empregado (matricula CHAR(9) PRIMARY KEY, nome VARCHAR(15) NOT NULL, snome VARCHAR(15), salario NUMERIC(10,2), supermat CHAR(9));\nINSERT INTO empregado VALUES ('001','Maria','Silva',1000,NULL), ('002','João','Goya',2000,'001'), ('003','Abel','Flores',1000,'001');",
      steps: [{ t: 'Sintaxe', html: '<pre>ALTER TABLE empregado ADD COLUMN ...;\nALTER TABLE empregado ADD CONSTRAINT nome CHECK (...);\nALTER TABLE empregado ADD CONSTRAINT nome FOREIGN KEY (...) REFERENCES ... ON DELETE ...;\nALTER TABLE empregado RENAME COLUMN ... TO ...;</pre>' }],
      solution: `ALTER TABLE empregado ADD COLUMN email VARCHAR(50) UNIQUE;
ALTER TABLE empregado ADD CONSTRAINT ck_salario CHECK (salario > 0);
ALTER TABLE empregado ADD CONSTRAINT fk_supervisor FOREIGN KEY (supermat)
  REFERENCES empregado (matricula) ON DELETE SET NULL;
ALTER TABLE empregado RENAME COLUMN snome TO sobrenome;`,
      checks: [
        { kind: 'cols', table: 'empregado', cols: ['email', 'sobrenome'] },
        { kind: 'unique', table: 'empregado', cols: ['email'] },
        { kind: 'fk', table: 'empregado', cols: ['supermat'], ref: 'empregado', onDelete: 'SET NULL' },
        { test: "UPDATE empregado SET salario = -10 WHERE matricula = '003'", desc: 'Salário negativo' },
        { test: "UPDATE empregado SET supermat = '999' WHERE matricula = '003'", desc: 'Supervisor inexistente' },
        { test: "DELETE FROM empregado WHERE matricula = '001'", desc: 'Apagar o supervisor 001' },
        { sql: 'SELECT matricula, supermat FROM empregado ORDER BY matricula', desc: 'Subordinados de 001 ficaram com supermat nulo' },
      ],
    },
    {
      id: '5-5', type: 'sql', db: 'vazio', mode: 'script', diff: 2, title: 'IDENTITY, DEFAULT e FK', desc: 'Chave artificial gerada pelo SGBD.',
      intro: '<p>Crie:</p><ul><li><code>cliente</code>(<code>id</code> INTEGER gerado <b>sempre</b> pelo SGBD (IDENTITY) e PK, <code>cpf</code> CHAR(11) obrigatório e único — a chave natural vira candidata —, <code>nome</code> VARCHAR(40))</li><li><code>pedido</code>(<code>num</code> INTEGER gerado pelo SGBD e PK, <code>data</code> DATE com padrão = data atual, <code>cliente_id</code> INTEGER obrigatório → cliente)</li></ul>',
      solution: `CREATE TABLE cliente (
  id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cpf  CHAR(11) NOT NULL UNIQUE,
  nome VARCHAR(40)
);
CREATE TABLE pedido (
  num        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data       DATE DEFAULT CURRENT_DATE,
  cliente_id INTEGER NOT NULL REFERENCES cliente (id)
);`,
      checks: [
        { kind: 'pk', table: 'cliente', cols: ['id'] },
        { kind: 'unique', table: 'cliente', cols: ['cpf'] },
        { kind: 'notnull', table: 'cliente', col: 'cpf' },
        { kind: 'fk', table: 'pedido', cols: ['cliente_id'], ref: 'cliente' },
        { test: "INSERT INTO cliente (cpf, nome) VALUES ('11111111111', 'Ana')", desc: 'Cliente sem informar id' },
        { test: "INSERT INTO cliente (id, cpf, nome) VALUES (50, '22222222222', 'Bia')", desc: 'Informar id manualmente (GENERATED ALWAYS)' },
        { test: "INSERT INTO pedido (cliente_id) VALUES (1)", desc: 'Pedido só com o cliente' },
        { sql: 'SELECT num, data = CURRENT_DATE AS hoje, cliente_id FROM pedido', desc: 'num gerado e data padrão = hoje' },
        { test: "INSERT INTO pedido (cliente_id) VALUES (NULL)", desc: 'Pedido sem cliente' },
      ],
    },
    {
      id: '5-6', type: 'sql', db: 'empresa', mode: 'script', diff: 3, title: 'Visão com WITH CHECK OPTION', desc: 'Nível externo e visões atualizáveis.',
      intro: '<p>No banco <code>emp</code>, crie a visão <code>emp.empregado_des</code> com <code>matricula, nome, snome, salario, depto</code> dos empregados do departamento <b>DES</b>, impedindo que inserções/alterações feitas pela visão gerem linhas que não pertençam a ela.</p>',
      steps: [{ t: 'Visão simples sobre uma tabela', html: 'É atualizável: uma tabela base, sem agregação/DISTINCT.' }, { t: 'Proteção', html: 'Termine com <code>WITH CHECK OPTION</code>.' }],
      solution: `CREATE VIEW emp.empregado_des AS
  SELECT matricula, nome, snome, salario, depto
  FROM emp.empregado
  WHERE depto = 'DES'
WITH CHECK OPTION;`,
      checks: [
        { sql: 'SELECT * FROM emp.empregado_des ORDER BY matricula', desc: 'A visão mostra só os empregados do DES' },
        { test: "INSERT INTO emp.empregado_des (matricula, nome, snome, salario, depto) VALUES ('100','Ana','Lima',1500,'DES')", desc: 'Inserir pela visão um empregado do DES' },
        { test: "INSERT INTO emp.empregado_des (matricula, nome, snome, salario, depto) VALUES ('101','Rui','Melo',1500,'PROD')", desc: 'Inserir pela visão um empregado da PROD' },
        { test: "UPDATE emp.empregado_des SET depto = 'PROD' WHERE matricula = '004'", desc: 'Mudar pela visão o depto de 004 para PROD' },
      ],
    },
  ],
},
// =====================================================================
{
  id: 'w6', tag: 'dml', theory: 'dml', title: 'Mundo 6 — SQL DML (empresa)',
  desc: 'Consultas e atualizações no script emp da disciplina.',
  levels: [
    { id: '6-1', type: 'sql', db: 'empresa', diff: 1, title: 'SELECT … WHERE', desc: 'Filtro simples.', intro: '<p>Liste <code>nome</code>, <code>snome</code> e <code>salario</code> dos empregados do departamento <b>DES</b> que ganham <b>mais de 1000</b>.</p>', solution: "SELECT nome, snome, salario FROM emp.empregado WHERE depto = 'DES' AND salario > 1000;" },
    { id: '6-2', type: 'sql', db: 'empresa', diff: 1, title: 'LIKE, BETWEEN e ORDER BY', desc: 'Padrões, faixas e ordenação.', intro: '<p>Liste <code>nome</code> e <code>salario</code> dos empregados cujo nome começa com <b>J</b> <i>ou</i> cujo salário está <b>entre 900 e 1000</b> (inclusive), ordenando por salário decrescente e, no empate, por nome.</p>', ordered: true, solution: "SELECT nome, salario FROM emp.empregado WHERE nome LIKE 'J%' OR salario BETWEEN 900 AND 1000 ORDER BY salario DESC, nome;" },
    { id: '6-3', type: 'sql', db: 'empresa', diff: 1, title: 'IS NULL', desc: 'Nulo não se compara com =.', intro: '<p>Liste <code>nome</code> e <code>snome</code> dos empregados que <b>não têm supervisor</b> ou que ganham <b>menos de 900</b>.</p>', steps: [{ t: 'Atenção', html: '<code>supermat = NULL</code> nunca é verdadeiro. Use <code>supermat IS NULL</code>.' }], solution: 'SELECT nome, snome FROM emp.empregado WHERE supermat IS NULL OR salario < 900;' },
    { id: '6-4', type: 'sql', db: 'empresa', diff: 1, title: 'Funções de agregação', desc: 'COUNT, SUM, AVG, MAX, MIN.', intro: '<p>Numa única linha, mostre: quantidade de empregados, soma dos salários, média, maior e menor salário da empresa.</p>', solution: 'SELECT COUNT(*), SUM(salario), AVG(salario), MAX(salario), MIN(salario) FROM emp.empregado;' },
    { id: '6-5', type: 'sql', db: 'empresa', diff: 2, title: 'GROUP BY', desc: 'Agrupar por departamento.', intro: '<p>Para cada departamento (<code>depto</code>), mostre a quantidade de empregados e a média salarial, ordenado por <code>depto</code>.</p>', ordered: true, solution: 'SELECT depto, COUNT(*) AS qtd, AVG(salario) AS media FROM emp.empregado GROUP BY depto ORDER BY depto;' },
    { id: '6-6', type: 'sql', db: 'empresa', diff: 2, title: 'HAVING', desc: 'Filtro sobre grupos.', intro: '<p>Mostre os departamentos (<code>depto</code>) cuja média salarial é <b>maior que 1200</b>, com a média.</p>', steps: [{ t: 'WHERE × HAVING', html: 'WHERE filtra linhas antes de agrupar; condições com agregação vão no HAVING.' }], solution: 'SELECT depto, AVG(salario) FROM emp.empregado GROUP BY depto HAVING AVG(salario) > 1200;' },
    { id: '6-7', type: 'sql', db: 'empresa', diff: 2, title: 'JOIN', desc: 'Juntar três tabelas.', intro: '<p>Liste o nome do empregado, o nome do projeto (<code>pnome</code>) e as horas, apenas para projetos controlados pelo departamento <b>PROD</b>.</p>', steps: [{ t: 'Caminho', html: 'empregado —(matricula = empmat)— trabalha_em —(pcodigo)— projeto.' }], solution: "SELECT e.nome, p.pnome, t.horas FROM emp.empregado e JOIN emp.trabalha_em t ON t.empmat = e.matricula JOIN emp.projeto p ON p.pcodigo = t.pcodigo WHERE p.depto = 'PROD';" },
    { id: '6-8', type: 'sql', db: 'empresa', diff: 2, title: 'JOIN + agregação', desc: 'Total de horas por projeto.', intro: '<p>Para cada projeto, mostre o nome do projeto, o <b>nome do departamento</b> que o controla e o total de horas alocadas.</p>', solution: 'SELECT p.pnome, d.deptonome, SUM(t.horas) FROM emp.projeto p JOIN emp.departamento d ON d.deptosigla = p.depto JOIN emp.trabalha_em t ON t.pcodigo = p.pcodigo GROUP BY p.pnome, d.deptonome;' },
    { id: '6-9', type: 'sql', db: 'empresa', diff: 2, title: 'LEFT JOIN (quem não tem)', desc: 'Anti-junção.', intro: '<p>Liste o nome dos empregados que <b>não trabalham em nenhum projeto</b>.</p>', steps: [{ t: 'Duas formas', html: '<code>LEFT JOIN trabalha_em … WHERE t.empmat IS NULL</code> ou <code>WHERE NOT EXISTS (…)</code>.' }], solution: 'SELECT e.nome FROM emp.empregado e LEFT JOIN emp.trabalha_em t ON t.empmat = e.matricula WHERE t.empmat IS NULL;' },
    { id: '6-10', type: 'sql', db: 'empresa', diff: 2, title: 'Auto-junção', desc: 'Empregado e supervisor.', intro: '<p>Liste o nome de cada empregado e o nome do seu supervisor (apenas quem tem supervisor).</p>', solution: 'SELECT e.nome AS empregado, s.nome AS supervisor FROM emp.empregado e JOIN emp.empregado s ON e.supermat = s.matricula;' },
    { id: '6-11', type: 'sql', db: 'empresa', diff: 2, title: 'Subconsulta', desc: 'Comparar com a média geral.', intro: '<p>Liste nome e salário dos empregados que ganham <b>mais que a média geral</b> da empresa.</p>', solution: 'SELECT nome, salario FROM emp.empregado WHERE salario > (SELECT AVG(salario) FROM emp.empregado);' },
    { id: '6-12', type: 'sql', db: 'empresa', diff: 3, title: 'Subconsulta correlacionada', desc: 'Média do próprio departamento.', intro: '<p>Liste nome, depto e salário dos empregados que ganham <b>mais que a média do próprio departamento</b>.</p>', steps: [{ t: 'Correlação', html: 'A subconsulta usa <code>e.depto</code> da consulta externa: <code>(SELECT AVG(x.salario) FROM emp.empregado x WHERE x.depto = e.depto)</code>.' }], solution: 'SELECT e.nome, e.depto, e.salario FROM emp.empregado e WHERE e.salario > (SELECT AVG(x.salario) FROM emp.empregado x WHERE x.depto = e.depto);' },
    { id: '6-13', type: 'sql', db: 'empresa', diff: 3, title: 'Divisão em SQL (NOT EXISTS duplo)', desc: '“Todos os projetos de…”', intro: '<p>Liste o nome dos empregados que trabalham em <b>todos</b> os projetos em que a empregada <b>Irene</b> trabalha.</p>', steps: [{ t: 'Leitura', html: '“Não existe projeto da Irene no qual o empregado não trabalhe.”' }, { t: 'Esqueleto', html: '<pre>SELECT e.nome FROM emp.empregado e\nWHERE NOT EXISTS (\n  SELECT * FROM emp.trabalha_em ti  -- projetos da Irene\n  WHERE ti.empmat = (SELECT matricula FROM emp.empregado WHERE nome = \'Irene\')\n  AND NOT EXISTS (SELECT * FROM emp.trabalha_em t\n                  WHERE t.empmat = e.matricula AND t.pcodigo = ti.pcodigo));</pre>' }], solution: "SELECT e.nome FROM emp.empregado e WHERE NOT EXISTS (SELECT * FROM emp.trabalha_em ti WHERE ti.empmat = (SELECT matricula FROM emp.empregado WHERE nome = 'Irene') AND NOT EXISTS (SELECT * FROM emp.trabalha_em t WHERE t.empmat = e.matricula AND t.pcodigo = ti.pcodigo));" },
    { id: '6-14', type: 'sql', db: 'empresa', diff: 2, title: 'UNION', desc: 'Operações de conjunto.', intro: '<p>Liste (sem repetição) as matrículas dos empregados que <b>gerenciam algum departamento</b> ou que <b>têm dependentes</b>.</p>', solution: 'SELECT matriculagerente FROM emp.departamento UNION SELECT empmat FROM emp.dependente;' },
    { id: '6-15', type: 'sql', db: 'empresa', diff: 3, title: 'WITH (CTE)', desc: 'Consultas em etapas.', intro: '<p>Usando <code>WITH</code>, mostre os departamentos (<code>depto</code> e folha = soma dos salários) cuja folha é <b>maior que a média das folhas</b> dos departamentos.</p>', solution: 'WITH folha AS (SELECT depto, SUM(salario) AS total FROM emp.empregado GROUP BY depto)\nSELECT depto, total FROM folha WHERE total > (SELECT AVG(total) FROM folha);', mustUse: [{ re: '\\bWITH\\b', label: 'WITH' }] },
    {
      id: '6-16', type: 'sql', db: 'empresa', mode: 'script', diff: 1, title: 'INSERT', desc: 'Incluir dados respeitando as FKs.',
      intro: "<p>Insira o empregado <b>Pedro Alves</b>, matrícula '014', nascido em 10/10/1990, sexo M, salário 1500, supervisor '002', departamento 'DES'. Depois, aloque-o no projeto <b>Pantanal</b> com 10 horas.</p>",
      solution: "INSERT INTO emp.empregado (nome, snome, matricula, datanasc, sexo, salario, supermat, depto)\nVALUES ('Pedro', 'Alves', '014', '10/10/1990', 'M', 1500, '002', 'DES');\nINSERT INTO emp.trabalha_em (empmat, pcodigo, horas) VALUES ('014', 3, 10);",
      checks: [
        { sql: "SELECT nome, snome, datanasc, sexo, salario, supermat, depto FROM emp.empregado WHERE matricula = '014'", desc: 'Empregado 014 cadastrado corretamente' },
        { sql: "SELECT empmat, pcodigo, horas FROM emp.trabalha_em WHERE empmat = '014'", desc: 'Alocado no Pantanal com 10 horas' },
      ],
    },
    {
      id: '6-17', type: 'sql', db: 'empresa', mode: 'script', diff: 2, title: 'UPDATE com subconsulta', desc: 'Atualização condicional.',
      intro: '<p>Aumente em <b>10%</b> o salário de todos os empregados que trabalham no projeto <b>Jubarte</b>.</p>',
      solution: "UPDATE emp.empregado SET salario = salario * 1.10\nWHERE matricula IN (SELECT t.empmat FROM emp.trabalha_em t JOIN emp.projeto p ON p.pcodigo = t.pcodigo WHERE p.pnome = 'Jubarte');",
      checks: [{ sql: 'SELECT matricula, salario FROM emp.empregado ORDER BY matricula', desc: 'Salários atualizados (só quem trabalha no Jubarte)' }],
    },
    {
      id: '6-18', type: 'sql', db: 'empresa', mode: 'script', diff: 2, title: 'DELETE e integridade', desc: 'A ordem importa.',
      intro: '<p>Remova o projeto <b>Tamar</b>. As alocações que o referenciam também devem ser removidas (a FK não tem CASCADE).</p>',
      steps: [{ t: 'Ordem', html: 'Primeiro apague de <code>trabalha_em</code>, depois de <code>projeto</code> — senão a integridade referencial bloqueia.' }],
      solution: "DELETE FROM emp.trabalha_em WHERE pcodigo = (SELECT pcodigo FROM emp.projeto WHERE pnome = 'Tamar');\nDELETE FROM emp.projeto WHERE pnome = 'Tamar';",
      checks: [
        { sql: 'SELECT pnome FROM emp.projeto ORDER BY pnome', desc: 'Tamar removido; demais projetos intactos' },
        { sql: 'SELECT empmat, pcodigo FROM emp.trabalha_em ORDER BY 1, 2', desc: 'Alocações do Tamar removidas; demais intactas' },
      ],
    },
  ],
},
// =====================================================================
{
  id: 'wc', tag: 'clube', theory: 'dml', title: 'Mundo 6½ — Clube (pgexercises)',
  desc: 'Treino extra com o banco clubdata sugerido em aula.',
  levels: [
    { id: 'C-1', type: 'sql', db: 'clube', diff: 1, title: 'Instalações pagas', desc: 'WHERE simples.', intro: '<p>Liste <code>name</code> e <code>membercost</code> das instalações que cobram algum valor de membros.</p>', solution: 'SELECT name, membercost FROM cd.facilities WHERE membercost > 0;' },
    { id: 'C-2', type: 'sql', db: 'clube', diff: 1, title: 'Condição composta', desc: 'Expressões no WHERE.', intro: '<p>Liste <code>facid, name, membercost, monthlymaintenance</code> das instalações que cobram de membros um valor maior que zero e <b>menor que 1/50</b> da manutenção mensal.</p>', solution: 'SELECT facid, name, membercost, monthlymaintenance FROM cd.facilities WHERE membercost > 0 AND membercost < monthlymaintenance / 50.0;' },
    { id: 'C-3', type: 'sql', db: 'clube', diff: 1, title: 'Datas', desc: 'Comparar timestamps.', intro: "<p>Liste <code>memid, surname, firstname, joindate</code> dos membros que entraram a partir de <b>1º de setembro de 2012</b>.</p>", solution: "SELECT memid, surname, firstname, joindate FROM cd.members WHERE joindate >= '2012-09-01';" },
    { id: 'C-4', type: 'sql', db: 'clube', diff: 2, title: 'Junção: reservas de um membro', desc: 'JOIN simples.', intro: "<p>Liste os horários de início (<code>starttime</code>) das reservas feitas pelo membro <b>David Farrell</b>.</p>", solution: "SELECT b.starttime FROM cd.bookings b JOIN cd.members m ON m.memid = b.memid WHERE m.firstname = 'David' AND m.surname = 'Farrell';" },
    { id: 'C-5', type: 'sql', db: 'clube', diff: 2, title: 'Quadras de tênis num dia', desc: 'JOIN + LIKE + datas + ordem.', intro: "<p>Liste o horário de início e o nome da quadra das reservas de quadras de tênis (<code>name LIKE 'Tennis Court%'</code>) no dia <b>2012-09-21</b>, ordenado pelo horário.</p>", ordered: true, solution: "SELECT b.starttime, f.name FROM cd.bookings b JOIN cd.facilities f ON f.facid = b.facid WHERE f.name LIKE 'Tennis Court%' AND b.starttime >= '2012-09-21' AND b.starttime < '2012-09-22' ORDER BY b.starttime, f.name;" },
    { id: 'C-6', type: 'sql', db: 'clube', diff: 2, title: 'Quem recomendou alguém', desc: 'Auto-junção + DISTINCT.', intro: '<p>Liste (sem repetição) <code>firstname, surname</code> dos membros que recomendaram outro membro, ordenado por sobrenome e nome.</p>', ordered: true, solution: 'SELECT DISTINCT r.firstname, r.surname FROM cd.members m JOIN cd.members r ON r.memid = m.recommendedby ORDER BY r.surname, r.firstname;' },
    { id: 'C-7', type: 'sql', db: 'clube', diff: 2, title: 'Todos os membros e quem os recomendou', desc: 'LEFT JOIN na auto-junção.', intro: '<p>Liste nome e sobrenome de <b>todos</b> os membros e, se houver, nome e sobrenome de quem os recomendou; ordene por sobrenome e nome do membro.</p>', ordered: true, solution: 'SELECT m.firstname, m.surname, r.firstname, r.surname FROM cd.members m LEFT JOIN cd.members r ON r.memid = m.recommendedby ORDER BY m.surname, m.firstname;' },
    { id: 'C-8', type: 'sql', db: 'clube', diff: 2, title: 'Slots por instalação em setembro', desc: 'GROUP BY + filtro de período.', intro: '<p>Para setembro de 2012, mostre <code>facid</code> e o total de slots reservados, ordenado pelo total.</p>', ordered: true, solution: "SELECT facid, SUM(slots) AS total FROM cd.bookings WHERE starttime >= '2012-09-01' AND starttime < '2012-10-01' GROUP BY facid ORDER BY total;" },
    { id: 'C-9', type: 'sql', db: 'clube', diff: 2, title: 'Mais de 1000 slots', desc: 'HAVING.', intro: '<p>Liste <code>facid</code> e o total de slots das instalações com <b>mais de 1000</b> slots reservados no total.</p>', solution: 'SELECT facid, SUM(slots) FROM cd.bookings GROUP BY facid HAVING SUM(slots) > 1000;' },
    { id: 'C-10', type: 'sql', db: 'clube', diff: 3, title: 'Receita por instalação', desc: 'CASE dentro de SUM.', intro: '<p>Liste <code>name</code> e a receita total das instalações com receita <b>menor que 1000</b>. Cada reserva custa <code>slots × guestcost</code> se o membro for o convidado (memid = 0) e <code>slots × membercost</code> caso contrário.</p>', solution: 'SELECT f.name, SUM(b.slots * CASE WHEN b.memid = 0 THEN f.guestcost ELSE f.membercost END) AS receita FROM cd.bookings b JOIN cd.facilities f ON f.facid = b.facid GROUP BY f.name HAVING SUM(b.slots * CASE WHEN b.memid = 0 THEN f.guestcost ELSE f.membercost END) < 1000;' },
  ],
},
// =====================================================================
{
  id: 'w7', tag: 'triggers', theory: 'triggers', title: 'Mundo 7 — Triggers (PL/pgSQL)',
  desc: 'Regras de negócio com gatilhos no banco emp.',
  levels: [
    {
      id: '7-1', type: 'sql', db: 'empresa', mode: 'script', diff: 1, title: 'Validação com BEFORE', desc: 'RAISE EXCEPTION.',
      intro: '<p>Crie a função <code>emp.emp_stamp()</code> e o gatilho <code>emp_stamp</code> (BEFORE INSERT OR UPDATE, FOR EACH ROW) em <code>emp.empregado</code> que rejeitem salário <b>nulo</b> ou <b>negativo</b>.</p>',
      steps: [{ t: 'Função', html: '<pre>CREATE OR REPLACE FUNCTION emp.emp_stamp() RETURNS trigger AS $$\nBEGIN\n  IF NEW.salario IS NULL THEN\n    RAISE EXCEPTION \'salario nao pode ser nulo\';\n  END IF;\n  ...\n  RETURN NEW;\nEND; $$ LANGUAGE plpgsql;</pre>' }, { t: 'Gatilho', html: '<code>CREATE TRIGGER emp_stamp BEFORE INSERT OR UPDATE ON emp.empregado FOR EACH ROW EXECUTE PROCEDURE emp.emp_stamp();</code>' }, { t: 'Não esqueça', html: '<code>RETURN NEW</code> — sem ele, o BEFORE cancela a gravação.' }],
      solution: `CREATE OR REPLACE FUNCTION emp.emp_stamp() RETURNS trigger AS $$
BEGIN
  IF NEW.salario IS NULL THEN
    RAISE EXCEPTION 'salario nao pode ser nulo';
  END IF;
  IF NEW.salario < 0 THEN
    RAISE EXCEPTION 'salario tem que ser > 0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emp_stamp BEFORE INSERT OR UPDATE ON emp.empregado
  FOR EACH ROW EXECUTE PROCEDURE emp.emp_stamp();`,
      checks: [
        { kind: 'trigger', table: 'emp.empregado' },
        { test: "INSERT INTO emp.empregado (nome, snome, matricula, salario, depto) VALUES ('Ana','Lima','020', NULL, 'DES')", desc: 'Inserir com salário nulo' },
        { test: "INSERT INTO emp.empregado (nome, snome, matricula, salario, depto) VALUES ('Ana','Lima','020', -5, 'DES')", desc: 'Inserir com salário negativo' },
        { test: "INSERT INTO emp.empregado (nome, snome, matricula, salario, depto) VALUES ('Ana','Lima','020', 1200, 'DES')", desc: 'Inserir com salário válido' },
        { test: "UPDATE emp.empregado SET salario = 1100 WHERE matricula = '005'", desc: 'Atualizar com salário válido' },
        { sql: "SELECT matricula, salario FROM emp.empregado WHERE matricula IN ('005','020') ORDER BY 1", desc: 'Linhas válidas foram gravadas (RETURN NEW)' },
      ],
    },
    {
      id: '7-2', type: 'sql', db: 'empresa', mode: 'script', diff: 1, title: 'Irredutibilidade salarial', desc: 'OLD × NEW.',
      intro: '<p>Garanta com um gatilho que <b>nenhum salário seja reduzido</b> (BEFORE UPDATE). Aumentos e atualizações de outras colunas devem continuar funcionando.</p>',
      solution: `CREATE OR REPLACE FUNCTION emp.vsalario() RETURNS trigger AS $$
BEGIN
  IF NEW.salario < OLD.salario THEN
    RAISE EXCEPTION 'NAO SE PODE DIMINUIR SALARIO';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER atuemp BEFORE UPDATE ON emp.empregado
  FOR EACH ROW EXECUTE PROCEDURE emp.vsalario();`,
      checks: [
        { test: "UPDATE emp.empregado SET salario = salario - 1 WHERE matricula = '004'", desc: 'Reduzir o salário de 004' },
        { test: "UPDATE emp.empregado SET salario = salario + 100 WHERE matricula = '004'", desc: 'Aumentar o salário de 004' },
        { test: "UPDATE emp.empregado SET endereco = 'Rua A' WHERE matricula = '005'", desc: 'Alterar outra coluna' },
        { sql: "SELECT matricula, salario, endereco FROM emp.empregado WHERE matricula IN ('004','005') ORDER BY 1", desc: 'Estado final correto' },
      ],
    },
    {
      id: '7-3', type: 'sql', db: 'empresa', mode: 'script', diff: 2, title: 'Não ganhar mais que o chefe', desc: 'Consulta dentro do gatilho.',
      intro: '<p>Um empregado <b>não pode ter salário superior ao do seu supervisor</b> (<code>supermat</code>). Valide em INSERT e UPDATE.</p>',
      steps: [{ t: 'Buscar o salário do chefe', html: '<code>(SELECT salario FROM emp.empregado e WHERE e.matricula = NEW.supermat)</code>' }, { t: 'Sem supervisor', html: 'Se <code>supermat</code> for nulo a comparação dá nulo (não dispara) — ok.' }],
      solution: `CREATE OR REPLACE FUNCTION emp.vsalariosup() RETURNS trigger AS $$
BEGIN
  IF NEW.salario > (SELECT salario FROM emp.empregado e WHERE e.matricula = NEW.supermat) THEN
    RAISE EXCEPTION 'emp % nao pode ter salario superior ao do chefe', NEW.nome;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER atuemp2 BEFORE INSERT OR UPDATE ON emp.empregado
  FOR EACH ROW EXECUTE PROCEDURE emp.vsalariosup();`,
      checks: [
        { test: "UPDATE emp.empregado SET salario = 3000 WHERE matricula = '004'", desc: 'Carlos (chefe ganha 2000) passar a ganhar 3000' },
        { test: "UPDATE emp.empregado SET salario = 1500 WHERE matricula = '004'", desc: 'Carlos passar a ganhar 1500' },
        { test: "INSERT INTO emp.empregado (nome, snome, matricula, salario, supermat, depto) VALUES ('Rui','Melo','030', 5000, '003', 'PROD')", desc: 'Novo empregado ganhando mais que o chefe 003' },
        { test: "INSERT INTO emp.empregado (nome, snome, matricula, salario, supermat, depto) VALUES ('Rui','Melo','030', 900, '003', 'PROD')", desc: 'Novo empregado com salário válido' },
        { test: "UPDATE emp.empregado SET salario = 9000 WHERE matricula = '001'", desc: 'Maria (sem supervisor) ganhar 9000' },
      ],
    },
    {
      id: '7-4', type: 'sql', db: 'empresa', mode: 'script', diff: 2, title: 'Supervisor do mesmo departamento', desc: 'Exercício feito em aula.',
      intro: '<p>Um empregado <b>não pode ser supervisionado por alguém de outro departamento</b>. Valide em INSERT e UPDATE de <code>emp.empregado</code>.</p>',
      solution: `CREATE OR REPLACE FUNCTION emp.empsupdeptigual() RETURNS trigger AS $$
BEGIN
  IF NEW.depto <> (SELECT depto FROM emp.empregado e WHERE e.matricula = NEW.supermat) THEN
    RAISE EXCEPTION 'Empregado % nao pode pertencer ao departamento %', NEW.nome, NEW.depto;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER empsupdeptigual BEFORE INSERT OR UPDATE ON emp.empregado
  FOR EACH ROW EXECUTE PROCEDURE emp.empsupdeptigual();`,
      checks: [
        { test: "UPDATE emp.empregado SET depto = 'PROD' WHERE matricula = '004'", desc: 'Carlos (chefe 002 é da DG) ir para PROD' },
        { test: "UPDATE emp.empregado SET depto = 'DG' WHERE matricula = '004'", desc: 'Carlos ir para DG (mesmo depto do chefe)' },
        { test: "INSERT INTO emp.empregado (nome, snome, matricula, salario, supermat, depto) VALUES ('Lia','Reis','031', 900, '003', 'DES')", desc: 'Novo empregado do DES com chefe da DG' },
        { test: "INSERT INTO emp.empregado (nome, snome, matricula, salario, supermat, depto) VALUES ('Lia','Reis','031', 900, NULL, 'DES')", desc: 'Novo empregado sem supervisor' },
      ],
    },
    {
      id: '7-5', type: 'sql', db: 'empresa', mode: 'script', diff: 2, title: 'Auditoria com AFTER', desc: 'Gravar log de alterações.',
      intro: '<p>A tabela <code>emp.log_salario(matricula, antigo, novo, quando)</code> já existe. Crie um gatilho <b>AFTER UPDATE</b> que registre uma linha no log <b>somente quando o salário mudar</b>.</p>',
      setup: 'CREATE TABLE emp.log_salario (matricula char(9), antigo numeric(10,2), novo numeric(10,2), quando timestamp DEFAULT now());',
      steps: [{ t: 'Condição', html: 'Use <code>IF NEW.salario IS DISTINCT FROM OLD.salario THEN … END IF;</code> na função, ou <code>WHEN (OLD.salario IS DISTINCT FROM NEW.salario)</code> no CREATE TRIGGER.' }, { t: 'Retorno', html: 'Em AFTER o retorno é ignorado: <code>RETURN NULL;</code>' }],
      solution: `CREATE OR REPLACE FUNCTION emp.fn_log_salario() RETURNS trigger AS $$
BEGIN
  INSERT INTO emp.log_salario (matricula, antigo, novo) VALUES (OLD.matricula, OLD.salario, NEW.salario);
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_log_salario AFTER UPDATE ON emp.empregado
  FOR EACH ROW WHEN (OLD.salario IS DISTINCT FROM NEW.salario)
  EXECUTE PROCEDURE emp.fn_log_salario();`,
      checks: [
        { test: "UPDATE emp.empregado SET salario = 950 WHERE matricula = '005'", desc: 'Mudar salário de 005' },
        { test: "UPDATE emp.empregado SET endereco = 'Rua B' WHERE matricula = '006'", desc: 'Mudar só o endereço de 006' },
        { test: "UPDATE emp.empregado SET salario = salario + 100 WHERE depto = 'PROD'", desc: 'Aumento para toda a PROD' },
        { sql: 'SELECT matricula, antigo, novo FROM emp.log_salario ORDER BY matricula, novo', desc: 'Log contém exatamente as mudanças de salário' },
      ],
    },
    {
      id: '7-6', type: 'sql', db: 'empresa', mode: 'script', diff: 3, title: 'Manter um total derivado', desc: 'INSERT/UPDATE/DELETE e TG_OP.',
      intro: '<p>A coluna <code>emp.projeto.total_horas</code> já existe e está correta. Crie um gatilho em <code>emp.trabalha_em</code> que a mantenha atualizada em <b>INSERT, UPDATE e DELETE</b>.</p>',
      setup: 'ALTER TABLE emp.projeto ADD COLUMN total_horas numeric(6,1) DEFAULT 0;\nUPDATE emp.projeto p SET total_horas = (SELECT COALESCE(SUM(horas),0) FROM emp.trabalha_em t WHERE t.pcodigo = p.pcodigo);',
      steps: [{ t: 'Uma função para três eventos', html: 'Use <code>TG_OP</code>: em INSERT some NEW.horas; em DELETE subtraia OLD.horas; em UPDATE faça as duas coisas (o projeto pode ter mudado).' }, { t: 'Alternativa simples', html: 'Recalcular: <code>UPDATE emp.projeto SET total_horas = (SELECT COALESCE(SUM(horas),0) …)</code> para o(s) projeto(s) afetado(s).' }],
      solution: `CREATE OR REPLACE FUNCTION emp.fn_total_horas() RETURNS trigger AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE emp.projeto SET total_horas = total_horas + NEW.horas WHERE pcodigo = NEW.pcodigo;
  END IF;
  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    UPDATE emp.projeto SET total_horas = total_horas - OLD.horas WHERE pcodigo = OLD.pcodigo;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_total_horas AFTER INSERT OR UPDATE OR DELETE ON emp.trabalha_em
  FOR EACH ROW EXECUTE PROCEDURE emp.fn_total_horas();`,
      checks: [
        { test: "INSERT INTO emp.trabalha_em (empmat, pcodigo, horas) VALUES ('001', 1, 10)", desc: 'Nova alocação no projeto 1' },
        { test: "UPDATE emp.trabalha_em SET horas = 30 WHERE empmat = '009' AND pcodigo = 3", desc: 'Alterar horas de 009 no projeto 3' },
        { test: "UPDATE emp.trabalha_em SET pcodigo = 2 WHERE empmat = '005' AND pcodigo = 1", desc: 'Mover 005 do projeto 1 para o 2' },
        { test: "DELETE FROM emp.trabalha_em WHERE empmat = '010' AND pcodigo = 1", desc: 'Remover alocação de 010 no projeto 1' },
        { sql: 'SELECT pcodigo, total_horas FROM emp.projeto ORDER BY pcodigo', desc: 'total_horas correto em todos os projetos' },
      ],
    },
    {
      id: '7-7', type: 'sql', db: 'empresa', mode: 'script', diff: 2, title: 'Limite de projetos por empregado', desc: 'Contagem antes de inserir.',
      intro: '<p>Um empregado pode estar alocado em <b>no máximo 2 projetos</b>. Impeça inserções em <code>emp.trabalha_em</code> que violem a regra.</p>',
      solution: `CREATE OR REPLACE FUNCTION emp.fn_max_projetos() RETURNS trigger AS $$
DECLARE
  qtd int;
BEGIN
  SELECT count(*) INTO qtd FROM emp.trabalha_em WHERE empmat = NEW.empmat;
  IF qtd >= 2 THEN
    RAISE EXCEPTION 'Empregado % ja esta em % projetos', NEW.empmat, qtd;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_max_projetos BEFORE INSERT ON emp.trabalha_em
  FOR EACH ROW EXECUTE PROCEDURE emp.fn_max_projetos();`,
      checks: [
        { test: "INSERT INTO emp.trabalha_em (empmat, pcodigo, horas) VALUES ('009', 2, 5)", desc: 'Irene (já em 2 projetos) em mais um' },
        { test: "INSERT INTO emp.trabalha_em (empmat, pcodigo, horas) VALUES ('004', 1, 5)", desc: 'Carlos (em 1 projeto) em mais um' },
        { test: "INSERT INTO emp.trabalha_em (empmat, pcodigo, horas) VALUES ('004', 2, 5)", desc: 'Carlos em um terceiro' },
      ],
    },
  ],
},
];
