// Teoria — resumo do material de aula, na ordem dos assuntos da FOE.
import { SQLREF } from './sqlref.js';

export const FIGS = {
  lotacao: {
    entities: [{ name: 'EMPREGADO', at: [0, 0], attrs: ['#matricula', 'nome'] }, { name: 'DEPARTAMENTO', at: [2, 0], attrs: ['#sigla', 'nome'] }],
    rels: [{ name: 'lotação', at: [1, 0], links: [['EMPREGADO', '(1,n)'], ['DEPARTAMENTO', '(1,1)']] }],
  },
  favorita: {
    entities: [{ name: 'USUÁRIO', at: [0, 0], attrs: ['#idUsuario', 'nome', 'email'] }, { name: 'ÁLBUM', at: [2, 0], attrs: ['#idAlbum', 'titulo', 'ano'] }],
    rels: [{ name: 'favorita', at: [1, 0], links: [['USUÁRIO', '(0,n)'], ['ÁLBUM', '(0,n)']], attrs: ['dataFavorito'] }],
  },
  umum: {
    entities: [{ name: 'PACIENTE', at: [0, 0], attrs: ['#idPet', 'nome'] }, { name: 'CARTEIRA', at: [2, 0], attrs: ['#numRegistro', 'dataEmissao'] }],
    rels: [{ name: 'tem', at: [1, 0], links: [['PACIENTE', '(1,1)'], ['CARTEIRA', '(1,1)']] }],
  },
  fraca: {
    entities: [{ name: 'EMPREGADO', at: [0, 0], attrs: ['#matricula', 'nome'] }, { name: 'DEPENDENTE', at: [2, 0], weak: true, attrs: ['#nome', 'dataNasc'] }],
    rels: [{ name: 'possui', at: [1, 0], links: [['EMPREGADO', '(1,1)'], ['DEPENDENTE', '(0,n)']] }],
  },
  ternario: {
    entities: [{ name: 'MÉDICO', at: [0, 0], attrs: ['#crm', 'nome'] }, { name: 'PACIENTE', at: [2, 0], attrs: ['#cpf', 'nome'] }, { name: 'MEDICAMENTO', at: [1, 1], attrs: ['#codigo', 'nomeComercial'] }],
    rels: [{ name: 'prescreve', at: [1, 0], links: [['MÉDICO', '(0,n)'], ['PACIENTE', '(0,n)'], ['MEDICAMENTO', '(0,n)']], attrs: ['dataHora', 'dosagem'] }],
  },
  auto: {
    entities: [{ name: 'EMPREGADO', at: [0, 0], attrs: ['#matricula', 'nome'] }],
    rels: [{ name: 'supervisiona', at: [1.3, 0], links: [['EMPREGADO', '(0,1)', 'chefe'], ['EMPREGADO', '(0,n)', 'subordinado']] }],
  },
  spec: {
    entities: [{ name: 'PESSOA', at: [1, 0], attrs: ['#cpf', 'nome', 'telefone(0,n)', 'endereco{rua,numero,cidade}'] }, { name: 'ALUNO', at: [0, 1.2], attrs: ['matricula'] }, { name: 'PROFESSOR', at: [2, 1.2], attrs: ['titulacao'] }],
    specs: [{ parent: 'PESSOA', kind: 't,e', children: ['ALUNO', 'PROFESSOR'] }],
  },
  agregacao: {
    entities: [{ name: 'CIDADE', at: [0, 0], attrs: ['#nome'] }, { name: 'PRODUTO', at: [2, 0], attrs: ['#codigo'] }, { name: 'DISTRIBUIDOR', at: [1, 1.4], attrs: ['#cnpj'] }],
    rels: [
      { name: 'demanda', at: [1, 0], assoc: true, links: [['CIDADE', '(0,n)'], ['PRODUTO', '(0,n)']] },
      { name: 'atende', at: [1, 0.75], links: [['demanda', '(1,1)'], ['DISTRIBUIDOR', '(0,n)']] },
    ],
  },
};

