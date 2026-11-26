// Bosses: projetos completos no formato da VF — conceitual → lógico → DDL → consultas → gatilho.

const STEPS_ER = [
  { t: 'Leia e marque', html: 'Sublinhe os <b>substantivos</b> (candidatos a entidade/atributo) e os <b>verbos</b> que ligam substantivos (relacionamentos). Procure “único/código” → identificador.' },
  { t: 'Entidades e identificadores', html: 'Crie as entidades e seus atributos. Toda entidade precisa de identificador ● (ou herdar de uma genérica / ser fraca com identificador parcial).' },
  { t: 'Relacionamentos e atributos deles', html: 'Ligue as entidades por losangos. Dado que depende do par (data, nota, quantidade) é atributo do relacionamento.' },
  { t: 'Cardinalidades', html: 'Para cada ligação: “um(a) OUTRA se associa a no mín./máx. quantos(as) ESTA?” → escreva junto a ESTA. “pode” → mín 0; “deve/todo” → mín 1; “vários” → máx n.' },
  { t: 'Verifique antes de corrigir', html: 'Sintaxe (identificadores, ligações), semântica (bate com o texto?), redundância, completude (as consultas das próximas fases são possíveis?).' },
];
const STEPS_MAP = [
  { t: 'Entidades → tabelas', html: 'Uma tabela por entidade; PK = identificador (<code>#</code>). Compostos viram colunas; multivalorados viram tabela própria.' },
  { t: 'Fracas e especializações', html: 'Fraca: PK = PK da forte + identificador parcial. Especialização: distribuição (PK da genérica repetida nas específicas, também FK).' },
  { t: 'Relacionamentos', html: '1:n → FK no lado de máxima 1. 1:1 → FK única ou fusão. n:m e n-ários → tabela própria com PK composta de FKs + atributos do relacionamento.' },
  { t: 'Referências', html: 'Escreva <code>x referencia TABELA</code> (ou <code>(a, b) referencia TABELA</code>) abaixo de cada tabela.' },
];
const STEPS_DDL = [
  { t: 'Ordem de criação', html: 'Primeiro as tabelas que não referenciam ninguém; depois as que dependem delas.' },
  { t: 'Use exatamente os nomes do esquema de referência', html: 'A correção automática procura essas tabelas/colunas. Crie no schema padrão (sem prefixo).' },
  { t: 'Restrições', html: 'PRIMARY KEY, FOREIGN KEY … REFERENCES, NOT NULL, UNIQUE e CHECK pedidos no enunciado.' },
  { t: 'Teste', html: 'Clique em Executar para ver erros de sintaxe; depois Verificar (o corretor faz inserções de teste válidas e inválidas).' },
];

// ======================================================================
// BOSS 1 — Biblioteca
// ======================================================================
const B1_DDL = `CREATE TABLE area (
  cod_area  INT PRIMARY KEY,
  descricao VARCHAR(60) NOT NULL
);
CREATE TABLE titulo (
  cod_titulo INT PRIMARY KEY,
  titulo     VARCHAR(100) NOT NULL,
  ano        INT CHECK (ano > 1400),
  cod_area   INT NOT NULL REFERENCES area (cod_area)
);
CREATE TABLE autor (
  cod_autor     INT PRIMARY KEY,
  nome          VARCHAR(60) NOT NULL,
  nacionalidade VARCHAR(30)
);
CREATE TABLE autoria (
  cod_titulo INT REFERENCES titulo (cod_titulo),
  cod_autor  INT REFERENCES autor (cod_autor),
  PRIMARY KEY (cod_titulo, cod_autor)
);
CREATE TABLE exemplar (
  tombo      INT PRIMARY KEY,
  cod_titulo INT NOT NULL REFERENCES titulo (cod_titulo)
);
CREATE TABLE usuario (
  cod_usuario INT PRIMARY KEY,
  nome        VARCHAR(60) NOT NULL,
  email       VARCHAR(80) UNIQUE
);
CREATE TABLE telefone_usuario (
  cod_usuario INT REFERENCES usuario (cod_usuario) ON DELETE CASCADE,
  telefone    VARCHAR(20),
  PRIMARY KEY (cod_usuario, telefone)
);
CREATE TABLE emprestimo (
  cod_usuario     INT REFERENCES usuario (cod_usuario),
  tombo           INT REFERENCES exemplar (tombo),
  data_emprestimo DATE,
  data_devolucao  DATE,
  PRIMARY KEY (cod_usuario, tombo, data_emprestimo),
  CHECK (data_devolucao IS NULL OR data_devolucao >= data_emprestimo)
);
`;
const B1_DATA = `
INSERT INTO area VALUES (1,'Computação'), (2,'Matemática'), (3,'Física');
INSERT INTO titulo VALUES (10,'Sistemas de Banco de Dados',2016,1), (11,'Projeto de Banco de Dados',2009,1), (12,'Cálculo',2010,2),
  (13,'Álgebra Linear',2012,2), (14,'Física Básica',2002,3), (15,'Estruturas de Dados',2011,1);
INSERT INTO autor VALUES (1,'Elmasri','EUA'), (2,'Navathe','Índia'), (3,'Heuser','Brasil'), (4,'Stewart','Canadá'),
  (5,'Boldrini','Brasil'), (6,'Nussenzveig','Brasil'), (7,'Szwarcfiter','Brasil');
INSERT INTO autoria VALUES (10,1), (10,2), (11,3), (12,4), (13,5), (14,6), (15,7);
INSERT INTO exemplar VALUES (100,10), (101,10), (102,10), (103,11), (104,11), (105,12), (106,13), (107,13), (108,14), (109,15);
INSERT INTO usuario VALUES (1,'Ana','ana@ime.eb.br'), (2,'Bruno','bruno@ime.eb.br'), (3,'Carla','carla@ime.eb.br'), (4,'Diego','diego@ime.eb.br'), (5,'Eva','eva@ime.eb.br');
INSERT INTO telefone_usuario VALUES (1,'21 99999-0001'), (1,'21 3333-0001'), (2,'21 99999-0002'), (3,'21 99999-0003');
INSERT INTO emprestimo VALUES
  (1,100,'2026-09-01','2026-09-08'), (1,103,'2026-10-02',NULL), (2,101,'2026-10-05','2026-10-10'), (2,105,'2026-11-10',NULL),
  (3,100,'2026-10-15','2026-10-20'), (3,106,'2026-11-01',NULL), (4,108,'2026-08-20','2026-08-27'), (1,109,'2026-11-12',NULL);
`;
const B1_SCHEMA = `<pre>area (<u>cod_area</u> INT, descricao VARCHAR(60) NOT NULL)
titulo (<u>cod_titulo</u> INT, titulo VARCHAR(100) NOT NULL, ano INT &gt; 1400,
        cod_area INT NOT NULL → area)
autor (<u>cod_autor</u> INT, nome VARCHAR(60) NOT NULL, nacionalidade VARCHAR(30))
autoria (<u>cod_titulo</u> → titulo, <u>cod_autor</u> → autor)
exemplar (<u>tombo</u> INT, cod_titulo INT NOT NULL → titulo)
usuario (<u>cod_usuario</u> INT, nome VARCHAR(60) NOT NULL, email VARCHAR(80) UNIQUE)
telefone_usuario (<u>cod_usuario</u> → usuario ON DELETE CASCADE, <u>telefone</u> VARCHAR(20))
emprestimo (<u>cod_usuario</u> → usuario, <u>tombo</u> → exemplar, <u>data_emprestimo</u> DATE,
            data_devolucao DATE;  CHECK devolução nula ou ≥ empréstimo)</pre>`;