export const CHAPTERS = [
{
  id: 'conceitos', num: 1, title: 'Conceitos básicos', foe: 'Conceitos básicos de BD',
  practice: ['1-1'],
  html: `
<p>Um <b>banco de dados (BD)</b> é uma coleção de dados <b>relacionados</b>, com significado inerente, que representa um aspecto do mundo real — o <b>minimundo</b> (ou universo de discurso) — e é projetado para um grupo de usuários com uma finalidade específica. Uma união aleatória de dados <i>não</i> é um BD.</p>
<p>Um <b>SGBD</b> (Sistema Gerenciador de BD) é o software de uso geral que <b>intermedia todos os acessos</b> ao BD e facilita seu ciclo de vida:</p>
<table class="tbl"><tr><th>Função</th><th>O que é</th></tr>
<tr><td>Definição</td><td>especificar tipos, estruturas e restrições — guardados como <b>metadados</b> no catálogo/dicionário</td></tr>
<tr><td>Construção</td><td>armazenar os dados no meio físico</td></tr>
<tr><td>Manipulação</td><td>consultas, atualizações, relatórios</td></tr>
<tr><td>Compartilhamento</td><td>acesso simultâneo de vários usuários/programas com proteção</td></tr></table>
<p>O SGBD também garante <b>integridade e segurança</b>, oferece <b>backup e recuperação</b> de falhas e suporta <b>processamento multiusuário</b>.</p>
<h3>Por que não usar só arquivos?</h3>
<ul>
<li><b>Redundância e inconsistência</b>: o mesmo dado repetido em vários arquivos pode divergir.</li>
<li><b>Dependência programa-dados</b>: a estrutura do arquivo fica “dentro” do programa; mudar o arquivo quebra o programa.</li>
<li>Dificuldade de acesso, de impor restrições de integridade, de controlar concorrência e de recuperar falhas.</li>
</ul>
<h3>Banco de dados + SGBD = Sistema de banco de dados</h3>
<p>Características da abordagem de BD: natureza <b>autodescritiva</b> (o catálogo descreve o próprio BD), <b>isolamento entre programas e dados</b> (abstração), <b>múltiplas visões</b> dos dados e <b>compartilhamento</b> com processamento de transações.</p>
<h3>Transações e ACID</h3>
<p>Transação = duas ou mais operações que devem ser executadas como uma unidade lógica, respeitando:</p>
<table class="tbl">
<tr><th>Propriedade</th><th>Significado</th><th>Exemplo</th></tr>
<tr><td><b>A</b>tomicidade</td><td>tudo ou nada</td><td>na transferência, débito e crédito ocorrem juntos ou nenhum ocorre</td></tr>
<tr><td><b>C</b>onsistência</td><td>leva o BD de um estado válido a outro válido (PK, FK, CHECK, gatilhos)</td><td>estoque nunca fica negativo</td></tr>
<tr><td><b>I</b>solamento</td><td>transações concorrentes não interferem entre si (níveis: read uncommitted, read committed, repeatable read, serializable)</td><td>dois saques simultâneos</td></tr>
<tr><td><b>D</b>urabilidade</td><td>depois do COMMIT, a mudança sobrevive a falhas</td><td>queda de energia após confirmar</td></tr></table>
<h3>Papéis no ambiente de BD</h3>
<ul>
<li><b>Administrador do SGBD</b>: instala e mantém o SGBD; privilégios mais altos; conhece bem o SO.</li>
<li><b>DBA</b> (administrador de banco de dados): cria e mantém os BDs, controla acesso e desempenho.</li>
<li><b>AD</b> (administrador de dados): responsável pelo ambiente de dados corporativo (políticas, padrões).</li>
<li><b>Usuários</b>: leigos (finais), avançados, programadores e analistas.</li>
<li><b>Bastidores</b>: projetistas/implementadores de SGBD, desenvolvedores de ferramentas, operadores e manutenção.</li>
</ul>
<h3>Linguagens</h3>
<ul>
<li><b>DDL</b> (Data Definition Language): define esquemas — <code>CREATE</code>, <code>ALTER</code>, <code>DROP</code>.</li>
<li><b>DML</b> (Data Manipulation Language): consulta e atualiza — <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>.</li>
<li><b>DCL</b>: controle de acesso — <code>GRANT</code>, <code>REVOKE</code>.</li>
</ul>
<h3>Histórico (Jim Gray, “Data Management: Past, Present and Future”)</h3>
<p>Processamento manual → cartões perfurados (Hollerith/IBM) → fitas magnéticas e processamento <i>batch</i> (COBOL) → discos, acesso online, SGBDs <b>hierárquicos e de rede</b>, surgimento da independência de dados e das transações → <b>SGBDs relacionais</b> (anos 80, cliente-servidor) → novos tipos de dados, OLAP, web, objeto-relacional, NoSQL/semiestruturados.</p>
`,
},
{
  id: 'arquitetura', num: 2, title: 'Arquitetura de um SGBD', foe: 'Arquitetura de BD',
  practice: ['1-2'],
  html: `
<h3>Arquitetura de três esquemas (ANSI/SPARC)</h3>
<table class="tbl">
<tr><th>Nível</th><th>Descreve</th></tr>
<tr><td><b>Externo</b> (visões)</td><td>apenas as partes do BD relevantes para cada grupo de usuários, escondendo o resto. Em SQL: <code>CREATE VIEW</code>.</td></tr>
<tr><td><b>Conceitual / lógico</b></td><td>a estrutura global do BD para toda a comunidade: entidades/tabelas, relacionamentos, restrições — <b>sem</b> detalhes físicos.</td></tr>
<tr><td><b>Interno</b></td><td>o armazenamento físico: arquivos, índices, caminhos de acesso, como os dados ocupam o disco.</td></tr></table>
<p>Entre os níveis existem <b>mapeamentos</b>: externo↔conceitual e conceitual↔interno. O SGBD transforma uma requisição feita sobre uma visão em requisição sobre o esquema conceitual e depois sobre o interno.</p>
<h3>Independência de dados</h3>
<p>É o “benefício supremo” da arquitetura: alterar um nível <b>inferior</b> sem precisar alterar o nível superior.</p>
<ul>
<li><b>Independência lógica</b>: mudar o esquema conceitual (ex.: acrescentar tabela ou coluna) sem afetar os esquemas externos/aplicações. É mais difícil de obter.</li>
<li><b>Independência física</b>: mudar o esquema interno (ex.: criar índice, reorganizar arquivos) sem alterar o esquema conceitual nem as aplicações.</li>
</ul>
<div class="callout"><p><b>Pegadinha clássica:</b> criar um índice para acelerar consultas → independência <b>física</b>. Adicionar uma coluna nova sem quebrar as visões existentes → independência <b>lógica</b>.</p></div>
<h3>Modelo × Esquema × Instância</h3>
<ul>
<li><b>Modelo de dados</b>: coleção de construtos (conceitos) para descrever dados e operações — geralmente com notação gráfica. Ex.: modelo ER, modelo relacional.</li>
<li><b>Esquema</b>: representação de uma porção específica da realidade usando um modelo; é a <b>descrição estática</b> (intensão). Muda raramente.</li>
<li><b>Instância (estado)</b>: os dados presentes no BD num dado instante (extensão). Muda a todo momento; deve obedecer ao esquema.</li>
</ul>
<h3>Tipos de modelos de dados</h3>
<ul>
<li><b>Conceitual</b> (alto nível): representa a realidade próximo de como o usuário a vê — ex.: modelo ER.</li>
<li><b>Lógico</b> (representacional/implementação): estruturas processáveis por computador — ex.: modelo relacional.</li>
<li><b>Físico</b>: estruturas de armazenamento e métodos de acesso.</li>
</ul>
<h3>Componentes típicos de um SGBD</h3>
<p>Catálogo (dicionário de dados), compilador DDL, processador/otimizador de consultas, compilador DML, gerente de transações (concorrência e recuperação), gerente de armazenamento/buffer e interfaces para os diferentes usuários.</p>
`,
},
{
  id: 'modelagem', num: 3, title: 'Modelagem conceitual e lógica', foe: 'Modelagem conceitual e lógica',
  practice: ['1-3'],
  html: `
<h3>Projeto de banco de dados</h3>
<p>Mundo real → <b>coleta e análise de requisitos</b> → <b>projeto conceitual</b> (esquema conceitual, independente de SGBD) → <b>projeto lógico</b> (esquema lógico, ex.: relacional) → <b>projeto físico</b> (esquema interno, dependente do SGBD).</p>
<p>No início focamos na realidade <b>sem</b> considerar implementação, desempenho, transações, segurança etc.</p>
<h3>Mecanismos de abstração</h3>
<ul>
<li><b>Classificação</b>: define uma classe a partir de objetos com propriedades comuns (relação “é membro de”). Ex.: a bicicleta vermelha da Bia é membro de BICICLETA. → <i>entidades</i>.</li>
<li><b>Agregação</b>: define uma nova classe a partir de classes componentes (relação “é parte de”). → <i>atributos</i> (propriedades de uma classe) e <i>relacionamentos</i>.</li>
<li><b>Generalização</b>: define uma classe genérica a partir das semelhanças de outras (relação “é um”). → <i>especialização</i>.</li>
</ul>
<p><b>Classe</b> = conjunto de objetos descritos pelas mesmas propriedades; <b>tipo</b> = o conjunto de propriedades que descreve os objetos; <b>instância</b> = cada objeto. A mesma classe pode ser descrita por tipos diferentes (Empregado com matrícula/nome/endereço ou CPF/nome/telefone/lotação).</p>
<h3>Questões de identidade (Kent, “Data and Reality”)</h3>
<p>“O que é <i>uma</i> coisa?” — uma peça é o objeto físico (com nº de série) ou o tipo de peça do estoque? Um livro é o título ou o exemplar emprestado? Decidir isso define as entidades: frequentemente o sistema precisa das <b>duas</b> noções (TÍTULO e EXEMPLAR).</p>
<h3>Estratégias (diretrizes de modelagem)</h3>
<ul>
<li><b>Top-down</b>: começa pelos conceitos mais abstratos e refina; atributos e cardinalidades ficam para o final.</li>
<li><b>Bottom-up</b>: parte dos conceitos atômicos e agrega/generaliza no fim (integração mais difícil).</li>
<li><b>Inside-out</b>: caso especial do bottom-up — começa pelo núcleo do negócio e expande para a periferia.</li>
<li><b>Mista</b>: particiona os requisitos, cria um esquema-esqueleto abstrato e integra os sub-esquemas.</li>
</ul>
<h3>Identificando entidades (critérios de Shlaer &amp; Mellor)</h3>
<p>Coisas <b>tangíveis</b> (avião, peça) • <b>papéis/funções</b> (autor, gerente) • <b>eventos/ocorrências</b> (festa, consulta, acidente) • <b>interações</b> (compra de imóvel envolve comprador, imóvel, corretor…) • <b>especificações</b> (modelo de refrigerador × refrigerador individual).</p>
<h3>Escolhendo construtos</h3>
<table class="tbl">
<tr><th>Dúvida</th><th>Regra</th></tr>
<tr><td>Entidade ou atributo?</td><td><b>Entidade</b> se tem atributos próprios ou se relaciona com outras entidades; <b>atributo</b> se é propriedade simples e atômica (cor, código).</td></tr>
<tr><td>Especialização ou atributo?</td><td><b>Especialização</b> se o subgrupo tem atributos próprios ou participa de relacionamentos exclusivos (ex.: aluno de pós é orientado por professor).</td></tr>
<tr><td>Relacionamento ternário ou binários?</td><td><b>Ternário</b> se o fato só faz sentido com as três entidades ao mesmo tempo (“quem fornece qual peça para qual cliente”).</td></tr></table>
<h3>Dicionário de dados</h3>
<p>Definição formal de cada elemento (entidade, atributo, relacionamento): definição, regras e exceções, exemplos, correlações. Nada é “óbvio”.</p>
`,
},
{
  id: 'er', num: 4, title: 'Modelo Entidade-Relacionamento', foe: 'Modelo ER',
  practice: ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8'],
  html: `
<p>Proposto por <b>Peter Chen</b> (1976). Construtos básicos: <b>entidade</b> (retângulo), <b>relacionamento</b> (losango) e <b>atributo</b>. Usaremos a notação do <b>brModelo</b> (Heuser): atributos como “pirulitos” — ○ atributo comum, ● identificador.</p>
<div data-fig="lotacao" data-cap="Um empregado é lotado em exatamente 1 departamento; um departamento tem de 1 a n empregados."></div>
<h3>Cardinalidade (mínima, máxima) — <u>a posição que usamos</u></h3>
<div class="callout"><p>A literatura diverge. <b>Em aula usamos Heuser/Chen (igual ao brModelo)</b>: o par escrito <b>junto à entidade X</b> responde “<i>um(a) elemento da OUTRA entidade se associa a quantos X?</i>”.</p>
<p>Na figura: junto a DEPARTAMENTO está <code>(1,1)</code> → <i>um empregado está lotado em no mínimo 1 e no máximo 1 departamento</i>. Junto a EMPREGADO está <code>(1,n)</code> → <i>um departamento tem de 1 a n empregados</i>.</p>
<p>(Elmasri/Navathe e Ceri usam a posição inversa — cuidado ao ler livros!)</p></div>
<ul>
<li><b>Mínima</b> = participação: 0 = opcional, 1 = obrigatória.</li>
<li><b>Máxima</b>: 1 ou n. Combinando as máximas: <b>1:1</b>, <b>1:n</b>, <b>n:m</b>.</li>
<li>Notação só com máximas (1, n, m) perde a informação da mínima.</li>
</ul>
<h3>Grau do relacionamento</h3>
<p>Número de entidades participantes: <b>binário</b> (2), <b>ternário</b> (3), n-ário. Relacionamento pode ter <b>atributos</b> — quando o dado depende da associação (ex.: data do favorito, horas trabalhadas).</p>
<div data-fig="favorita" data-cap="n:m com atributo no relacionamento."></div>
<div data-fig="umum" data-cap="1:1 — cada paciente tem uma carteira e cada carteira é de um paciente."></div>
<h3>Relacionamento ternário</h3>
<p><b>Regra de ouro:</b> se remover uma das três entidades o fato perde o sentido, é ternário. Ex.: SESSÃO = (FILME, HORA, SALA). Trocar um ternário por três binários gera <b>armadilha de conexão</b>: sabemos quem fornece que peça e quem fornece a que cliente, mas não <i>quem fornece qual peça a qual cliente</i>.</p>
<div data-fig="ternario" data-cap="Ternário: médico prescreve medicamento a paciente (atributos dataHora, dosagem)."></div>
<p><b>Leitura da cardinalidade no ternário</b> (Heuser): fixa-se o <b>par</b> das outras duas entidades e pergunta-se quantas ocorrências da terceira: “um médico atendendo um paciente pode prescrever quantos medicamentos?” → n. Por isso a cardinalidade junto a MEDICAMENTO é (0,n). Uma máxima 1 num ternário expressa exclusividade (ex.: cada par (cidade, produto) tem <b>um</b> distribuidor).</p>
<h3>Auto-relacionamento (recursivo)</h3>
<p>Uma entidade se relaciona com ela mesma, em <b>papéis</b> diferentes (chefe/subordinado, composto/componente).</p>
<div data-fig="auto" data-cap="Cada empregado tem no máximo 1 chefe (0,1); um chefe tem 0..n subordinados."></div>
<h3>Atributos</h3>
<ul>
<li><b>Simples</b> × <b>composto</b> (endereço = rua, número, cidade).</li>
<li><b>Monovalorado</b> × <b>multivalorado</b> (telefone (0,n)). Cardinalidade do atributo: (0,1) opcional, (1,1) obrigatório (padrão, não se escreve), (0,n)/(1,n) multivalorado.</li>
<li><b>Domínio</b>: conjunto de valores válidos (CPF numérico, cor ∈ {azul, amarelo}).</li>
<li><b>Derivado</b>: calculável a partir de outros (idade, total de empregados) — normalmente é <b>redundância</b> e não deve ser modelado.</li>
</ul>
<h3>Identificador</h3>
<p>Atributo(s) que identifica(m) unicamente cada instância: sem duplicatas, <b>mínimo</b> (tirar uma parte quebra a unicidade) e <b>obrigatório</b>. Pode ser <b>interno simples</b> (CPF), <b>interno composto</b> (nome + data de nascimento + nome do pai) ou <b>externo/misto</b> (inclui o identificador de outra entidade).</p>
<div class="callout warn"><p><b>Regra sintática:</b> toda entidade tem (ou herda, se for especialização) um identificador.</p></div>
<h3>Entidade fraca</h3>
<p>Entidade cujo identificador é <b>externo ou misto</b>: depende de outra para existir e ser identificada. Ex.: DEPENDENTE é identificado pela matrícula do EMPREGADO + nome do dependente. O relacionamento é <b>identificador</b> e a fraca tem participação (1,1) nele (do lado da forte).</p>
<div data-fig="fraca" data-cap="DEPENDENTE (fraca): um dependente pertence a exatamente 1 empregado; o ● em nome é identificador parcial."></div>
<h3>Generalização / especialização</h3>
<p>As propriedades da genérica são <b>herdadas</b> pelas específicas (atributos, relacionamentos, identificador). Propriedades comuns ficam só na genérica; específicas só na específica — colocar na filha um atributo comum a todas é <b>erro</b>.</p>
<p><b>Cobertura</b>: <b>total</b> (t) — toda instância da genérica está em alguma específica; <b>parcial</b> (p) — pode haver instâncias só da genérica. <b>Exclusiva</b> (e) — no máximo uma específica; <b>inclusiva/sobreposta</b> (i) — pode estar em várias. Notação: (t,e), (p,e), (t,i), (p,i).</p>
<div data-fig="spec" data-cap="PESSOA (t,e) em ALUNO e PROFESSOR. telefone é multivalorado e endereço é composto."></div>
<h3>Agregação (entidade associativa)</h3>
<p>Transforma um relacionamento em “entidade” para que ele participe de outro relacionamento. É uma forma de representar um ternário com binários: a participação <b>(1,1)</b> da agregação no novo relacionamento garante que a associação não exista sem o terceiro elemento.</p>
<div data-fig="agregacao" data-cap="demanda (cidade, produto) é atendida por exatamente 1 distribuidor."></div>
<h3>Verificação do esquema</h3>
<table class="tbl">
<tr><th>Critério</th><th>O que olhar</th></tr>
<tr><td><b>Correção sintática</b></td><td>respeitar as regras do ER: nada de ligar entidade direto com entidade ou relacionamento com relacionamento; toda entidade com identificador; atributo comum na genérica.</td></tr>
<tr><td><b>Correção semântica</b></td><td>não contradizer o minimundo: cardinalidade errada, atributo na entidade errada, entidade modelada como atributo, fundir dois relacionamentos distintos (“mora em” × “nasceu em”).</td></tr>
<tr><td><b>Completude</b></td><td>o esquema responde às consultas e atualizações necessárias?</td></tr>
<tr><td><b>Redundância</b></td><td>relacionamentos obtidos pela composição de outros; atributos deriváveis (tot-emp, código do depto repetido no empregado).</td></tr>
<tr><td><b>Aspecto temporal</b></td><td>precisa de histórico? Relacionamentos 1:1 ou 1:n que mudam no tempo viram n:m com atributo de data.</td></tr></table>
<p>Outros sinais de alerta: entidades isoladas, entidades sem atributos, n-ários esquecidos, restrições que o ER não expressa.</p>
`,
},
{
  id: 'relacional', num: 5, title: 'Modelo relacional', foe: 'Modelo Relacional',
  practice: ['3-1'],
  html: `
<p>Proposto por <b>E. F. Codd</b> (1970). O BD é um conjunto de <b>relações</b> (tabelas).</p>
<table class="tbl">
<tr><th>Termo formal</th><th>Informal</th><th>Definição</th></tr>
<tr><td>Relação</td><td>tabela</td><td>conjunto de tuplas; subconjunto do produto cartesiano dos domínios</td></tr>
<tr><td>Tupla</td><td>linha</td><td>lista ordenada de valores &lt;v1,…,vn&gt;, cada vi ∈ dom(Ai) ou nulo</td></tr>
<tr><td>Atributo</td><td>coluna</td><td>nome de um papel desempenhado por um domínio</td></tr>
<tr><td>Domínio</td><td>tipo</td><td>conjunto de valores atômicos (descrição física + semântica)</td></tr>
<tr><td>Grau</td><td>nº de colunas</td><td>aridade n do esquema R(A1,…,An)</td></tr>
<tr><td>Cardinalidade</td><td>nº de linhas</td><td>número de tuplas da instância r(R)</td></tr></table>
<p><b>Esquema de relação</b> R(A1, A2, …, An) = nome + atributos (+domínios). <b>Instância</b> r(R) = conjunto de tuplas num instante. Esquema do BD = conjunto de esquemas de relação + restrições de integridade.</p>
<h3>Características</h3>
<ul>
<li>Tuplas <b>não têm ordem</b> (relação é conjunto) e <b>não há tuplas repetidas</b>.</li>
<li>Valores <b>atômicos</b> (1FN): nada de atributo multivalorado ou composto dentro de uma célula.</li>
<li><b>NULL</b> representa valor desconhecido, inexistente ou não aplicável. Ex.: “Quantos CDs o Rob tem?” — 0 é uma resposta; NULL significa que não sabemos.</li>
</ul>
<h3>Chaves</h3>
<ul>
<li><b>Superchave</b>: conjunto de atributos cujo valor não se repete em duas tuplas.</li>
<li><b>Chave (candidata)</b>: superchave <b>mínima</b> (retirar qualquer atributo quebra a unicidade).</li>
<li><b>Chave primária (PK)</b>: a candidata escolhida (sublinhada). As outras são <b>chaves alternativas</b> (UNIQUE).</li>
<li><b>Chave estrangeira (FK)</b>: atributo(s) de R1 que referencia(m) a PK de R2; valor deve existir em R2 ou ser nulo.</li>
<li><b>Natural</b> (CPF, matrícula) × <b>artificial/surrogate</b> (id gerado: SERIAL, IDENTITY, SEQUENCE, UUID). Se usar surrogate, declare a natural como <b>chave candidata</b>.</li>
</ul>
<h3>Restrições de integridade</h3>
<table class="tbl">
<tr><th>Restrição</th><th>Regra</th><th>Em SQL</th></tr>
<tr><td>de domínio</td><td>valor pertence ao domínio do atributo</td><td>tipo, CHECK, DOMAIN</td></tr>
<tr><td>de chave</td><td>não há duas tuplas com o mesmo valor de chave</td><td>PRIMARY KEY, UNIQUE</td></tr>
<tr><td>de entidade</td><td><b>PK nunca é nula</b></td><td>PRIMARY KEY implica NOT NULL</td></tr>
<tr><td>referencial</td><td>FK é nula ou existe na tabela referenciada</td><td>FOREIGN KEY … REFERENCES</td></tr>
<tr><td>semântica</td><td>regras de negócio (salário ≤ do chefe)</td><td>CHECK, ASSERTION, <b>TRIGGER</b></td></tr></table>
<p>Operações que podem violar restrições: <b>INSERT</b> (domínio, chave, entidade, referencial), <b>DELETE</b> (referencial: o que fazer com quem aponta para a tupla? RESTRICT, CASCADE, SET NULL, SET DEFAULT), <b>UPDATE</b> (todas).</p>
<h3>Notação resumida (Heuser) — usada nas respostas</h3>
<pre>DEPARTAMENTO (#sigla, nome, matGerente)
  matGerente referencia EMPREGADO
  nome é chave candidata
EMPREGADO (#matricula, nome, salario, sigla)
  sigla referencia DEPARTAMENTO</pre>
<p>No papel, a PK é <u>sublinhada</u>; aqui no site usamos <code>#</code>. FK composta: <code>(a, b) referencia T</code>. Indique também chaves candidatas, atributos opcionais (admitem nulo) e domínios quando relevante.</p>
<p>SGBD <b>aderente ao modelo relacional</b> = oferece os construtos desse modelo (relações, chaves, restrições). O PostgreSQL é aderente (e objeto-relacional).</p>
`,
},
{
  id: 'mapeamento', num: 6, title: 'Mapeamento ER → relacional', foe: 'Mapeamento ER-Relacional',
  practice: ['3-2', '3-3', '3-4', '3-5', '3-6'],
  html: `
<p>Diferentes esquemas relacionais podem ser gerados a partir do mesmo ER; refinamentos dependem do conhecimento da aplicação (consultas críticas, desempenho). Metodologia (Heuser / Batini-Ceri-Navathe):</p>
<ol>
<li>Eliminar <b>identificadores externos</b> (importar a chave da entidade forte).</li>
<li>Eliminar <b>atributos compostos e multivalorados</b>.</li>
<li>Traduzir cada <b>entidade</b> em uma relação.</li>
<li>Traduzir cada <b>relacionamento</b> conforme as cardinalidades.</li>
<li>Traduzir <b>generalizações/especializações</b>.</li>
</ol>
<h3>Regras — tabela de bolso</h3>
<table class="tbl">
<tr><th>Construto</th><th>Tradução</th></tr>
<tr><td>Entidade</td><td>Tabela com seus atributos simples; identificador → PK.</td></tr>
<tr><td>Atributo composto</td><td>Elimina o nível intermediário: endereço{rua, cep} → colunas <code>rua, cep</code>.</td></tr>
<tr><td>Atributo multivalorado</td><td>Nova tabela: <code>PRODUTO_COR (#codProduto, #cor)</code>, codProduto referencia PRODUTO.</td></tr>
<tr><td>Entidade fraca</td><td>Tabela com PK = PK da forte + identificador parcial; FK para a forte.</td></tr>
<tr><td><b>1:n</b></td><td>A PK do lado “1” vira <b>FK no lado “n”</b> (a entidade de máxima 1 absorve o relacionamento, com os atributos dele). Se a participação do lado n for opcional e se quiser evitar nulos: tabela própria para o relacionamento (PK = PK do lado n).</td></tr>
<tr><td><b>1:1</b></td><td>(1,1)–(1,1): pode <b>fundir</b> as duas numa tabela. Um lado opcional: FK na entidade cuja participação é <b>obrigatória</b> (toda ocorrência dela tem par — ex.: todo cartão tem cliente, mas nem todo cliente tem cartão → FK <code>codCliente</code> em CARTÃO, declarada <b>UNIQUE</b>, sem nulos). (0,1)–(0,1): tabela própria para o relacionamento ou FK opcional + UNIQUE.</td></tr>
<tr><td><b>n:m</b></td><td>Sempre <b>tabela própria</b>: PK = PKs das duas entidades (cada uma também FK) + atributos do relacionamento. Independe das mínimas.</td></tr>
<tr><td>n-ário</td><td>Tabela própria com as PKs de todas (FKs). PK = todas, exceto quando há máxima 1: aí a PK é formada pelas outras (ex.: par peça-projeto com fornecedor único → PK = (peça, projeto)).</td></tr>
<tr><td>Auto-relacionamento</td><td>1:n: FK para a própria tabela (<code>matSupervisor referencia EMPREGADO</code>, admite nulo). n:m: tabela com duas FKs para a mesma tabela (papéis).</td></tr>
<tr><td>Especialização</td><td><b>Distribuição</b>: tabela para a genérica + uma por específica, com a mesma PK (que também é FK para a genérica); manter coluna <code>tipo</code> na genérica. <b>Fusão</b>: uma tabela só com todos os atributos (das filhas como opcionais) + coluna <code>tipo</code> — gera nulos e perde restrições.</td></tr></table>
<h3>Exemplo completo</h3>
<pre>CIDADE (#nomeCidade, #nomeEstado, populacao)        -- 1:n absorvido no lado n
  nomeEstado referencia ESTADO
ESTUDANTE (#numEstudante, nome)
CURSO (#numCurso, nome)
MATRICULA (#numEstudante, #numCurso, semestre, grau)  -- n:m
  numEstudante referencia ESTUDANTE
  numCurso referencia CURSO
EMPREGADO (#regEmp, nome, dataNasc, regCoordenador)  -- auto 1:n
  regCoordenador referencia EMPREGADO
HOMEM (#homCpf, nome)
MULHER (#mlhCpf, nome)
CASAMENTO (#homCpf, mlhCpf, data, regime)            -- 1:1 (0,1)-(0,1)
  homCpf referencia HOMEM
  mlhCpf referencia MULHER
  mlhCpf é chave candidata</pre>
<div class="callout"><p><b>Como pensar no 1:n:</b> pergunte “qual lado tem máxima 1 para cada ocorrência do outro?”. No exemplo EMPREGADO (1,n)—lotação—(1,1) DEPARTAMENTO, cada empregado se associa a no máximo 1 departamento → a FK vai em EMPREGADO.</p></div>
<h3>Nomes</h3>
<p>Nomes simples e curtos (<code>dataNasc</code>); não repita o nome da tabela, exceto em campos de chave (<code>codEmp</code>). Evite acentos e espaços.</p>
`,
},
{
  id: 'algebra', num: 7, title: 'Álgebra relacional', foe: 'Álgebra Relacional',
  practice: ['4-1', '4-2', '4-3', '4-4', '4-5', '4-6', '4-7', '4-8', '4-9', '4-10', '4-11'],
  html: `
<p>Linguagem de consulta <b>procedural</b>: o usuário indica a sequência de operações. As operações recebem relações e devolvem relações (fechamento), e o resultado é sempre um <b>conjunto</b> (sem duplicatas).</p>
<table class="tbl">
<tr><th>Operação</th><th>No papel</th><th>Como digitar aqui</th><th>Resultado</th></tr>
<tr><td>Seleção</td><td>σ<sub>cond</sub>(R)</td><td><code>σ[cond](R)</code></td><td>tuplas de R que satisfazem cond (filtra <b>linhas</b>). Use ∧ ∨ ¬ e = ≠ &lt; &gt; ≤ ≥.</td></tr>
<tr><td>Projeção</td><td>π<sub>a, b</sub>(R)</td><td><code>π[a, b](R)</code></td><td>apenas as colunas a, b — <b>elimina duplicatas</b>.</td></tr>
<tr><td>União</td><td>R ∪ S</td><td><code>R ∪ S</code></td><td>tuplas de R ou de S</td></tr>
<tr><td>Diferença</td><td>R − S</td><td><code>R − S</code></td><td>tuplas de R que não estão em S</td></tr>
<tr><td>Produto cartesiano</td><td>R × S</td><td><code>R × S</code></td><td>todas as combinações (grau = soma, cardinalidade = produto)</td></tr>
<tr><td>Renomeação</td><td>ρ<sub>X</sub>(R), ρ<sub>X(a,b)</sub>(R), ρ<sub>novo←velho</sub>(R)</td><td><code>ρ[X](R)</code>, <code>ρ[X(a, b)](R)</code>, <code>ρ[novo ← velho](R)</code></td><td>muda nome da relação e/ou atributos (essencial na auto-junção)</td></tr>
<tr><td>Interseção</td><td>R ∩ S</td><td><code>R ∩ S</code></td><td>tuplas em ambas = R − (R − S)</td></tr>
<tr><td>Junção θ</td><td>R ⋈<sub>cond</sub> S</td><td><code>R ⋈[cond] S</code></td><td>σ<sub>cond</sub>(R × S). Equi-junção: só igualdades.</td></tr>
<tr><td>Junção natural</td><td>R ⋈ S</td><td><code>R ⋈ S</code></td><td>igualdade nos atributos de <b>mesmo nome</b>, que aparecem uma vez só</td></tr>
<tr><td>Divisão</td><td>R ÷ S</td><td><code>R ÷ S</code></td><td>valores x tais que (x, y) ∈ R <b>para todo</b> y ∈ S — consultas “todos”</td></tr>
<tr><td>Junção externa</td><td>R ⟕<sub>cond</sub> S</td><td><code>R ⟕[cond] S</code> (também ⟖ ⟗)</td><td>mantém tuplas sem par (esquerda, direita, ambas) com nulos</td></tr>
<tr><td>Agregação</td><td><sub>g</sub>ℑ<sub>COUNT(x)</sub>(R)</td><td><code>g ℑ[COUNT(x) → n](R)</code></td><td>agrupa por g e calcula funções (COUNT, SUM, AVG, MIN, MAX)</td></tr>
<tr><td>Atribuição</td><td>T ← expr</td><td><code>T ← expr</code> (uma por linha)</td><td>guarda resultado intermediário</td></tr></table>
<div class="callout"><p><b>Regra da digitação:</b> o que no papel fica <b>embaixo do símbolo</b> (o subscrito) vai entre <b>colchetes</b>; a relação de entrada vai entre <b>parênteses</b>. Enquanto você digita, o editor mostra a expressão “no papel”, com subscritos.</p></div>
<p><b>Compatibilidade de união</b>: ∪, ∩ e − exigem o mesmo número de atributos com domínios compatíveis.</p>
<p><b>Operações fundamentais</b>: σ, π, ∪, −, × (e ρ). As demais são derivadas:</p>
<p>R ∩ S = R − (R − S)<br>R ⋈<sub>θ</sub> S = σ<sub>θ</sub>(R × S)<br>R ÷ S = π<sub>X</sub>(R) − π<sub>X</sub>((π<sub>X</sub>(R) × S) − R), em que X = atributos de R que não estão em S</p>
<h3>Exemplos (empresa do caderno de exercícios)</h3>
<pre>-- empregados do depto 4 com salário > 25000 ou do depto 5 com salário > 30000
σ[(dnum = 4 ∧ salario > 25000) ∨ (dnum = 5 ∧ salario > 30000)](EMPREGADO)

-- nome dos departamentos e de seus gerentes
π[dnome, pnome, snome](DEPARTAMENTO ⋈[matger = mat] EMPREGADO)

-- empregadas e seus dependentes (produto + seleção)
F ← π[mat, pnome, snome](σ[sexo = 'F'](EMPREGADO))
π[pnome, snome, depnome](σ[mat = emat](F × DEPENDENTE))

-- número de empregados e média salarial por departamento
dnum ℑ[COUNT(*) → qtd, AVG(salario) → media](EMPREGADO)

-- quem trabalha em TODOS os projetos em que João Rocha trabalha (divisão)
JP ← π[pnum](TRABALHA_EM ⋈ σ[pnome = 'João' ∧ snome = 'Rocha'](EMPREGADO))
π[pnome, snome]((π[mat, pnum](TRABALHA_EM) ÷ JP) ⋈ EMPREGADO)</pre>
<div class="callout"><p><b>Dicas:</b> filtre cedo (σ antes da junção), projete só o necessário antes de ∪/−, e use <b>−</b> para “não”/“nenhum” e <b>÷</b> para “todos”. Na junção natural cuidado com atributos homônimos que você <i>não</i> quer igualar — projete ou renomeie antes.</p></div>
<p>Aqui no site a álgebra é traduzida para SQL e executada no PostgreSQL. Além dos símbolos, o editor aceita palavras (sigma, pi, rho, join, union, minus, divide, and, or, not), <code>&lt;=</code> <code>&gt;=</code> <code>&lt;&gt;</code> e a forma antiga sem colchetes.</p>
`,
},
{
  id: 'ddl', num: 8, title: 'SQL — DDL e visões', foe: 'SQL DDL',
  practice: ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6'],
  html: `
<h3>Esquemas e tabelas</h3>
<pre>CREATE SCHEMA empresa;

CREATE TABLE empresa.departamento (
  sigla     CHAR(5)     PRIMARY KEY,
  nome      VARCHAR(30) NOT NULL UNIQUE,
  matGerente CHAR(9)
);

CREATE TABLE empresa.empregado (
  matricula CHAR(9)       NOT NULL,
  nome      VARCHAR(30)   NOT NULL,
  salario   NUMERIC(10,2) CHECK (salario &gt; 0),
  sexo      CHAR(1)       CHECK (sexo IN ('M','F')),
  depto     CHAR(5)       NOT NULL DEFAULT 'DG',
  supermat  CHAR(9),
  CONSTRAINT pk_emp PRIMARY KEY (matricula),
  CONSTRAINT fk_emp_depto FOREIGN KEY (depto) REFERENCES empresa.departamento (sigla)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_emp_super FOREIGN KEY (supermat) REFERENCES empresa.empregado (matricula)
      ON DELETE SET NULL
);

-- FK circular: cria depois que as duas tabelas existem
ALTER TABLE empresa.departamento ADD CONSTRAINT fk_dep_ger
  FOREIGN KEY (matGerente) REFERENCES empresa.empregado (matricula);</pre>
<h3>Tipos mais comuns</h3>
<p><code>CHAR(n)</code>, <code>VARCHAR(n)</code>, <code>TEXT</code>, <code>INTEGER</code>/<code>INT</code>, <code>SMALLINT</code>, <code>BIGINT</code>, <code>NUMERIC(p,s)</code>/<code>DECIMAL</code>, <code>REAL</code>, <code>BOOLEAN</code>, <code>DATE</code>, <code>TIME</code>, <code>TIMESTAMP [WITHOUT TIME ZONE]</code>, <code>INTERVAL</code>.</p>
<h3>Restrições</h3>
<table class="tbl">
<tr><th>Restrição</th><th>Coluna</th><th>Tabela (pode ser composta)</th></tr>
<tr><td>NOT NULL</td><td><code>nome VARCHAR(30) NOT NULL</code></td><td>—</td></tr>
<tr><td>DEFAULT</td><td><code>depto CHAR(5) DEFAULT 'DG'</code></td><td>—</td></tr>
<tr><td>PRIMARY KEY</td><td><code>id INT PRIMARY KEY</code></td><td><code>PRIMARY KEY (empmat, pcodigo)</code></td></tr>
<tr><td>UNIQUE</td><td><code>cpf CHAR(11) UNIQUE</code></td><td><code>UNIQUE (nome, data)</code></td></tr>
<tr><td>CHECK</td><td><code>CHECK (horas &gt;= 0)</code></td><td><code>CHECK (inicio &lt; fim)</code></td></tr>
<tr><td>FOREIGN KEY</td><td><code>depto CHAR(5) REFERENCES departamento</code></td><td><code>FOREIGN KEY (a,b) REFERENCES t (x,y)</code></td></tr></table>
<p><b>Ações referenciais</b> (<code>ON DELETE</code> / <code>ON UPDATE</code>): <code>NO ACTION</code> (padrão), <code>RESTRICT</code>, <code>CASCADE</code> (propaga), <code>SET NULL</code>, <code>SET DEFAULT</code>.</p>
<p><code>CREATE DOMAIN sigla_t AS CHAR(5) CHECK (VALUE = UPPER(VALUE));</code> cria um tipo com restrição reutilizável. <code>CREATE ASSERTION</code> (padrão SQL, não implementado no PostgreSQL) — no Postgres usa-se trigger.</p>
<h3>Alterando e removendo</h3>
<pre>ALTER TABLE dependente ADD COLUMN parentesco CHAR(10) DEFAULT 'filho';
ALTER TABLE dependente DROP COLUMN auxiliocreche;
ALTER TABLE dependente ALTER COLUMN parentesco SET DEFAULT 'filho(a)';
ALTER TABLE dependente ALTER COLUMN auxiliocreche TYPE NUMERIC(10,2);
ALTER TABLE dependente RENAME COLUMN empmat TO matricula;
ALTER TABLE empregado ADD CONSTRAINT ck_sal CHECK (salario &gt; 0);
ALTER TABLE empregado DROP CONSTRAINT ck_sal;
DROP TABLE dependente;            -- RESTRICT é o padrão
DROP TABLE departamento CASCADE;  -- remove também o que depende dela</pre>
<h3>Sequências e IDENTITY (chaves artificiais)</h3>
<pre>CREATE SEQUENCE partseq START WITH 1 INCREMENT BY 1 MAXVALUE 10000;
INSERT INTO peca VALUES (nextval('partseq'), 'parafuso');

CREATE TABLE peca (
  partnum INTEGER GENERATED ALWAYS AS IDENTITY,  -- ou GENERATED BY DEFAULT
  descr   VARCHAR(30)
);
-- PostgreSQL também tem SERIAL (atalho para sequência + default)</pre>
<p><code>GENERATED ALWAYS</code>: o SGBD sempre gera (inserir valor manual dá erro). <code>BY DEFAULT</code>: gera só se você não informar.</p>
<h3>Visões (nível externo)</h3>
<pre>CREATE VIEW emp_projetos AS
  SELECT e.nome, e.snome, p.pnome
  FROM empregado e JOIN trabalha_em t ON e.matricula = t.empmat
                   JOIN projeto p ON p.pcodigo = t.pcodigo;

CREATE VIEW empregado_des AS
  SELECT * FROM empregado WHERE depto = 'DES'
  WITH CHECK OPTION;   -- impede INSERT/UPDATE que "sumam" da visão

DROP VIEW emp_projetos;</pre>
<ul>
<li>Visão é uma <b>tabela virtual</b>: guarda a consulta, não os dados; reflete sempre o estado atual. Dá independência lógica e segurança.</li>
<li><b>Atualizável</b> (em geral) se: uma única tabela base, sem DISTINCT, GROUP BY, agregação, UNION; contém as colunas NOT NULL sem default. Visões com junção/agregação precisam de trigger <code>INSTEAD OF</code>.</li>
<li><b>Materializada</b> (<code>CREATE MATERIALIZED VIEW … WITH [NO] DATA</code>): guarda o resultado fisicamente; atualizada com <code>REFRESH MATERIALIZED VIEW</code>.</li>
</ul>
<h3>WITHOUT (guia da disciplina)</h3>
<p><code>TIMESTAMP WITHOUT TIME ZONE</code> (guarda o valor literal, sem fuso) • cursor <code>WITHOUT HOLD</code> (fecha ao fim da transação — padrão) • <code>WITH NO DATA</code> (cria estrutura sem popular) • <code>WITHOUT OIDS</code> (legado: sem OID oculto por linha) • visão sem <code>WITH CHECK OPTION</code> permite inserir linhas que não aparecem na visão.</p>
`,
},
{
  id: 'dml', num: 9, title: 'SQL — consultas e DML', foe: 'SQL DML',
  practice: ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6', '6-7', '6-8', '6-9', '6-10', '6-11', '6-12', '6-13', '6-14', '6-15', '6-16', '6-17', '6-18', 'C-1', 'C-5', 'C-7', 'C-10'],
  html: `
<h3>Estrutura e ordem lógica de execução</h3>
<pre>SELECT [DISTINCT] colunas, agregações      -- 5
FROM tabelas / junções                     -- 1
WHERE condição sobre linhas                -- 2
GROUP BY colunas                           -- 3
HAVING condição sobre grupos               -- 4
ORDER BY colunas [ASC|DESC]                -- 6
LIMIT n;</pre>
<p>SQL é baseada na álgebra (σ ≈ WHERE, π ≈ SELECT, ⋈ ≈ JOIN), mas trabalha com <b>multiconjuntos</b>: duplicatas só somem com <code>DISTINCT</code>.</p>
<h3>Filtros</h3>
<pre>WHERE salario BETWEEN 1000 AND 2000
  AND nome LIKE 'J%'            -- % qualquer sequência, _ um caractere
  AND depto IN ('DES', 'PROD')
  AND supermat IS NULL          -- nunca "= NULL"!</pre>
<h3>Agregação</h3>
<pre>SELECT depto, COUNT(*) AS qtd, AVG(salario) AS media, MAX(salario)
FROM empregado
GROUP BY depto
HAVING AVG(salario) &gt; 1200    -- filtra grupos (WHERE não aceita agregação)
ORDER BY media DESC;</pre>
<p>Toda coluna no SELECT que não está numa função de agregação precisa estar no GROUP BY. <code>COUNT(*)</code> conta linhas; <code>COUNT(col)</code> ignora nulos; <code>COUNT(DISTINCT col)</code>.</p>
<h3>Junções</h3>
<table class="tbl">
<tr><th>Tipo</th><th>Sintaxe</th><th>Resultado</th></tr>
<tr><td>Interna implícita</td><td><code>FROM a, b WHERE a.x = b.y</code></td><td>só pares que casam</td></tr>
<tr><td>INNER JOIN</td><td><code>a JOIN b ON a.x = b.y</code> / <code>USING (col)</code></td><td>só pares que casam</td></tr>
<tr><td>LEFT [OUTER] JOIN</td><td><code>a LEFT JOIN b ON …</code></td><td>todas de a; b nulo se não houver par</td></tr>
<tr><td>RIGHT JOIN</td><td><code>a RIGHT JOIN b ON …</code></td><td>todas de b</td></tr>
<tr><td>FULL JOIN</td><td><code>a FULL JOIN b ON …</code></td><td>todas de ambas</td></tr>
<tr><td>Auto-junção</td><td><code>empregado e JOIN empregado s ON e.supermat = s.matricula</code></td><td>exige apelidos</td></tr>
<tr><td>CROSS JOIN</td><td><code>a CROSS JOIN b</code></td><td>produto cartesiano</td></tr></table>
<p><b>Anti-junção</b> (“quem não tem”): <code>a LEFT JOIN b ON … WHERE b.chave IS NULL</code> ou <code>NOT EXISTS</code>.</p>
<h3>Subconsultas</h3>
<ul>
<li><b>Não correlacionada</b>: a interna roda uma vez, primeiro (de dentro para fora).</li>
<li><b>Correlacionada</b>: a interna usa colunas da externa e é avaliada para cada linha externa (de fora para dentro).</li>
<li><code>IN</code> compara com uma lista; <code>EXISTS</code> só testa se há linha (para no primeiro achado).</li>
<li><code>&gt; ALL (subq)</code> maior que todos; <code>&gt; ANY (subq)</code> maior que algum. Cuidado com NULL em <code>NOT IN</code> / <code>&lt;&gt; ALL</code>: se a subconsulta tiver nulo, nada é retornado.</li>
<li>Subconsulta no <code>HAVING</code>: <code>HAVING AVG(salario) &gt; (SELECT AVG(salario) FROM empregado)</code>.</li>
<li>Subconsulta no <code>FROM</code> (tabela derivada) e no <code>SELECT</code> (escalar).</li>
</ul>
<pre>-- divisão em SQL: empregados que trabalham em TODOS os projetos do depto PROD
SELECT e.nome FROM empregado e
WHERE NOT EXISTS (
  SELECT * FROM projeto p WHERE p.depto = 'PROD'
  AND NOT EXISTS (SELECT * FROM trabalha_em t
                  WHERE t.empmat = e.matricula AND t.pcodigo = p.pcodigo));</pre>
<h3>Conjuntos</h3>
<p><code>UNION</code> (remove duplicatas), <code>UNION ALL</code> (mantém), <code>INTERSECT</code>, <code>EXCEPT</code>. Exigem o mesmo número de colunas com tipos compatíveis.</p>
<h3>WITH (CTE)</h3>
<pre>WITH media_depto AS (
  SELECT depto, AVG(salario) AS media FROM empregado GROUP BY depto
)
SELECT e.nome, e.salario, m.media
FROM empregado e JOIN media_depto m ON m.depto = e.depto
WHERE e.salario &gt; m.media;</pre>
<h3>Atualizações</h3>
<pre>INSERT INTO aluno (id_aluno, nome) VALUES (1, 'Fabio');
INSERT INTO aluno VALUES (2, 'José', '02/02/1980', '48 2335566', 'silva@x.com');
INSERT INTO projinfo SELECT p.pnome, COUNT(*) FROM … GROUP BY p.pnome;  -- inserção por consulta

UPDATE empregado SET salario = salario * 1.1 WHERE depto = 'DES';
UPDATE empregado SET salario = CASE WHEN salario &lt; 1000 THEN salario * 1.2 ELSE salario * 1.05 END;

DELETE FROM dependente WHERE empmat = '002';
DELETE FROM clientes;   -- apaga TUDO: confira várias vezes!</pre>
<h3>Funções úteis</h3>
<p>Texto: <code>LOWER, UPPER, CONCAT, ||, SUBSTRING, LENGTH, REPLACE, TRIM</code>. Números: <code>ABS, ROUND, CEIL, FLOOR, POWER, SQRT</code>. Datas (PostgreSQL): <code>NOW(), CURRENT_DATE, EXTRACT(YEAR FROM d), DATE_PART('month', d), AGE(d), d + INTERVAL '1 day'</code>. Nulos: <code>COALESCE(x, 0)</code>.</p>
<h3>Boas práticas (sqlstyle)</h3>
<p>Palavras-chave em MAIÚSCULAS, identificadores em minúsculas/snake_case, uma cláusula por linha, apelidos curtos nas junções, <code>AS</code> explícito, termine com <code>;</code>.</p>
`,
},
SQLREF,
{
  id: 'triggers', num: 11, title: 'Triggers (gatilhos) e PL/pgSQL', foe: 'Triggers',
  practice: ['7-1', '7-2', '7-3', '7-4', '7-5', '7-6', '7-7', '7-8', '7-9', '7-10', '7-11', '7-12', '7-13', '7-14', '7-15', '7-16'],
  html: `
<p>Restrições declarativas (NOT NULL, CHECK, UNIQUE, FK) validam o estado de <b>uma</b> tabela. <b>Triggers</b> implementam regras de negócio complexas, auditoria e atualizações automáticas, disparando em um evento DML.</p>
<h3>Modelo ECA: Evento – Condição – Ação</h3>
<ul>
<li><b>Evento</b>: <code>INSERT</code>, <code>UPDATE [OF coluna]</code>, <code>DELETE</code> sobre uma tabela.</li>
<li><b>Condição</b>: cláusula <code>WHEN</code> opcional; se falsa, a ação não roda.</li>
<li><b>Ação</b>: comandos SQL / procedimento. Momento: <code>BEFORE</code>, <code>AFTER</code> ou <code>INSTEAD OF</code> (visões).</li>
</ul>
<table class="tbl">
<tr><th>Momento</th><th>Uso típico</th></tr>
<tr><td>BEFORE</td><td>validar e <b>ajustar NEW</b> antes de gravar (preencher data/usuário, barrar com exceção)</td></tr>
<tr><td>AFTER</td><td>auditoria/log, atualizar tabelas agregadas, a modificação já foi feita</td></tr>
<tr><td>INSTEAD OF</td><td>substituir o comando (atualizar visões com JOIN/GROUP BY)</td></tr></table>
<p><b>Granularidade:</b> <code>FOR EACH ROW</code> (dispara uma vez por linha afetada, acessa <code>OLD</code>/<code>NEW</code>) × <code>FOR EACH STATEMENT</code> (uma vez por comando; usa tabelas de transição <code>OLD TABLE</code>/<code>NEW TABLE</code>).</p>
<table class="tbl"><tr><th>Evento</th><th>OLD</th><th>NEW</th></tr>
<tr><td>INSERT</td><td>—</td><td>linha a inserir</td></tr>
<tr><td>UPDATE</td><td>valores antigos</td><td>novos valores propostos</td></tr>
<tr><td>DELETE</td><td>linha a remover</td><td>—</td></tr></table>
<h3>No PostgreSQL: duas camadas</h3>
<pre>-- 1) função que RETORNA trigger
CREATE OR REPLACE FUNCTION emp.vsalario() RETURNS trigger AS $$
BEGIN
  IF NEW.salario &lt; OLD.salario THEN
    RAISE EXCEPTION 'Não se pode diminuir salário (matrícula %)', NEW.matricula;
  END IF;
  RETURN NEW;            -- BEFORE ROW: devolve a linha que será gravada
END;
$$ LANGUAGE plpgsql;

-- 2) o gatilho que associa a função à tabela e ao evento
CREATE TRIGGER atuemp
  BEFORE UPDATE ON emp.empregado
  FOR EACH ROW EXECUTE PROCEDURE emp.vsalario();   -- ou EXECUTE FUNCTION</pre>
<ul>
<li><code>RAISE EXCEPTION 'msg %', valor;</code> aborta o comando (e a transação).</li>
<li>Em <b>BEFORE ROW</b>: <code>RETURN NEW</code> grava (podendo ter alterado NEW); <code>RETURN NULL</code> cancela silenciosamente a operação nessa linha. Em DELETE devolva <code>OLD</code>.</li>
<li>Em <b>AFTER</b> o retorno é ignorado (use <code>RETURN NULL</code> ou <code>RETURN NEW</code>).</li>
<li><code>TG_OP</code> diz o evento ('INSERT', 'UPDATE', 'DELETE') — útil num gatilho para vários eventos.</li>
<li>Variáveis: <code>DECLARE x numeric; BEGIN SELECT salario INTO x FROM … ; END</code>. Laços: <code>FOR r IN SELECT … LOOP … END LOOP;</code>. <code>IF … THEN … ELSIF … ELSE … END IF;</code></li>
<li>Remover: <code>DROP TRIGGER atuemp ON emp.empregado;</code> e <code>DROP FUNCTION emp.vsalario();</code></li>
</ul>
<h3>Padrão ANSI (como nos slides)</h3>
<pre>CREATE TRIGGER irredutibilidade
AFTER UPDATE OF salario ON empregado
REFERENCING OLD ROW AS antes NEW ROW AS depois
FOR EACH ROW
WHEN (antes.salario &gt; depois.salario)
  UPDATE empregado SET salario = antes.salario WHERE matricula = antes.matricula;</pre>
<h3>Exemplos da prática (script Empresa)</h3>
<pre>-- empregado não pode ganhar mais que o chefe
CREATE OR REPLACE FUNCTION emp.vsalariosup() RETURNS trigger AS $$
BEGIN
  IF NEW.salario &gt; (SELECT salario FROM emp.empregado e WHERE e.matricula = NEW.supermat) THEN
    RAISE EXCEPTION 'emp % não pode ter salário superior ao do chefe', NEW.nome;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER atuemp2 BEFORE INSERT OR UPDATE ON emp.empregado
  FOR EACH ROW EXECUTE PROCEDURE emp.vsalariosup();

-- auditoria (AFTER) em tabela de log
CREATE TABLE emp.log_salario (matricula char(9), antigo numeric, novo numeric, quando timestamp DEFAULT now(), quem text DEFAULT current_user);
CREATE OR REPLACE FUNCTION emp.fn_log() RETURNS trigger AS $$
BEGIN
  INSERT INTO emp.log_salario (matricula, antigo, novo) VALUES (OLD.matricula, OLD.salario, NEW.salario);
  RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER tg_log AFTER UPDATE OF salario ON emp.empregado
  FOR EACH ROW WHEN (OLD.salario IS DISTINCT FROM NEW.salario) EXECUTE PROCEDURE emp.fn_log();</pre>
<h3>Receita em 6 passos (serve para qualquer trigger da prova)</h3>
<ol>
<li><b>Evento – Condição – Ação.</b> Em que tabela e em qual comando (INSERT/UPDATE/DELETE)? Quando a regra é violada? O que fazer: barrar, corrigir a linha ou mexer em outra tabela?</li>
<li><b>Momento e granularidade.</b> Barrar ou alterar a linha → <code>BEFORE</code>. Reagir ao que já foi gravado (log, totais, outra tabela) → <code>AFTER</code>. Quase sempre <code>FOR EACH ROW</code>; use <code>FOR EACH STATEMENT</code> só para “uma vez por comando”.</li>
<li><b>Esqueleto</b>: <code>CREATE OR REPLACE FUNCTION esq.nome() RETURNS trigger AS $$ [DECLARE …] BEGIN … RETURN …; END; $$ LANGUAGE plpgsql;</code></li>
<li><b>Lógica</b> com <code>IF … THEN … END IF;</code>, usando <code>NEW</code> (INSERT/UPDATE) e <code>OLD</code> (UPDATE/DELETE). Consultas: subconsulta escalar, <code>SELECT … INTO var</code> ou <code>EXISTS (…)</code>. Cuidado com nulos: use <code>IS NULL</code> e <code>IS DISTINCT FROM</code>.</li>
<li><b>Retorno</b>: BEFORE INSERT/UPDATE → <code>RETURN NEW</code>; BEFORE DELETE → <code>RETURN OLD</code>; AFTER ou STATEMENT → <code>RETURN NULL</code>.</li>
<li><b>Gatilho</b>: <code>CREATE TRIGGER nome {BEFORE|AFTER} evento [OR evento] [OF coluna] ON tabela FOR EACH ROW [WHEN (…)] EXECUTE PROCEDURE esq.nome();</code></li>
</ol>
<table class="tbl"><tr><th>Quero…</th><th>Use</th><th>Exercício</th></tr>
<tr><td>barrar um valor inválido</td><td>BEFORE + RAISE EXCEPTION</td><td>7-1, 7-2, 7-9</td></tr>
<tr><td>comparar com outra linha</td><td>BEFORE + subconsulta / EXISTS</td><td>7-3, 7-4, 7-10</td></tr>
<tr><td>corrigir ou preencher a linha</td><td>BEFORE + <code>NEW.col := …</code></td><td>7-8, 7-12</td></tr>
<tr><td>contar/somar antes de aceitar</td><td>BEFORE/AFTER + SELECT … INTO</td><td>7-7, 7-15</td></tr>
<tr><td>gravar log/arquivo</td><td>AFTER + INSERT em outra tabela</td><td>7-5, 7-11, 7-14</td></tr>
<tr><td>manter outra tabela coerente</td><td>AFTER + UPDATE em outra tabela, TG_OP</td><td>7-6, 7-16</td></tr>
<tr><td>regras em outra tabela</td><td>o gatilho fica nela</td><td>7-13</td></tr></table>
<div class="callout warn"><p>Cuidado com recursão: um AFTER UPDATE que faz UPDATE na mesma tabela dispara de novo. Prefira BEFORE alterando NEW, ou condições <code>WHEN</code>.</p></div>
`,
},
{
  id: 'prova', num: 12, title: 'Roteiro da prova: do conceitual ao SQL', foe: 'Integração',
  practice: [],
  html: `
<p>O objetivo anunciado da VF: partir de um minimundo e chegar à implementação. Siga sempre a mesma receita — ela é a mesma dos bosses.</p>
<h3>Fase 1 — Conceitual (ER)</h3>
<ol>
<li><b>Sublinhe substantivos</b> no enunciado: candidatos a entidade (coisas com identidade própria, que se repetem e têm propriedades) ou a atributo (propriedade simples).</li>
<li><b>Identificadores</b>: o enunciado costuma dizer “único”, “código”, “identificado por”. Toda entidade precisa de um (ou herda).</li>
<li><b>Verbos</b> que ligam substantivos → relacionamentos. Dê nomes de verbo (leciona, possui, trabalha).</li>
<li><b>Cardinalidade</b>: para cada lado, pergunte “<i>um(a) A se associa a no mínimo quantos e no máximo quantos B?</i>” e escreva a resposta <b>junto a B</b>. Palavras-chave: “pode” → mínimo 0; “deve/todo/sempre” → mínimo 1; “vários/um ou mais” → máximo n; “apenas um/exatamente um” → máximo 1.</li>
<li>Dado que depende da <b>associação</b> (data, quantidade, nota, horas) → atributo do relacionamento.</li>
<li>Procure: <b>multivalorados</b> (vários telefones), <b>compostos</b> (endereço), <b>entidade fraca</b> (“dependente de”, numeração relativa: item 1 do pedido 10), <b>auto-relacionamento</b> (chefe, pré-requisito), <b>especialização</b> (tipos com atributos próprios: (t/p, e/i)), <b>ternário</b> (fato com 3 participantes simultâneos).</li>
<li><b>Verifique</b>: sintaxe (identificadores, ligações), semântica (cardinalidades batem com o texto?), redundância (relacionamento derivável? atributo calculável?), completude (dá para responder às consultas pedidas?).</li>
</ol>
<h3>Fase 2 — Lógico (notação resumida)</h3>
<ol>
<li>Uma tabela por entidade; PK = identificador; compostos achatados; multivalorados em tabela própria.</li>
<li>Fraca: PK = PK da forte + parcial; FK para a forte.</li>
<li>1:n → FK no lado n. 1:1 → fundir ou FK UNIQUE do lado obrigatório. n:m e n-ário → tabela própria (PK composta de FKs).</li>
<li>Especialização → distribuição (padrão) ou fusão; justifique.</li>
<li>Escreva <code>x referencia T</code> para cada FK, chaves candidatas e opcionais.</li>
</ol>
<h3>Fase 3 — DDL</h3>
<ol>
<li>Crie primeiro as tabelas sem dependências (as “referenciadas”).</li>
<li>Tipos coerentes; NOT NULL para obrigatórios; PK/UNIQUE/CHECK; FK com ON DELETE/UPDATE adequado.</li>
<li>FK circular → <code>ALTER TABLE … ADD CONSTRAINT</code> depois.</li>
</ol>
<h3>Fase 4 — Consultas</h3>
<p>Quais tabelas? (FROM/JOIN) → quais linhas? (WHERE) → agrupa? (GROUP BY/HAVING) → o que mostrar? (SELECT) → ordem? (ORDER BY). “Nenhum/não” → LEFT JOIN … IS NULL / NOT EXISTS / EXCEPT. “Todos” → NOT EXISTS duplo (divisão).</p>
<h3>Fase 5 — Gatilho</h3>
<p>Regra que o DDL não consegue garantir (envolve outra tabela, histórico, valores antigos)? → função <code>RETURNS trigger</code> + <code>CREATE TRIGGER … BEFORE/AFTER … FOR EACH ROW</code>. Validação → BEFORE + RAISE EXCEPTION. Auditoria/total derivado → AFTER.</p>
<h3>Erros que mais tiram ponto</h3>
<ul>
<li>Cardinalidade escrita do lado errado (lembre: junto à entidade que está sendo <i>contada</i>).</li>
<li>Entidade sem identificador; atributo de relacionamento colocado numa entidade.</li>
<li>Ligar entidade direto a entidade; relacionamento n:m “absorvido” numa das tabelas.</li>
<li>FK no lado errado do 1:n; esquecer a PK composta da tabela n:m.</li>
<li><code>= NULL</code> em vez de <code>IS NULL</code>; coluna no SELECT fora do GROUP BY; WHERE com agregação (use HAVING).</li>
<li>Trigger BEFORE sem <code>RETURN NEW</code> (linha não é gravada!).</li>
</ul>
<p><a class="btn primary" href="#/boss">Treinar na avaliação final</a></p>
`,
},
];