// ======================================================================
// BOSS 2 — Orquestras
// ======================================================================
const B2_DDL = `CREATE TABLE orquestra (
  cod_orquestra INT PRIMARY KEY,
  nome          VARCHAR(60) NOT NULL,
  cidade        VARCHAR(40),
  pais          VARCHAR(40),
  data_criacao  DATE
);
CREATE TABLE musico (
  identidade      CHAR(10) PRIMARY KEY,
  nome            VARCHAR(60) NOT NULL,
  nacionalidade   VARCHAR(30),
  data_nascimento DATE,
  cod_orquestra   INT NOT NULL REFERENCES orquestra (cod_orquestra)
);
CREATE TABLE sinfonia (
  cod_sinfonia INT PRIMARY KEY,
  nome         VARCHAR(60) NOT NULL,
  compositor   VARCHAR(60),
  data_criacao DATE
);
CREATE TABLE instrumento (
  cod_instrumento INT PRIMARY KEY,
  nome            VARCHAR(40) NOT NULL UNIQUE
);
CREATE TABLE executa (
  cod_orquestra INT REFERENCES orquestra (cod_orquestra),
  cod_sinfonia  INT REFERENCES sinfonia (cod_sinfonia),
  PRIMARY KEY (cod_orquestra, cod_sinfonia)
);
CREATE TABLE apto (
  identidade      CHAR(10) REFERENCES musico (identidade),
  cod_instrumento INT REFERENCES instrumento (cod_instrumento),
  PRIMARY KEY (identidade, cod_instrumento)
);
CREATE TABLE toca (
  identidade      CHAR(10) REFERENCES musico (identidade),
  cod_sinfonia    INT REFERENCES sinfonia (cod_sinfonia),
  cod_instrumento INT NOT NULL REFERENCES instrumento (cod_instrumento),
  funcao          VARCHAR(30),
  data            DATE,
  PRIMARY KEY (identidade, cod_sinfonia)
);
`;
const B2_DATA = `
INSERT INTO orquestra VALUES (1,'Sinfônica Brasileira','Rio de Janeiro','Brasil','1940-07-11'), (2,'Filarmônica de Berlim','Berlim','Alemanha','1882-05-01'), (3,'OSESP','São Paulo','Brasil','1954-09-13');
INSERT INTO musico VALUES ('M01','Ana','Brasileira','1990-02-10',1), ('M02','Bruno','Brasileira','1985-06-21',1), ('M03','Clara','Alemã','1978-11-03',2),
  ('M04','Dieter','Alemã','1980-01-30',2), ('M05','Eduardo','Brasileira','1992-08-14',3), ('M06','Fátima','Portuguesa','1988-04-25',1);
INSERT INTO sinfonia VALUES (1,'Sinfonia nº 5','Beethoven','1808-12-22'), (2,'Sinfonia nº 9','Beethoven','1824-05-07'), (3,'Bachianas nº 5','Villa-Lobos','1938-03-25'), (4,'Sinfonia nº 40','Mozart','1788-07-25');
INSERT INTO instrumento VALUES (1,'Violino'), (2,'Viola'), (3,'Violoncelo'), (4,'Flauta'), (5,'Piano');
INSERT INTO executa VALUES (1,1), (1,3), (2,1), (2,2), (2,4), (3,3);
INSERT INTO apto VALUES ('M01',1), ('M01',2), ('M02',3), ('M02',5), ('M03',1), ('M04',4), ('M04',5), ('M05',3), ('M06',1), ('M06',4);
INSERT INTO toca VALUES
  ('M01',1,1,'violinista','2026-03-10'), ('M01',3,2,'violista','2026-04-02'), ('M02',1,3,'violoncelista','2026-03-10'),
  ('M02',3,3,'solista','2026-04-02'), ('M03',1,1,'spalla','2025-12-01'), ('M03',2,1,'violinista','2026-01-15'),
  ('M04',2,4,'flautista','2026-01-15'), ('M04',4,5,'pianista','2026-02-20'), ('M05',3,1,'violinista','2026-05-05'),
  ('M06',3,4,'flautista','2026-04-02');
`;
const B2_SCHEMA = `<pre>orquestra (<u>cod_orquestra</u> INT, nome VARCHAR(60) NOT NULL, cidade, pais, data_criacao DATE)
musico (<u>identidade</u> CHAR(10), nome NOT NULL, nacionalidade, data_nascimento DATE,
        cod_orquestra INT NOT NULL → orquestra)
sinfonia (<u>cod_sinfonia</u> INT, nome NOT NULL, compositor, data_criacao DATE)
instrumento (<u>cod_instrumento</u> INT, nome VARCHAR(40) NOT NULL UNIQUE)
executa (<u>cod_orquestra</u> → orquestra, <u>cod_sinfonia</u> → sinfonia)
apto (<u>identidade</u> → musico, <u>cod_instrumento</u> → instrumento)
toca (<u>identidade</u> → musico, <u>cod_sinfonia</u> → sinfonia,
      cod_instrumento INT NOT NULL → instrumento, funcao VARCHAR(30), data DATE)</pre>`;

// ======================================================================
// BOSS 3 — Sistema acadêmico
// ======================================================================
const B3_DDL = `CREATE TABLE pessoa (
  cpf             CHAR(11) PRIMARY KEY,
  nome            VARCHAR(60) NOT NULL,
  data_nascimento DATE,
  rua             VARCHAR(60),
  numero          VARCHAR(10),
  cidade          VARCHAR(40)
);
CREATE TABLE email_pessoa (
  cpf   CHAR(11) REFERENCES pessoa (cpf) ON DELETE CASCADE,
  email VARCHAR(80),
  PRIMARY KEY (cpf, email)
);
CREATE TABLE aluno (
  cpf          CHAR(11) PRIMARY KEY REFERENCES pessoa (cpf),
  matricula    CHAR(8) NOT NULL UNIQUE,
  ano_ingresso INT
);
CREATE TABLE professor (
  cpf        CHAR(11) PRIMARY KEY REFERENCES pessoa (cpf),
  titulacao  VARCHAR(20) CHECK (titulacao IN ('graduado', 'mestre', 'doutor'))
);
CREATE TABLE disciplina (
  cod_disciplina CHAR(5) PRIMARY KEY,
  nome           VARCHAR(60) NOT NULL,
  carga_horaria  INT CHECK (carga_horaria > 0)
);
CREATE TABLE pre_requisito (
  cod_disciplina CHAR(5) REFERENCES disciplina (cod_disciplina),
  cod_requisito  CHAR(5) REFERENCES disciplina (cod_disciplina),
  PRIMARY KEY (cod_disciplina, cod_requisito),
  CHECK (cod_disciplina <> cod_requisito)
);
CREATE TABLE turma (
  cod_disciplina CHAR(5) REFERENCES disciplina (cod_disciplina),
  ano            INT,
  semestre       INT CHECK (semestre IN (1, 2)),
  sala           VARCHAR(10),
  vagas          INT CHECK (vagas > 0),
  cpf_professor  CHAR(11) NOT NULL REFERENCES professor (cpf),
  PRIMARY KEY (cod_disciplina, ano, semestre)
);
CREATE TABLE inscricao (
  cpf_aluno      CHAR(11) REFERENCES aluno (cpf),
  cod_disciplina CHAR(5),
  ano            INT,
  semestre       INT,
  nota           NUMERIC(4,2) CHECK (nota BETWEEN 0 AND 10),
  PRIMARY KEY (cpf_aluno, cod_disciplina, ano, semestre),
  FOREIGN KEY (cod_disciplina, ano, semestre) REFERENCES turma (cod_disciplina, ano, semestre)
);
`;
const B3_DATA = `
INSERT INTO pessoa (cpf, nome, data_nascimento, cidade) VALUES
  ('11111111111','Ana Souza','2004-03-12','Rio de Janeiro'), ('22222222222','Bruno Lima','2003-07-01','Niterói'),
  ('33333333333','Carla Dias','2001-11-20','Rio de Janeiro'), ('44444444444','Diego Alves','2005-01-09','Petrópolis'),
  ('55555555555','Helena Prado','1975-05-05','Rio de Janeiro'), ('66666666666','Ricardo Nunes','1980-09-17','Rio de Janeiro'),
  ('77777777777','Eva Rocha','2006-02-14','Rio de Janeiro'), ('88888888888','Fábio Mota','2006-10-30','Duque de Caxias');
INSERT INTO email_pessoa VALUES ('11111111111','ana@ime.eb.br'), ('11111111111','ana.souza@gmail.com'), ('55555555555','helena@ime.eb.br'), ('33333333333','carla@ime.eb.br');
INSERT INTO aluno VALUES ('11111111111','24001',2024), ('22222222222','24002',2024), ('33333333333','23003',2023), ('44444444444','25004',2025), ('77777777777','25005',2025), ('88888888888','26006',2026);
INSERT INTO professor VALUES ('55555555555','doutor'), ('66666666666','mestre'), ('33333333333','graduado');
INSERT INTO disciplina VALUES ('09911','Algoritmos',60), ('09912','Estruturas de Dados',60), ('09913','Banco de Dados I',60), ('09914','Banco de Dados II',60), ('09915','Cálculo I',90);
INSERT INTO pre_requisito VALUES ('09912','09911'), ('09913','09912'), ('09914','09913'), ('09913','09915');
INSERT INTO turma VALUES
  ('09911',2025,1,'S101',40,'66666666666'), ('09912',2025,2,'S102',40,'66666666666'), ('09915',2025,1,'S201',50,'55555555555'),
  ('09913',2026,2,'S3A',30,'55555555555'), ('09912',2026,1,'S102',35,'33333333333'), ('09914',2026,2,'S3B',25,'55555555555');
INSERT INTO inscricao VALUES
  ('11111111111','09911',2025,1,8.5), ('11111111111','09915',2025,1,7.0), ('11111111111','09912',2025,2,9.0), ('11111111111','09913',2026,2,NULL),
  ('22222222222','09911',2025,1,6.0), ('22222222222','09915',2025,1,4.0), ('22222222222','09912',2025,2,5.5), ('22222222222','09913',2026,2,NULL),
  ('33333333333','09911',2025,1,10), ('33333333333','09912',2025,2,9.5), ('33333333333','09915',2025,1,8.0),
  ('44444444444','09911',2025,1,7.5), ('44444444444','09912',2026,1,6.5);
`;
const B3_SCHEMA = `<pre>pessoa (<u>cpf</u> CHAR(11), nome VARCHAR(60) NOT NULL, data_nascimento DATE, rua, numero, cidade)
email_pessoa (<u>cpf</u> → pessoa ON DELETE CASCADE, <u>email</u> VARCHAR(80))
aluno (<u>cpf</u> → pessoa, matricula CHAR(8) NOT NULL UNIQUE, ano_ingresso INT)
professor (<u>cpf</u> → pessoa, titulacao ∈ {'graduado','mestre','doutor'})
disciplina (<u>cod_disciplina</u> CHAR(5), nome NOT NULL, carga_horaria INT &gt; 0)
pre_requisito (<u>cod_disciplina</u> → disciplina, <u>cod_requisito</u> → disciplina;  diferentes)
turma (<u>cod_disciplina</u> → disciplina, <u>ano</u> INT, <u>semestre</u> ∈ {1,2}, sala, vagas &gt; 0,
       cpf_professor NOT NULL → professor)
inscricao (<u>cpf_aluno</u> → aluno, <u>cod_disciplina, ano, semestre</u> → turma,
           nota NUMERIC(4,2) entre 0 e 10)</pre>`;

export const BOSSES = [
// ======================================================================
{
  id: 'b1', n: 1, diff: 2, title: 'A Biblioteca do IME', tagline: 'Acervo, autores, exemplares e empréstimos.',
  covers: '1:n, n:m, multivalorado, atributo de relacionamento, IS NULL, anti-junção, HAVING, trigger BEFORE.',
  story: `<p>A biblioteca acadêmica quer controlar seu acervo e os empréstimos.</p>
<ul>
<li>A biblioteca possui <b>títulos</b> (livros), cada um com código único, nome (título) e ano de publicação.</li>
<li>Cada título pertence a exatamente uma <b>área de conhecimento</b> (código único e descrição). Uma área pode ter vários títulos ou nenhum.</li>
<li>Cada título é escrito por um ou mais <b>autores</b> (código único, nome, nacionalidade); todo autor cadastrado escreveu pelo menos um título e pode ter escrito vários.</li>
<li>A biblioteca tem um ou mais <b>exemplares</b> de cada título. Cada exemplar tem um número de tombo único e corresponde a um único título.</li>
<li><b>Usuários</b> (código único, nome, e-mail e um ou mais telefones) tomam exemplares emprestados. Em cada empréstimo registram-se a <b>data do empréstimo</b> e a <b>data de devolução</b> (vazia enquanto o livro não volta). Um usuário pode fazer vários empréstimos (ou nenhum) e um exemplar pode ser emprestado várias vezes (ou nunca) — inclusive ao mesmo usuário em datas diferentes.</li>
</ul>`,
  phases: [
    {
      kind: 'er', title: 'Modelo conceitual', steps: STEPS_ER,
      intro: '<p>Construa o esquema conceitual (ER) do minimundo. Atenção ao atributo multivalorado e a onde ficam as datas do empréstimo.</p>',
      gabarito: {
        entities: [
          { name: 'ÁREA|AREA|AREA_CONHECIMENTO|AREADECONHECIMENTO', at: [0, 0], attrs: ['#codigo|codArea|cod', 'descricao|nome'] },
          { name: 'TÍTULO|TITULO|LIVRO|OBRA', at: [2, 0], attrs: ['#codigo|codTitulo|cod|isbn', 'nome|titulo', 'ano|anoPublicacao'] },
          { name: 'AUTOR', at: [4, 0], attrs: ['#codigo|codAutor|cod', 'nome', 'nacionalidade'] },
          { name: 'EXEMPLAR', at: [2, 1.6], attrs: ['#tombo|numero|numTombo|codigo'] },
          { name: 'USUÁRIO|USUARIO|LEITOR', at: [4, 1.6], attrs: ['#codigo|codUsuario|cod', 'nome', 'email|e_mail', 'telefone(1,n)|telefones|fone'] },
        ],
        rels: [
          { name: 'classifica|pertence|possui|tem', at: [1, 0], links: [['ÁREA', '(1,1)'], ['TÍTULO', '(0,n)']] },
          { name: 'escreve|autoria|escrito|escreveu', at: [3, 0], links: [['TÍTULO', '(1,n)'], ['AUTOR', '(1,n)']] },
          { name: 'possui|tem|exemplares|copia', at: [2, 0.8], links: [['TÍTULO', '(1,1)'], ['EXEMPLAR', '(1,n)']] },
          { name: 'empréstimo|emprestimo|empresta|toma|pega', at: [3, 1.6], links: [['EXEMPLAR', '(0,n)'], ['USUÁRIO', '(0,n)']], attrs: ['dataEmprestimo|data|dataEmp|dataInicio', 'dataDevolucao|devolucao|dataDev|dataFim'] },
        ],
      },
      explain: '<p>As datas pertencem ao relacionamento <b>empréstimo</b>. Como o mesmo usuário pode pegar o mesmo exemplar em datas diferentes, a data do empréstimo precisa participar da identificação da ocorrência — no lógico ela entra na chave primária (aspecto temporal).</p><p>TÍTULO × EXEMPLAR é a distinção clássica “o que é um livro?” (Kent): o título é a obra; o exemplar é o objeto físico emprestado.</p>',
    },
    {
      kind: 'map', title: 'Modelo lógico', steps: STEPS_MAP,
      intro: '<p>Mapeie o esquema conceitual de referência (abaixo) para o modelo relacional em notação resumida.</p>',
      gabarito: `AREA (#codArea|codigo|cod, descricao)
TITULO|LIVRO (#codTitulo|codigo|cod|isbn, titulo|nome, ano, codArea|area|codigoArea)
  codArea referencia AREA
AUTOR (#codAutor|codigo|cod, nome, nacionalidade)
AUTORIA|ESCREVE|TITULO_AUTOR|AUTOR_TITULO (#codTitulo|titulo|isbn|codigoTitulo, #codAutor|autor|codigoAutor)
  codTitulo referencia TITULO
  codAutor referencia AUTOR
EXEMPLAR (#tombo|numero|numTombo, codTitulo|titulo|isbn|codigoTitulo)
  codTitulo referencia TITULO
USUARIO|LEITOR (#codUsuario|codigo|cod, nome, email)
TELEFONE_USUARIO|TELEFONE|USUARIO_TELEFONE|TELEFONES|FONE (#codUsuario|usuario|codigo|cod, #telefone|numero|fone)
  codUsuario referencia USUARIO
EMPRESTIMO (#codUsuario|usuario|codigoUsuario, #tombo|exemplar|numTombo, #dataEmprestimo|data|dataEmp, dataDevolucao|devolucao|dataDev)
  codUsuario referencia USUARIO
  tombo referencia EXEMPLAR`,
      explain: '<p>1:n (área–título, título–exemplar) viram FKs no lado n; autoria (n:m) e empréstimo (n:m com datas) viram tabelas; telefone multivalorado vira TELEFONE_USUARIO. A PK de EMPRESTIMO inclui a data por causa do histórico.</p>',
    },
    {
      kind: 'sql', mode: 'script', db: 'vazio', title: 'DDL', steps: STEPS_DDL, schemaHtml: B1_SCHEMA,
      intro: `<p>Implemente o esquema lógico em SQL (PostgreSQL) usando <b>exatamente</b> estes nomes:</p>${B1_SCHEMA}`,
      solution: B1_DDL,
      checks: [
        { kind: 'pk', table: 'area', cols: ['cod_area'] },
        { kind: 'pk', table: 'titulo', cols: ['cod_titulo'] },
        { kind: 'fk', table: 'titulo', cols: ['cod_area'], ref: 'area' },
        { kind: 'pk', table: 'autoria', cols: ['cod_titulo', 'cod_autor'] },
        { kind: 'fk', table: 'autoria', cols: ['cod_titulo'], ref: 'titulo' },
        { kind: 'fk', table: 'autoria', cols: ['cod_autor'], ref: 'autor' },
        { kind: 'fk', table: 'exemplar', cols: ['cod_titulo'], ref: 'titulo' },
        { kind: 'unique', table: 'usuario', cols: ['email'] },
        { kind: 'pk', table: 'telefone_usuario', cols: ['cod_usuario', 'telefone'] },
        { kind: 'fk', table: 'telefone_usuario', cols: ['cod_usuario'], ref: 'usuario', onDelete: 'CASCADE' },
        { kind: 'pk', table: 'emprestimo', cols: ['cod_usuario', 'tombo', 'data_emprestimo'] },
        { kind: 'fk', table: 'emprestimo', cols: ['tombo'], ref: 'exemplar' },
        { kind: 'fk', table: 'emprestimo', cols: ['cod_usuario'], ref: 'usuario' },
        { test: "INSERT INTO area (cod_area, descricao) VALUES (1, 'Computação')", desc: 'Área válida' },
        { test: "INSERT INTO titulo (cod_titulo, titulo, ano, cod_area) VALUES (10, 'Banco de Dados', 2016, 1)", desc: 'Título válido' },
        { test: "INSERT INTO titulo (cod_titulo, titulo, ano, cod_area) VALUES (11, 'X', 2020, 99)", desc: 'Título com área inexistente' },
        { test: "INSERT INTO titulo (cod_titulo, titulo, ano, cod_area) VALUES (12, 'Y', 1200, 1)", desc: 'Título com ano 1200' },
        { test: 'INSERT INTO exemplar (tombo, cod_titulo) VALUES (100, 10)', desc: 'Exemplar válido' },
        { test: "INSERT INTO usuario (cod_usuario, nome, email) VALUES (1, 'Ana', 'ana@ime.eb.br')", desc: 'Usuário válido' },
        { test: "INSERT INTO usuario (cod_usuario, nome, email) VALUES (2, 'Bia', 'ana@ime.eb.br')", desc: 'E-mail repetido' },
        { test: "INSERT INTO emprestimo (cod_usuario, tombo, data_emprestimo, data_devolucao) VALUES (1, 100, '2026-11-01', '2026-10-01')", desc: 'Devolução antes do empréstimo' },
        { test: "INSERT INTO emprestimo (cod_usuario, tombo, data_emprestimo) VALUES (1, 100, '2026-11-01')", desc: 'Empréstimo em aberto válido' },
        { test: "INSERT INTO emprestimo (cod_usuario, tombo, data_emprestimo) VALUES (1, 100, '2026-12-01')", desc: 'Mesmo usuário e exemplar em outra data' },
      ],
    },
    {
      kind: 'sqlset', db: 'vazio', title: 'Consultas', setup: B1_DDL + B1_DATA, schemaHtml: B1_SCHEMA,
      intro: `<p>O banco já está criado e populado com o esquema de referência. Resolva as consultas (cada aba é corrigida separadamente).</p>${B1_SCHEMA}`,
      steps: [{ t: 'Roteiro', html: 'FROM/JOIN (quais tabelas?) → WHERE (quais linhas?) → GROUP BY/HAVING → SELECT → ORDER BY.' }],
      tasks: [
        { title: 'Autores de Computação', task: 'Liste o título e o nome do autor de cada título da área <b>Computação</b>, ordenado por título e depois por autor.', ordered: true, solution: "SELECT t.titulo, a.nome FROM titulo t JOIN area ar ON ar.cod_area = t.cod_area JOIN autoria au ON au.cod_titulo = t.cod_titulo JOIN autor a ON a.cod_autor = au.cod_autor WHERE ar.descricao = 'Computação' ORDER BY t.titulo, a.nome;" },
        { title: 'Exemplares por título', task: 'Para cada título, mostre o título e a quantidade de exemplares.', solution: 'SELECT t.titulo, COUNT(e.tombo) FROM titulo t LEFT JOIN exemplar e ON e.cod_titulo = t.cod_titulo GROUP BY t.cod_titulo, t.titulo;' },
        { title: 'Empréstimos em aberto', task: 'Liste o nome do usuário e o título do livro de todos os empréstimos <b>ainda não devolvidos</b>.', solution: 'SELECT u.nome, t.titulo FROM emprestimo em JOIN usuario u ON u.cod_usuario = em.cod_usuario JOIN exemplar e ON e.tombo = em.tombo JOIN titulo t ON t.cod_titulo = e.cod_titulo WHERE em.data_devolucao IS NULL;' },
        { title: 'Nunca emprestou', task: 'Liste o nome dos usuários que <b>nunca</b> fizeram empréstimo.', solution: 'SELECT u.nome FROM usuario u WHERE NOT EXISTS (SELECT 1 FROM emprestimo e WHERE e.cod_usuario = u.cod_usuario);' },
        { title: 'Áreas com acervo grande', task: 'Liste a descrição das áreas com <b>mais de 2 exemplares</b> no acervo e o total de exemplares de cada uma.', solution: 'SELECT ar.descricao, COUNT(*) FROM area ar JOIN titulo t ON t.cod_area = ar.cod_area JOIN exemplar e ON e.cod_titulo = t.cod_titulo GROUP BY ar.descricao HAVING COUNT(*) > 2;' },
      ],
    },
    {
      kind: 'sql', mode: 'script', db: 'vazio', title: 'Gatilho', setup: B1_DDL + B1_DATA, schemaHtml: B1_SCHEMA,
      intro: '<p>Regra de negócio: <b>um exemplar não pode ser emprestado enquanto houver um empréstimo em aberto</b> (sem data de devolução) para ele. Implemente com uma função PL/pgSQL e um gatilho BEFORE INSERT em <code>emprestimo</code>.</p><p class="small muted">O banco já tem dados: o exemplar 103 está emprestado (aberto); o 100 já foi devolvido.</p>',
      steps: [
        { t: 'Evento e momento', html: 'BEFORE INSERT ON emprestimo FOR EACH ROW — validação antes de gravar.' },
        { t: 'Condição', html: '<code>IF EXISTS (SELECT 1 FROM emprestimo WHERE tombo = NEW.tombo AND data_devolucao IS NULL) THEN RAISE EXCEPTION …</code>' },
        { t: 'Retorno', html: '<code>RETURN NEW;</code>' },
      ],
      solution: `CREATE OR REPLACE FUNCTION fn_exemplar_disponivel() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM emprestimo
             WHERE tombo = NEW.tombo AND data_devolucao IS NULL) THEN
    RAISE EXCEPTION 'Exemplar % já está emprestado', NEW.tombo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_exemplar_disponivel BEFORE INSERT ON emprestimo
  FOR EACH ROW EXECUTE FUNCTION fn_exemplar_disponivel();`,
      checks: [
        { kind: 'trigger', table: 'emprestimo' },
        { test: "INSERT INTO emprestimo (cod_usuario, tombo, data_emprestimo) VALUES (5, 103, '2026-11-20')", desc: 'Emprestar o 103 (em aberto com Ana)' },
        { test: "INSERT INTO emprestimo (cod_usuario, tombo, data_emprestimo) VALUES (5, 104, '2026-11-20')", desc: 'Emprestar o 104 (disponível)' },
        { test: "INSERT INTO emprestimo (cod_usuario, tombo, data_emprestimo) VALUES (4, 100, '2026-11-20')", desc: 'Emprestar o 100 (já devolvido)' },
        { test: "INSERT INTO emprestimo (cod_usuario, tombo, data_emprestimo) VALUES (2, 104, '2026-11-21')", desc: 'Emprestar de novo o 104' },
        { sql: 'SELECT cod_usuario, tombo FROM emprestimo WHERE data_devolucao IS NULL ORDER BY tombo', desc: 'Empréstimos em aberto ao final' },
      ],
    },
  ],
},
// ======================================================================
{
  id: 'b2', n: 2, diff: 3, title: 'A Escola de Música', tagline: 'Orquestras, músicos, sinfonias e instrumentos.',
  covers: 'ternário com atributos, n:m, PK do n-ário com máxima 1, COUNT DISTINCT, junção de 4 tabelas, trigger com consulta.',
  story: `<p>Uma escola de música precisa de uma base de dados sobre músicos, orquestras, sinfonias e instrumentos (minimundo de aula).</p>
<ul>
<li>Cada <b>orquestra</b> tem código único, nome, cidade, país e data de criação.</li>
<li>Orquestras executam <b>sinfonias</b>, as mais variadas; uma sinfonia pode ser executada por várias orquestras (ou nenhuma) e uma orquestra executa várias (ou nenhuma). De cada sinfonia sabe-se código único, nome, compositor e data de criação.</li>
<li>Orquestras são constituídas de <b>músicos</b> (identidade única, nome, nacionalidade e data de nascimento). Um músico pertence a exatamente uma orquestra; toda orquestra tem pelo menos um músico.</li>
<li>Cada músico é apto a tocar um ou mais <b>instrumentos</b> (código único e nome); um instrumento pode ser tocado por vários músicos aptos (ou nenhum).</li>
<li>Músicos tocam sinfonias. Em cada sinfonia o músico toca <b>exatamente um</b> instrumento e exerce uma <b>função</b> (ex.: um violinista pode virar maestro em certa sinfonia). A <b>data</b> em que o músico apresentou a sinfonia também é importante.</li>
</ul>`,
  phases: [
    {
      kind: 'er', title: 'Modelo conceitual', steps: [...STEPS_ER.slice(0, 3), { t: 'Ternário', html: '“Músico toca sinfonia com instrumento” envolve três entidades ao mesmo tempo → relacionamento <b>ternário</b> com atributos função e data. Fixando o par (músico, sinfonia), há <b>exatamente um</b> instrumento → máxima 1 junto a INSTRUMENTO.' }, STEPS_ER[4]],
      intro: '<p>Construa o ER. Repare que “apto a tocar” e “tocou na sinfonia” são fatos diferentes.</p>',
      gabarito: {
        entities: [
          { name: 'ORQUESTRA', at: [0, 0.4], attrs: ['#codigo|codOrquestra|cod', 'nome', 'cidade', 'pais', 'dataCriacao|data|criacao'] },
          { name: 'MÚSICO|MUSICO', at: [2, 0.4], attrs: ['#identidade|id|rg|codigo', 'nome', 'nacionalidade', 'dataNascimento|dataNasc|nascimento'] },
          { name: 'SINFONIA', at: [4, 0.4], attrs: ['#codigo|codSinfonia|cod', 'nome', 'compositor', 'dataCriacao|data|criacao'] },
          { name: 'INSTRUMENTO', at: [2, 2.4], attrs: ['#codigo|codInstrumento|cod', 'nome'] },
        ],
        rels: [
          { name: 'pertence|constitui|integra|compoe|membro', at: [1, 0.4], links: [['ORQUESTRA', '(1,1)'], ['MÚSICO', '(1,n)']] },
          { name: 'executa|execucao|toca_sinfonia|apresenta', at: [2, -0.55], links: [['ORQUESTRA', '(0,n)'], ['SINFONIA', '(0,n)']] },
          { name: 'apto|aptidao|apto_a_tocar|sabe_tocar|habilitado', at: [1.6, 1.4], links: [['MÚSICO', '(0,n)'], ['INSTRUMENTO', '(1,n)']] },
          { name: 'toca|tocou|participa|apresentacao|interpreta', at: [3, 1.4], lenientMin: true, links: [['MÚSICO', '(1,n)'], ['SINFONIA', '(0,n)'], ['INSTRUMENTO', '(1,1)']], attrs: ['funcao', 'data'] },
        ],
      },
      explain: '<p><b>toca</b> é ternário (músico, sinfonia, instrumento) com atributos função e data. Junto a INSTRUMENTO a máxima é 1: um par (músico, sinfonia) usa um único instrumento. <b>apto</b> é um n:m separado: aptidão não implica ter tocado. Na correção, as mínimas do ternário são tratadas com tolerância.</p><p>Pergunta da aula: “o relacionamento apto é redundante?” — não: um músico pode ser apto a um instrumento que nunca usou numa sinfonia.</p>',
    },
    {
      kind: 'map', title: 'Modelo lógico', steps: [...STEPS_MAP.slice(0, 2), { t: 'Ternário com máxima 1', html: 'A tabela TOCA recebe as chaves das três entidades, mas a PK é formada só por (músico, sinfonia): como para cada par há no máximo 1 instrumento, o instrumento fica fora da PK (regra da aula para n-ários).' }, STEPS_MAP[3]],
      intro: '<p>Mapeie o esquema conceitual de referência.</p>',
      gabarito: `ORQUESTRA (#codOrquestra|codigo|cod, nome, cidade, pais, dataCriacao|data|criacao)
MUSICO|MÚSICO (#identidade|id|rg|codigo, nome, nacionalidade, dataNascimento|dataNasc|nascimento, codOrquestra|orquestra|codigoOrquestra)
  codOrquestra referencia ORQUESTRA
SINFONIA (#codSinfonia|codigo|cod, nome, compositor, dataCriacao|data|criacao)
INSTRUMENTO (#codInstrumento|codigo|cod, nome)
EXECUTA|EXECUCAO|ORQUESTRA_SINFONIA (#codOrquestra|orquestra|codigoOrquestra, #codSinfonia|sinfonia|codigoSinfonia)
  codOrquestra referencia ORQUESTRA
  codSinfonia referencia SINFONIA
APTO|APTIDAO|MUSICO_INSTRUMENTO (#identidade|musico|idMusico|id, #codInstrumento|instrumento|codigoInstrumento)
  identidade referencia MUSICO
  codInstrumento referencia INSTRUMENTO
TOCA|TOCOU|PARTICIPACAO|APRESENTACAO (#identidade|musico|idMusico|id, #codSinfonia|sinfonia|codigoSinfonia, codInstrumento|instrumento|codigoInstrumento, funcao, data)
  identidade referencia MUSICO
  codSinfonia referencia SINFONIA
  codInstrumento referencia INSTRUMENTO`,
      explain: '<p>PK de TOCA = (identidade, codSinfonia) garante “um instrumento por músico em cada sinfonia”. Já a regra “só toca instrumento para o qual é apto” envolve outra tabela — o modelo relacional não expressa: fica para o gatilho da fase 5.</p>',
    },
    {
      kind: 'sql', mode: 'script', db: 'vazio', title: 'DDL', steps: STEPS_DDL, schemaHtml: B2_SCHEMA,
      intro: `<p>Implemente em SQL com <b>exatamente</b> estes nomes:</p>${B2_SCHEMA}`,
      solution: B2_DDL,
      checks: [
        { kind: 'fk', table: 'musico', cols: ['cod_orquestra'], ref: 'orquestra' },
        { kind: 'notnull', table: 'musico', col: 'cod_orquestra' },
        { kind: 'unique', table: 'instrumento', cols: ['nome'] },
        { kind: 'pk', table: 'executa', cols: ['cod_orquestra', 'cod_sinfonia'] },
        { kind: 'pk', table: 'apto', cols: ['identidade', 'cod_instrumento'] },
        { kind: 'fk', table: 'apto', cols: ['identidade'], ref: 'musico' },
        { kind: 'pk', table: 'toca', cols: ['identidade', 'cod_sinfonia'] },
        { kind: 'fk', table: 'toca', cols: ['cod_instrumento'], ref: 'instrumento' },
        { kind: 'fk', table: 'toca', cols: ['cod_sinfonia'], ref: 'sinfonia' },
        { test: "INSERT INTO orquestra (cod_orquestra, nome) VALUES (1, 'OSB')", desc: 'Orquestra válida' },
        { test: "INSERT INTO musico (identidade, nome, cod_orquestra) VALUES ('M01', 'Ana', 1)", desc: 'Músico válido' },
        { test: "INSERT INTO musico (identidade, nome, cod_orquestra) VALUES ('M02', 'Bia', NULL)", desc: 'Músico sem orquestra' },
        { test: "INSERT INTO sinfonia (cod_sinfonia, nome) VALUES (1, 'Nº 5')", desc: 'Sinfonia válida' },
        { test: "INSERT INTO instrumento (cod_instrumento, nome) VALUES (1, 'Violino')", desc: 'Instrumento válido' },
        { test: "INSERT INTO instrumento (cod_instrumento, nome) VALUES (2, 'Violino')", desc: 'Instrumento com nome repetido' },
        { test: "INSERT INTO toca (identidade, cod_sinfonia, cod_instrumento, funcao) VALUES ('M01', 1, 1, 'spalla')", desc: 'Músico toca sinfonia' },
        { test: "INSERT INTO toca (identidade, cod_sinfonia, cod_instrumento, funcao) VALUES ('M01', 1, 1, 'solista')", desc: 'Mesmo músico na mesma sinfonia de novo' },
        { test: "INSERT INTO toca (identidade, cod_sinfonia, cod_instrumento) VALUES ('M01', 1, NULL)", desc: 'Tocar sem instrumento' },
      ],
    },
    {
      kind: 'sqlset', db: 'vazio', title: 'Consultas', setup: B2_DDL + B2_DATA, schemaHtml: B2_SCHEMA,
      intro: `<p>Banco criado e populado com o esquema de referência.</p>${B2_SCHEMA}`,
      tasks: [
        { title: 'Músicos brasileiros', task: 'Liste o nome dos músicos e o nome da orquestra a que pertencem, apenas para orquestras do <b>Brasil</b>, ordenado pelo nome do músico.', ordered: true, solution: "SELECT m.nome, o.nome FROM musico m JOIN orquestra o ON o.cod_orquestra = m.cod_orquestra WHERE o.pais = 'Brasil' ORDER BY m.nome;" },
        { title: 'Orquestras por sinfonia', task: 'Para cada sinfonia (nome), mostre quantas orquestras a executam.', solution: 'SELECT s.nome, COUNT(e.cod_orquestra) FROM sinfonia s LEFT JOIN executa e ON e.cod_sinfonia = s.cod_sinfonia GROUP BY s.cod_sinfonia, s.nome;' },
        { title: 'Tocou sem aptidão', task: 'Liste o nome dos músicos que tocaram alguma sinfonia com um instrumento para o qual <b>não</b> são aptos.', solution: 'SELECT DISTINCT m.nome FROM musico m JOIN toca t ON t.identidade = m.identidade WHERE NOT EXISTS (SELECT 1 FROM apto a WHERE a.identidade = t.identidade AND a.cod_instrumento = t.cod_instrumento);' },
        { title: 'Beethoven com alemães', task: 'Para as sinfonias de <b>Beethoven</b> tocadas por músicos de nacionalidade <b>Alemã</b>, mostre o nome da sinfonia, o nome do músico e o nome do instrumento.', solution: "SELECT s.nome, m.nome, i.nome FROM toca t JOIN sinfonia s ON s.cod_sinfonia = t.cod_sinfonia JOIN musico m ON m.identidade = t.identidade JOIN instrumento i ON i.cod_instrumento = t.cod_instrumento WHERE s.compositor = 'Beethoven' AND m.nacionalidade = 'Alemã';" },
        { title: 'Compositores populares', task: 'Para cada compositor, mostre o número de <b>músicos distintos</b> que já tocaram suas obras, em ordem decrescente desse número (empate: compositor).', ordered: true, solution: 'SELECT s.compositor, COUNT(DISTINCT t.identidade) AS qtd FROM sinfonia s JOIN toca t ON t.cod_sinfonia = s.cod_sinfonia GROUP BY s.compositor ORDER BY qtd DESC, s.compositor;' },
      ],
    },
    {
      kind: 'sql', mode: 'script', db: 'vazio', title: 'Gatilho', setup: B2_DDL + B2_DATA, schemaHtml: B2_SCHEMA,
      intro: '<p>Regra de negócio que o esquema não garante: <b>um músico só pode tocar uma sinfonia com um instrumento para o qual é apto</b>. Valide em INSERT e UPDATE na tabela <code>toca</code>.</p>',
      steps: [
        { t: 'Evento', html: 'BEFORE INSERT OR UPDATE ON toca FOR EACH ROW.' },
        { t: 'Condição', html: '<code>IF NOT EXISTS (SELECT 1 FROM apto WHERE identidade = NEW.identidade AND cod_instrumento = NEW.cod_instrumento) THEN RAISE EXCEPTION …</code>' },
      ],
      solution: `CREATE OR REPLACE FUNCTION fn_toca_apto() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM apto
                 WHERE identidade = NEW.identidade
                   AND cod_instrumento = NEW.cod_instrumento) THEN
    RAISE EXCEPTION 'Músico % não é apto ao instrumento %', NEW.identidade, NEW.cod_instrumento;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_toca_apto BEFORE INSERT OR UPDATE ON toca
  FOR EACH ROW EXECUTE FUNCTION fn_toca_apto();`,
      checks: [
        { kind: 'trigger', table: 'toca' },
        { test: "INSERT INTO toca (identidade, cod_sinfonia, cod_instrumento, funcao, data) VALUES ('M06', 1, 4, 'flautista', '2026-06-01')", desc: 'Fátima (apta à flauta) toca flauta' },
        { test: "INSERT INTO toca (identidade, cod_sinfonia, cod_instrumento, funcao, data) VALUES ('M01', 2, 5, 'pianista', '2026-06-01')", desc: 'Ana (não apta ao piano) toca piano' },
        { test: "UPDATE toca SET cod_instrumento = 5 WHERE identidade = 'M02' AND cod_sinfonia = 1", desc: 'Bruno (apto ao piano) muda para piano' },
        { test: "UPDATE toca SET cod_instrumento = 1 WHERE identidade = 'M04' AND cod_sinfonia = 2", desc: 'Dieter (não apto ao violino) muda para violino' },
        { sql: 'SELECT identidade, cod_sinfonia, cod_instrumento FROM toca ORDER BY 1, 2', desc: 'Estado final de toca' },
      ],
    },
  ],
},
// ======================================================================
{
  id: 'b3', n: 3, diff: 3, title: 'O Sistema Acadêmico', tagline: 'Pessoas, alunos, professores, turmas e pré-requisitos.',
  covers: 'especialização (t,i), entidade fraca, auto-relacionamento n:m, composto, multivalorado, FK composta, divisão, trigger com duas regras.',
  story: `<p>A seção de ensino quer um sistema acadêmico.</p>
<ul>
<li>Toda <b>pessoa</b> cadastrada tem CPF (único), nome, data de nascimento, endereço (rua, número e cidade) e um ou mais e-mails.</li>
<li>Toda pessoa é <b>aluno</b>, <b>professor</b> ou ambos (um aluno de pós pode ser professor de graduação). Do aluno guarda-se a matrícula (única) e o ano de ingresso; do professor, a titulação (graduado, mestre ou doutor).</li>
<li><b>Disciplinas</b> têm código (único, ex.: 09913), nome e carga horária. Uma disciplina pode exigir várias outras como <b>pré-requisito</b> e ser pré-requisito de várias.</li>
<li>Cada disciplina é oferecida em <b>turmas</b>. Uma turma é identificada pela disciplina + ano + semestre (ex.: Banco de Dados I, 2026/2) e tem sala e número de vagas. Uma disciplina pode ter várias turmas ou nenhuma.</li>
<li>Cada turma é ministrada por exatamente um professor; um professor ministra várias turmas ou nenhuma.</li>
<li>Alunos se inscrevem em turmas; em cada inscrição registra-se a <b>nota final</b> (vazia enquanto o semestre não acaba). Uma turma tem de zero a muitos alunos e um aluno pode se inscrever em várias turmas.</li>
</ul>`,
  phases: [
    {
      kind: 'er', title: 'Modelo conceitual', steps: [...STEPS_ER.slice(0, 2), { t: 'Especialização (t,i)', html: 'PESSOA → ALUNO, PROFESSOR. Toda pessoa é pelo menos um (total) e pode ser os dois (inclusiva) → <code>(t,i)</code>. As filhas herdam cpf/nome.' }, { t: 'Turma é fraca', html: 'TURMA é identificada por ano + semestre <b>dentro</b> da disciplina → entidade fraca, com ano e semestre como identificador parcial e relacionamento identificador com DISCIPLINA (1,1).' }, { t: 'Auto-relacionamento', html: 'pré-requisito: DISCIPLINA ligada duas vezes ao mesmo losango, papéis distintos, (0,n) e (0,n).' }, STEPS_ER[3], STEPS_ER[4]],
      intro: '<p>Construa o ER completo. É o boss mais difícil: use todos os construtos.</p>',
      gabarito: {
        entities: [
          { name: 'PESSOA', at: [1.5, 0], attrs: ['#cpf', 'nome', 'dataNascimento|dataNasc|nascimento', 'endereco{rua,numero,cidade}', 'email(1,n)|emails'] },
          { name: 'ALUNO|ESTUDANTE', at: [0, 1.5], attrs: ['matricula', 'anoIngresso|ingresso|ano'] },
          { name: 'PROFESSOR|DOCENTE', at: [3, 1.5], attrs: ['titulacao|titulo'] },
          { name: 'TURMA', at: [1.5, 3], weak: true, attrs: ['#ano', '#semestre', 'sala', 'vagas|numVagas'] },
          { name: 'DISCIPLINA', at: [4.2, 3], attrs: ['#codigo|codDisciplina|cod', 'nome', 'cargaHoraria|ch|carga'] },
        ],
        specs: [{ parent: 'PESSOA', kind: 't,i', children: ['ALUNO', 'PROFESSOR'] }],
        rels: [
          { name: 'inscreve|inscricao|matricula|cursa|inscrito', at: [0.75, 2.25], links: [['ALUNO', '(0,n)'], ['TURMA', '(0,n)']], attrs: ['nota|notaFinal'] },
          { name: 'ministra|leciona|ensina', at: [2.25, 2.25], links: [['PROFESSOR', '(1,1)'], ['TURMA', '(0,n)']] },
          { name: 'oferta|oferece|possui|tem|pertence', at: [2.85, 3], links: [['DISCIPLINA', '(1,1)'], ['TURMA', '(0,n)']] },
          { name: 'pre_requisito|prerequisito|requisito|requer|exige', at: [4.2, 4.1], links: [['DISCIPLINA', '(0,n)', 'requisito'], ['DISCIPLINA', '(0,n)', 'dependente']] },
        ],
      },
      explain: '<p>Leituras: “uma turma é ministrada por exatamente 1 professor” → (1,1) junto a PROFESSOR; “um aluno se inscreve em 0..n turmas” → (0,n) junto a TURMA. A nota pertence à <b>inscrição</b> (par aluno-turma). TURMA é fraca: sem a disciplina, “2026/2” não identifica nada.</p>',
    },
    {
      kind: 'map', title: 'Modelo lógico', steps: [...STEPS_MAP, { t: 'FK composta', html: 'INSCRICAO referencia TURMA pela chave inteira: <code>(codDisciplina, ano, semestre) referencia TURMA</code>.' }],
      intro: '<p>Mapeie usando <b>distribuição</b> para a hierarquia (como a especialização é inclusiva, não use uma coluna “tipo” única).</p>',
      diagramHeight: 480,
      gabarito: `PESSOA (#cpf, nome, dataNascimento|dataNasc|nascimento, rua, numero, cidade)
EMAIL_PESSOA|EMAIL|PESSOA_EMAIL|EMAILS (#cpf|cpfPessoa|pessoa, #email)
  cpf referencia PESSOA
ALUNO (#cpf|cpfAluno, matricula, anoIngresso|ingresso|ano)
  cpf referencia PESSOA
  matricula é chave candidata
PROFESSOR (#cpf|cpfProfessor, titulacao|titulo)
  cpf referencia PESSOA
DISCIPLINA (#codDisciplina|codigo|codDisc|cod, nome, cargaHoraria|ch|carga)
PRE_REQUISITO|PREREQUISITO|REQUISITO|PRE_REQ (#codDisciplina|disciplina|codDisc|codigo, #codRequisito|requisito|codPreRequisito|codPre|codReq)
  codDisciplina referencia DISCIPLINA
  codRequisito referencia DISCIPLINA
TURMA (#codDisciplina|disciplina|codDisc|codigo, #ano, #semestre, sala, vagas|numVagas, cpfProfessor|professor|cpfProf)
  codDisciplina referencia DISCIPLINA
  cpfProfessor referencia PROFESSOR
INSCRICAO|INSCREVE|MATRICULA|CURSA|INSCRITO (#cpfAluno|aluno|cpf|matricula|matAluno, #codDisciplina|disciplina|codDisc|codigo, #ano, #semestre, nota|notaFinal)
  cpfAluno referencia ALUNO
  (codDisciplina, ano, semestre) referencia TURMA`,
      explain: '<p>Com cobertura <b>inclusiva</b>, a coluna “tipo” única não serve (a pessoa pode ser dos dois tipos); a existência da linha em ALUNO/PROFESSOR já indica o papel. A regra “toda pessoa é aluno ou professor” (total) não é garantida pelo relacional — exigiria gatilho.</p>',
    },
    {
      kind: 'sql', mode: 'script', db: 'vazio', title: 'DDL', steps: STEPS_DDL, schemaHtml: B3_SCHEMA,
      intro: `<p>Implemente em SQL com <b>exatamente</b> estes nomes:</p>${B3_SCHEMA}`,
      solution: B3_DDL,
      checks: [
        { kind: 'pk', table: 'email_pessoa', cols: ['cpf', 'email'] },
        { kind: 'pk', table: 'aluno', cols: ['cpf'] },
        { kind: 'fk', table: 'aluno', cols: ['cpf'], ref: 'pessoa' },
        { kind: 'unique', table: 'aluno', cols: ['matricula'] },
        { kind: 'fk', table: 'professor', cols: ['cpf'], ref: 'pessoa' },
        { kind: 'pk', table: 'pre_requisito', cols: ['cod_disciplina', 'cod_requisito'] },
        { kind: 'fk', table: 'pre_requisito', cols: ['cod_requisito'], ref: 'disciplina' },
        { kind: 'pk', table: 'turma', cols: ['cod_disciplina', 'ano', 'semestre'] },
        { kind: 'fk', table: 'turma', cols: ['cpf_professor'], ref: 'professor' },
        { kind: 'pk', table: 'inscricao', cols: ['cpf_aluno', 'cod_disciplina', 'ano', 'semestre'] },
        { kind: 'fk', table: 'inscricao', cols: ['cod_disciplina', 'ano', 'semestre'], ref: 'turma' },
        { kind: 'fk', table: 'inscricao', cols: ['cpf_aluno'], ref: 'aluno' },
        { test: "INSERT INTO pessoa (cpf, nome) VALUES ('11111111111', 'Ana'), ('55555555555', 'Helena')", desc: 'Pessoas válidas' },
        { test: "INSERT INTO aluno (cpf, matricula, ano_ingresso) VALUES ('11111111111', '24001', 2024)", desc: 'Aluno válido' },
        { test: "INSERT INTO aluno (cpf, matricula, ano_ingresso) VALUES ('99999999999', '24009', 2024)", desc: 'Aluno sem pessoa correspondente' },
        { test: "INSERT INTO professor (cpf, titulacao) VALUES ('55555555555', 'doutor')", desc: 'Professor válido' },
        { test: "INSERT INTO professor (cpf, titulacao) VALUES ('11111111111', 'phd')", desc: "Titulação 'phd'" },
        { test: "INSERT INTO disciplina (cod_disciplina, nome, carga_horaria) VALUES ('09913', 'BD I', 60), ('09912', 'ED', 60)", desc: 'Disciplinas válidas' },
        { test: "INSERT INTO pre_requisito (cod_disciplina, cod_requisito) VALUES ('09913', '09913')", desc: 'Disciplina pré-requisito de si mesma' },
        { test: "INSERT INTO turma (cod_disciplina, ano, semestre, sala, vagas, cpf_professor) VALUES ('09913', 2026, 3, 'S1', 30, '55555555555')", desc: 'Turma no semestre 3' },
        { test: "INSERT INTO turma (cod_disciplina, ano, semestre, sala, vagas, cpf_professor) VALUES ('09913', 2026, 2, 'S1', 30, '55555555555')", desc: 'Turma válida' },
        { test: "INSERT INTO inscricao (cpf_aluno, cod_disciplina, ano, semestre, nota) VALUES ('11111111111', '09913', 2026, 2, 11)", desc: 'Nota 11' },
        { test: "INSERT INTO inscricao (cpf_aluno, cod_disciplina, ano, semestre) VALUES ('11111111111', '09913', 2025, 1)", desc: 'Inscrição em turma inexistente' },
        { test: "INSERT INTO inscricao (cpf_aluno, cod_disciplina, ano, semestre) VALUES ('11111111111', '09913', 2026, 2)", desc: 'Inscrição válida' },
      ],
    },
    {
      kind: 'sqlset', db: 'vazio', title: 'Consultas', setup: B3_DDL + B3_DATA, schemaHtml: B3_SCHEMA,
      intro: `<p>Banco criado e populado com o esquema de referência. Aprovação = nota ≥ 5.</p>${B3_SCHEMA}`,
      tasks: [
        { title: 'Turma de BD I', task: 'Liste o nome dos alunos inscritos na turma de <b>Banco de Dados I</b> de <b>2026/2</b> e o nome do professor da turma, ordenado pelo nome do aluno.', ordered: true, solution: "SELECT pa.nome, pp.nome FROM inscricao i JOIN turma t ON t.cod_disciplina = i.cod_disciplina AND t.ano = i.ano AND t.semestre = i.semestre JOIN disciplina d ON d.cod_disciplina = t.cod_disciplina JOIN pessoa pa ON pa.cpf = i.cpf_aluno JOIN pessoa pp ON pp.cpf = t.cpf_professor WHERE d.nome = 'Banco de Dados I' AND t.ano = 2026 AND t.semestre = 2 ORDER BY pa.nome;" },
        { title: 'Pré-requisitos por disciplina', task: 'Para cada disciplina, mostre o nome e a quantidade de pré-requisitos diretos (inclusive zero), ordenado pelo nome.', ordered: true, solution: 'SELECT d.nome, COUNT(p.cod_requisito) FROM disciplina d LEFT JOIN pre_requisito p ON p.cod_disciplina = d.cod_disciplina GROUP BY d.cod_disciplina, d.nome ORDER BY d.nome;' },
        { title: 'Bons alunos', task: 'Mostre o nome e a média das notas já lançadas de cada aluno, apenas para quem tem média <b>≥ 7</b>.', solution: 'SELECT p.nome, AVG(i.nota) FROM inscricao i JOIN pessoa p ON p.cpf = i.cpf_aluno WHERE i.nota IS NOT NULL GROUP BY p.cpf, p.nome HAVING AVG(i.nota) >= 7;' },
        { title: 'Aluno e professor', task: 'Liste o nome das pessoas que são, ao mesmo tempo, alunas e professoras.', solution: 'SELECT p.nome FROM pessoa p WHERE p.cpf IN (SELECT cpf FROM aluno INTERSECT SELECT cpf FROM professor);' },
        { title: 'Sem os pré-requisitos', task: 'Liste o nome dos alunos inscritos em <b>Banco de Dados I</b> (09913) em 2026/2 que <b>não</b> foram aprovados (nota ≥ 5) em <b>todos</b> os pré-requisitos dessa disciplina.', solution: "SELECT p.nome FROM inscricao i JOIN pessoa p ON p.cpf = i.cpf_aluno WHERE i.cod_disciplina = '09913' AND i.ano = 2026 AND i.semestre = 2 AND EXISTS (SELECT 1 FROM pre_requisito pr WHERE pr.cod_disciplina = '09913' AND NOT EXISTS (SELECT 1 FROM inscricao x WHERE x.cpf_aluno = i.cpf_aluno AND x.cod_disciplina = pr.cod_requisito AND x.nota >= 5));" },
      ],
    },
    {
      kind: 'sql', mode: 'script', db: 'vazio', title: 'Gatilho', setup: B3_DDL + B3_DATA, schemaHtml: B3_SCHEMA,
      intro: '<p>Ao inscrever um aluno numa turma (INSERT em <code>inscricao</code>), impeça a inscrição se:</p><ol><li>a turma já estiver com todas as <b>vagas</b> ocupadas; ou</li><li>o aluno <b>não foi aprovado</b> (nota ≥ 5) em todos os pré-requisitos da disciplina.</li></ol>',
      steps: [
        { t: 'Variáveis', html: '<pre>DECLARE\n  v_vagas int;\n  v_inscritos int;\nBEGIN\n  SELECT vagas INTO v_vagas FROM turma WHERE …;\n  SELECT count(*) INTO v_inscritos FROM inscricao WHERE …;</pre>' },
        { t: 'Pré-requisitos (divisão)', html: '“Existe pré-requisito da disciplina sem aprovação do aluno?” → <code>EXISTS (… pre_requisito … AND NOT EXISTS (… inscricao … nota &gt;= 5))</code>.' },
        { t: 'Gatilho', html: '<code>CREATE TRIGGER … BEFORE INSERT ON inscricao FOR EACH ROW EXECUTE FUNCTION …;</code>' },
      ],
      solution: `CREATE OR REPLACE FUNCTION fn_valida_inscricao() RETURNS trigger AS $$
DECLARE
  v_vagas     int;
  v_inscritos int;
BEGIN
  SELECT vagas INTO v_vagas FROM turma
   WHERE cod_disciplina = NEW.cod_disciplina AND ano = NEW.ano AND semestre = NEW.semestre;
  SELECT count(*) INTO v_inscritos FROM inscricao
   WHERE cod_disciplina = NEW.cod_disciplina AND ano = NEW.ano AND semestre = NEW.semestre;
  IF v_inscritos >= v_vagas THEN
    RAISE EXCEPTION 'Turma sem vagas';
  END IF;

  IF EXISTS (SELECT 1 FROM pre_requisito pr
             WHERE pr.cod_disciplina = NEW.cod_disciplina
               AND NOT EXISTS (SELECT 1 FROM inscricao i
                               WHERE i.cpf_aluno = NEW.cpf_aluno
                                 AND i.cod_disciplina = pr.cod_requisito
                                 AND i.nota >= 5)) THEN
    RAISE EXCEPTION 'Aluno sem aprovação em todos os pré-requisitos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_valida_inscricao BEFORE INSERT ON inscricao
  FOR EACH ROW EXECUTE FUNCTION fn_valida_inscricao();`,
      checks: [
        { kind: 'trigger', table: 'inscricao' },
        { test: "INSERT INTO inscricao (cpf_aluno, cod_disciplina, ano, semestre) VALUES ('44444444444', '09913', 2026, 2)", desc: 'Diego em BD I (não cursou Cálculo I)' },
        { test: "INSERT INTO inscricao (cpf_aluno, cod_disciplina, ano, semestre) VALUES ('33333333333', '09913', 2026, 2)", desc: 'Carla em BD I (aprovada nos pré-requisitos)' },
        { test: "INSERT INTO inscricao (cpf_aluno, cod_disciplina, ano, semestre) VALUES ('77777777777', '09911', 2025, 1)", desc: 'Eva em Algoritmos (sem pré-requisitos, com vaga)' },
        { test: "UPDATE turma SET vagas = 5 WHERE cod_disciplina = '09911' AND ano = 2025 AND semestre = 1", desc: 'Reduzir vagas de Algoritmos 2025/1 para 5' },
        { test: "INSERT INTO inscricao (cpf_aluno, cod_disciplina, ano, semestre) VALUES ('88888888888', '09911', 2025, 1)", desc: 'Fábio em Algoritmos 2025/1 (turma lotada)' },
        { sql: 'SELECT cpf_aluno, cod_disciplina, ano, semestre FROM inscricao ORDER BY 1, 2, 3', desc: 'Inscrições ao final' },
      ],
    },
  ],
},
];
