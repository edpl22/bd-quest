// Guia de referência SQL (PostgreSQL) — além do básico. Blocos <pre class="run"> são executáveis.
const run = (sql, db = 'empresa') => `<pre class="run" data-db="${db}">${sql.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;

export const SQLREF = {
  id: 'sqlref', num: 10, title: 'Guia de referência SQL', foe: 'SQL DML e DDL — aprofundamento',
  practice: ['A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'A-8', 'A-9', 'A-10'],
  html: `
<p>Referência prática do SQL do PostgreSQL, indo além do básico. Os exemplos rodam no banco <code>emp</code> (script da disciplina): clique em <b>Executar</b> para ver o resultado ou em <b>Abrir no Playground</b> para modificá-los. O banco é recriado a cada execução, então pode testar <code>UPDATE</code> e <code>DELETE</code> à vontade.</p>

<h3>1. Ordem lógica de execução</h3>
<p>O SQL é escrito numa ordem e avaliado em outra. Entender isso explica a maioria dos erros:</p>
<table class="tbl">
<tr><th>Ordem</th><th>Cláusula</th><th>Consequência</th></tr>
<tr><td>1</td><td><code>FROM</code> / <code>JOIN</code></td><td>monta o conjunto de linhas</td></tr>
<tr><td>2</td><td><code>WHERE</code></td><td>filtra <b>linhas</b>; ainda não existem grupos nem apelidos do SELECT</td></tr>
<tr><td>3</td><td><code>GROUP BY</code></td><td>forma os grupos</td></tr>
<tr><td>4</td><td><code>HAVING</code></td><td>filtra <b>grupos</b> (aceita agregação)</td></tr>
<tr><td>5</td><td><code>SELECT</code></td><td>calcula expressões e apelidos</td></tr>
<tr><td>6</td><td><code>DISTINCT</code></td><td>remove duplicatas</td></tr>
<tr><td>7</td><td><code>ORDER BY</code></td><td>pode usar apelidos do SELECT</td></tr>
<tr><td>8</td><td><code>LIMIT</code> / <code>OFFSET</code></td><td>corta o resultado</td></tr></table>
<p>Por isso <code>WHERE media &gt; 1000</code> não funciona (o apelido ainda não existe) e <code>WHERE AVG(salario) &gt; 1000</code> dá erro (agregação vai no HAVING), mas <code>ORDER BY media</code> funciona.</p>
${run(`SELECT depto, AVG(salario) AS media
FROM empregado
WHERE sexo = 'M'            -- linhas: só homens
GROUP BY depto
HAVING COUNT(*) >= 2        -- grupos com 2+ homens
ORDER BY media DESC;        -- apelido permitido aqui`)}

<h3>2. SELECT, apelidos e DISTINCT</h3>
<ul>
<li><code>SELECT *</code> traz todas as colunas; prefira listar as necessárias.</li>
<li>Apelido de coluna: <code>salario * 12 AS anual</code>. Apelido de tabela: <code>FROM empregado e</code>.</li>
<li>Identificadores com maiúsculas/espaços exigem aspas duplas (<code>"Nome Completo"</code>); textos usam aspas simples (<code>'DES'</code>).</li>
<li><code>DISTINCT</code> vale para a <b>linha inteira</b> do SELECT, não para uma coluna.</li>
<li><code>DISTINCT ON (expr)</code> (PostgreSQL): mantém a <b>primeira</b> linha de cada valor de <i>expr</i>, segundo o ORDER BY — ótimo para “o maior de cada grupo”.</li>
</ul>
${run(`-- maior salário de cada departamento (uma linha por depto)
SELECT DISTINCT ON (depto) depto, nome, salario
FROM empregado
ORDER BY depto, salario DESC;`)}

<h3>3. Filtros e padrões</h3>
<table class="tbl">
<tr><th>Operador</th><th>Exemplo</th><th>Observação</th></tr>
<tr><td>Comparação</td><td><code>salario &gt;= 1000</code>, <code>depto &lt;&gt; 'DG'</code></td><td><code>&lt;&gt;</code> e <code>!=</code> são iguais</td></tr>
<tr><td>Lógicos</td><td><code>a AND (b OR c)</code></td><td>AND tem precedência sobre OR — use parênteses</td></tr>
<tr><td>BETWEEN</td><td><code>salario BETWEEN 900 AND 1000</code></td><td>inclui os extremos</td></tr>
<tr><td>IN</td><td><code>depto IN ('DES', 'PROD')</code></td><td>lista ou subconsulta</td></tr>
<tr><td>LIKE</td><td><code>nome LIKE 'J%'</code>, <code>snome LIKE 'S_l%'</code></td><td><code>%</code> = qualquer sequência; <code>_</code> = um caractere; diferencia maiúsculas</td></tr>
<tr><td>ILIKE</td><td><code>nome ILIKE '%silva%'</code></td><td>LIKE sem diferenciar maiúsculas (PostgreSQL)</td></tr>
<tr><td>Expressão regular</td><td><code>nome ~ '^[A-E]'</code></td><td><code>~*</code> ignora maiúsculas</td></tr></table>
${run(`SELECT nome, snome FROM empregado
WHERE nome ILIKE '%a' OR snome LIKE 'S_l%';`)}

<h3>4. NULL e a lógica de três valores</h3>
<p>Comparar com NULL não dá verdadeiro nem falso: dá <b>UNKNOWN</b>, e o WHERE só mantém linhas TRUE.</p>
<table class="tbl">
<tr><th>Expressão</th><th>Resultado</th></tr>
<tr><td><code>NULL = NULL</code>, <code>NULL &lt;&gt; 1</code>, <code>NULL + 1</code></td><td>NULL (unknown)</td></tr>
<tr><td><code>TRUE AND NULL</code> / <code>FALSE AND NULL</code></td><td>NULL / FALSE</td></tr>
<tr><td><code>TRUE OR NULL</code> / <code>FALSE OR NULL</code></td><td>TRUE / NULL</td></tr>
<tr><td><code>x IS NULL</code>, <code>x IS NOT NULL</code></td><td>sempre TRUE/FALSE</td></tr>
<tr><td><code>a IS DISTINCT FROM b</code></td><td>“diferente”, tratando NULL como valor comparável</td></tr></table>
<ul>
<li><code>COALESCE(a, b, c)</code> devolve o primeiro não nulo — ótimo para trocar NULL por 0 ou um texto.</li>
<li><code>NULLIF(a, b)</code> devolve NULL se a = b (evita divisão por zero: <code>x / NULLIF(y, 0)</code>).</li>
<li>Agregações ignoram NULL (exceto <code>COUNT(*)</code>).</li>
</ul>
${run(`SELECT nome, supermat,
       supermat IS NULL               AS sem_chefe,
       COALESCE(supermat, '(nenhum)') AS chefe
FROM empregado
ORDER BY matricula;`)}
<div class="callout warn"><p><b>Armadilha do NOT IN:</b> se a subconsulta tiver um NULL, <code>x NOT IN (…)</code> nunca é verdadeiro e a consulta volta vazia. Maria não tem supervisor (supermat nulo), então a primeira consulta abaixo retorna 0 linhas. Use <code>NOT EXISTS</code>.</p></div>
${run(`-- ERRADO: volta vazio por causa do NULL em supermat
SELECT nome FROM empregado
WHERE matricula NOT IN (SELECT supermat FROM empregado);

-- CERTO: quem não supervisiona ninguém
SELECT nome FROM empregado e
WHERE NOT EXISTS (SELECT 1 FROM empregado s WHERE s.supermat = e.matricula);`)}

<h3>5. Ordenação e paginação</h3>
<pre>ORDER BY depto ASC, salario DESC      -- vários critérios
ORDER BY supermat NULLS FIRST          -- onde ficam os nulos (padrão: NULLS LAST no ASC)
ORDER BY 2 DESC                        -- pela 2ª coluna do SELECT (evite em prova)
LIMIT 5 OFFSET 10                      -- 5 linhas, pulando 10 (página 3)
FETCH FIRST 5 ROWS ONLY                -- padrão SQL equivalente ao LIMIT 5</pre>
<p>Sem <code>ORDER BY</code> a ordem do resultado <b>não é garantida</b>.</p>

<h3>6. Agregação a fundo</h3>
<table class="tbl">
<tr><th>Função</th><th>O que faz</th></tr>
<tr><td><code>COUNT(*)</code></td><td>conta linhas (inclusive com nulos)</td></tr>
<tr><td><code>COUNT(col)</code></td><td>conta valores <b>não nulos</b> de col</td></tr>
<tr><td><code>COUNT(DISTINCT col)</code></td><td>conta valores <b>distintos</b> não nulos</td></tr>
<tr><td><code>SUM</code>, <code>AVG</code>, <code>MIN</code>, <code>MAX</code></td><td>ignoram nulos; <code>SUM(DISTINCT x)</code> e <code>AVG(DISTINCT x)</code> também existem</td></tr>
<tr><td><code>string_agg(col, ', ' ORDER BY col)</code></td><td>junta textos do grupo</td></tr>
<tr><td><code>array_agg(col)</code></td><td>monta um array com os valores</td></tr>
<tr><td><code>bool_and(cond)</code> / <code>bool_or(cond)</code></td><td>todos / algum verdadeiro no grupo</td></tr>
<tr><td><code>agg(...) FILTER (WHERE cond)</code></td><td>agrega só as linhas que satisfazem cond</td></tr></table>
${run(`SELECT COUNT(*)                 AS linhas,
       COUNT(supermat)          AS com_supervisor,
       COUNT(DISTINCT supermat) AS supervisores_distintos,
       COUNT(DISTINCT depto)    AS deptos
FROM empregado;`)}
${run(`SELECT p.pnome,
       COUNT(*)                                  AS alocacoes,
       COUNT(DISTINCT e.depto)                   AS deptos_envolvidos,
       SUM(t.horas)                              AS horas,
       string_agg(e.nome, ', ' ORDER BY e.nome)  AS equipe
FROM projeto p
JOIN trabalha_em t ON t.pcodigo = p.pcodigo
JOIN empregado e   ON e.matricula = t.empmat
GROUP BY p.pnome;`)}
${run(`-- contagens condicionais com FILTER
SELECT depto,
       COUNT(*)                                  AS total,
       COUNT(*) FILTER (WHERE sexo = 'F')        AS mulheres,
       COUNT(*) FILTER (WHERE salario >= 1500)   AS salario_alto,
       ROUND(AVG(salario), 2)                    AS media
FROM empregado
GROUP BY depto
ORDER BY depto;`)}
<p><b>Regra do GROUP BY:</b> toda coluna do SELECT que não está dentro de uma agregação precisa aparecer no GROUP BY (ou ser determinada pela chave primária agrupada). Senão: <i>column "x" must appear in the GROUP BY clause</i>.</p>
<p><b>Subtotais:</b> <code>GROUP BY ROLLUP (a, b)</code> acrescenta linhas de subtotal por <i>a</i> e o total geral (as colunas “resumidas” aparecem como NULL). <code>CUBE</code> faz todas as combinações; <code>GROUPING SETS ((a), (b), ())</code> escolhe quais.</p>
${run(`SELECT depto, sexo, COUNT(*) AS qtd, SUM(salario) AS folha
FROM empregado
GROUP BY ROLLUP (depto, sexo)
ORDER BY depto, sexo;`)}

<h3>7. CASE (condicionais)</h3>
<pre>CASE WHEN cond1 THEN r1 WHEN cond2 THEN r2 ELSE r3 END   -- "pesquisada"
CASE depto WHEN 'DES' THEN 'TI' WHEN 'DG' THEN 'Diretoria' ELSE 'Outro' END   -- "simples"</pre>
<p>Pode aparecer no SELECT, WHERE, ORDER BY, dentro de agregações (pivot) e no SET do UPDATE. Sem ELSE, o resultado é NULL.</p>
${run(`SELECT nome, salario,
       CASE
         WHEN salario < 1000 THEN 'faixa 1'
         WHEN salario < 1800 THEN 'faixa 2'
         ELSE 'faixa 3'
       END AS faixa
FROM empregado
ORDER BY salario;`)}
${run(`-- "pivot": uma coluna por categoria
SELECT depto,
       SUM(CASE WHEN sexo = 'M' THEN 1 ELSE 0 END) AS homens,
       SUM(CASE WHEN sexo = 'F' THEN 1 ELSE 0 END) AS mulheres
FROM empregado
GROUP BY depto;`)}

<h3>8. Funções de texto, número, data e conversão</h3>
<table class="tbl">
<tr><th>Texto</th><th>Números</th><th>Datas</th></tr>
<tr><td>
<code>a || b</code>, <code>concat(a, b)</code><br><code>upper</code>, <code>lower</code>, <code>initcap</code><br><code>length</code>, <code>trim</code>, <code>replace</code><br><code>substring(s FROM 1 FOR 3)</code><br><code>position('a' IN s)</code>, <code>split_part(s, ',', 2)</code><br><code>lpad(s, 5, '0')</code>
</td><td>
<code>round(x, 2)</code>, <code>trunc</code><br><code>ceil</code>, <code>floor</code>, <code>abs</code><br><code>mod(a, b)</code> ou <code>a % b</code><br><code>power</code>, <code>sqrt</code><br><b>7 / 2 = 3</b> (inteiro!)<br>7 / 2.0 = 3.5
</td><td>
<code>current_date</code>, <code>now()</code><br><code>extract(year FROM d)</code><br><code>date_part('month', d)</code><br><code>age(d1, d2)</code>, <code>d2 - d1</code> (dias)<br><code>d + interval '10 days'</code><br><code>date_trunc('month', ts)</code>, <code>to_char(d, 'DD/MM/YYYY')</code>
</td></tr></table>
<p>Conversão de tipos: <code>CAST(x AS integer)</code> ou, no PostgreSQL, <code>x::integer</code>.</p>
${run(`SELECT nome || ' ' || snome                         AS nome_completo,
       UPPER(snome)                                 AS sobrenome,
       LENGTH(nome)                                 AS letras,
       SUBSTRING(nome FROM 1 FOR 3)                 AS inicio,
       EXTRACT(YEAR FROM datanasc)                  AS ano_nasc,
       DATE_PART('year', AGE(DATE '2026-11-27', datanasc)) AS idade_na_prova,
       TO_CHAR(datanasc, 'DD/MM/YYYY')              AS nascimento
FROM empregado
ORDER BY idade_na_prova DESC
LIMIT 5;`)}
${run(`SELECT DATE '2026-11-27' - DATE '2026-11-25'           AS dias,
       DATE '2026-11-27' + INTERVAL '10 days'            AS depois,
       DATE_TRUNC('month', TIMESTAMP '2026-11-27 08:00') AS inicio_mes,
       7 / 2 AS div_inteira, 7 / 2.0 AS div_real, 7 % 2 AS resto,
       CAST('42' AS INTEGER) + 1 AS cast1, '3.5'::numeric * 2 AS cast2;`)}

<h3>9. Junções em detalhe</h3>
<table class="tbl">
<tr><th>Forma</th><th>Quando usar</th></tr>
<tr><td><code>a JOIN b ON a.x = b.y</code></td><td>padrão; condição explícita</td></tr>
<tr><td><code>a JOIN b USING (col)</code></td><td>colunas com o mesmo nome; a coluna aparece uma vez</td></tr>
<tr><td><code>a NATURAL JOIN b</code></td><td>iguala <b>todas</b> as colunas homônimas — perigoso (ex.: <code>nome</code>, <code>depto</code>)</td></tr>
<tr><td><code>LEFT</code> / <code>RIGHT</code> / <code>FULL [OUTER] JOIN</code></td><td>preservar linhas sem par (completa com NULL)</td></tr>
<tr><td><code>CROSS JOIN</code></td><td>produto cartesiano</td></tr>
<tr><td>semi-junção</td><td><code>WHERE EXISTS (…)</code> — “tem pelo menos um”</td></tr>
<tr><td>anti-junção</td><td><code>LEFT JOIN … WHERE b.chave IS NULL</code> ou <code>NOT EXISTS</code> — “não tem nenhum”</td></tr></table>
${run(`SELECT p.pnome, t.empmat, t.horas
FROM projeto p JOIN trabalha_em t USING (pcodigo)
WHERE p.pnome = 'Jubarte';`)}
<div class="callout warn"><p><b>Armadilha do LEFT JOIN:</b> condição sobre a tabela da direita no <code>WHERE</code> elimina as linhas completadas com NULL — o LEFT vira INNER. Coloque essa condição no <code>ON</code>.</p></div>
${run(`-- ERRADO: some quem não tem alocação com mais de 30 h
SELECT e.nome, t.pcodigo
FROM empregado e LEFT JOIN trabalha_em t ON t.empmat = e.matricula
WHERE t.horas > 30;

-- CERTO: todos os empregados; projeto só se horas > 30
SELECT e.nome, t.pcodigo
FROM empregado e LEFT JOIN trabalha_em t ON t.empmat = e.matricula AND t.horas > 30;`)}
${run(`-- FULL JOIN: departamentos sem projeto e projetos sem departamento aparecem
SELECT d.deptosigla, d.deptonome, p.pnome
FROM departamento d FULL JOIN projeto p ON p.depto = d.deptosigla
ORDER BY d.deptosigla;`)}

<h3>10. Subconsultas</h3>
<table class="tbl">
<tr><th>Tipo</th><th>Exemplo</th></tr>
<tr><td>Escalar (1 linha, 1 coluna)</td><td><code>salario &gt; (SELECT AVG(salario) FROM empregado)</code></td></tr>
<tr><td>Lista</td><td><code>depto IN (SELECT depto FROM projeto)</code></td></tr>
<tr><td>Existência</td><td><code>EXISTS (SELECT 1 FROM … WHERE … = e.matricula)</code></td></tr>
<tr><td>Quantificada</td><td><code>&gt; ALL (…)</code> maior que todos; <code>&gt; ANY (…)</code> maior que algum (<code>= ANY</code> ≡ IN)</td></tr>
<tr><td>Tabela derivada</td><td><code>FROM (SELECT …) AS d</code> — o apelido é obrigatório</td></tr>
<tr><td>No SELECT</td><td><code>(SELECT COUNT(*) FROM dependente d WHERE d.empmat = e.matricula) AS deps</code></td></tr>
<tr><td>LATERAL</td><td>subconsulta no FROM que enxerga as tabelas à esquerda (ex.: top-N por grupo)</td></tr></table>
<p>Erro comum: <i>more than one row returned by a subquery used as an expression</i> — a subconsulta escalar devolveu várias linhas; use IN, ANY ou agregue.</p>
${run(`SELECT nome, salario FROM empregado
WHERE salario > ALL (SELECT salario FROM empregado WHERE depto = 'PROD');`)}
${run(`SELECT e.nome,
       (SELECT COUNT(*) FROM dependente d WHERE d.empmat = e.matricula) AS dependentes,
       salario - (SELECT AVG(salario) FROM empregado)                  AS dif_media
FROM empregado e
ORDER BY dif_media DESC;`)}
${run(`-- os 2 maiores salários de cada departamento (LATERAL)
SELECT d.deptonome, top.nome, top.salario
FROM departamento d
CROSS JOIN LATERAL (
  SELECT nome, salario FROM empregado e
  WHERE e.depto = d.deptosigla
  ORDER BY salario DESC
  LIMIT 2
) AS top;`)}

<h3>11. Operações de conjunto</h3>
<p><code>UNION</code> (sem repetição), <code>UNION ALL</code> (com repetição, mais rápido), <code>INTERSECT</code>, <code>EXCEPT</code>. Mesmo número de colunas, tipos compatíveis; os nomes vêm da primeira consulta e o <code>ORDER BY</code> vai no final de tudo.</p>
${run(`-- empregados do DES que trabalham no projeto 1
SELECT nome FROM empregado WHERE depto = 'DES'
INTERSECT
SELECT e.nome FROM empregado e JOIN trabalha_em t ON t.empmat = e.matricula WHERE t.pcodigo = 1;

-- matrículas sem nenhuma alocação
SELECT matricula FROM empregado
EXCEPT
SELECT empmat FROM trabalha_em;`)}

<h3>12. CTE: WITH e WITH RECURSIVE</h3>
<p><code>WITH nome AS (consulta)</code> cria uma “tabela temporária” para a consulta seguinte — deixa consultas longas legíveis e permite reutilizar um resultado. Podem ser várias: <code>WITH a AS (…), b AS (…) SELECT …</code>.</p>
<p><code>WITH RECURSIVE</code> percorre hierarquias (chefe → subordinados, pré-requisitos, peças compostas): um termo inicial <code>UNION ALL</code> um termo que referencia a própria CTE.</p>
${run(`WITH RECURSIVE hierarquia AS (
  SELECT matricula, nome, supermat, 1 AS nivel, nome::text AS caminho
  FROM empregado
  WHERE supermat IS NULL                       -- topo: quem não tem chefe
  UNION ALL
  SELECT e.matricula, e.nome, e.supermat, h.nivel + 1, h.caminho || ' > ' || e.nome
  FROM empregado e
  JOIN hierarquia h ON e.supermat = h.matricula -- desce um nível
)
SELECT nivel, nome, caminho FROM hierarquia ORDER BY caminho;`)}

<h3>13. Funções de janela (OVER)</h3>
<p>Calculam sobre um conjunto de linhas relacionadas <b>sem colapsar</b> o resultado (diferente do GROUP BY). Sintaxe: <code>funcao() OVER (PARTITION BY … ORDER BY …)</code>.</p>
<table class="tbl">
<tr><th>Função</th><th>Resultado</th></tr>
<tr><td><code>ROW_NUMBER()</code></td><td>1, 2, 3, 4 … (sem empates)</td></tr>
<tr><td><code>RANK()</code></td><td>1, 2, 2, 4 … (empate pula posições)</td></tr>
<tr><td><code>DENSE_RANK()</code></td><td>1, 2, 2, 3 … (empate não pula)</td></tr>
<tr><td><code>NTILE(4)</code></td><td>quartil da linha</td></tr>
<tr><td><code>LAG(col)</code> / <code>LEAD(col)</code></td><td>valor da linha anterior / seguinte</td></tr>
<tr><td><code>SUM(col) OVER (ORDER BY …)</code></td><td>soma acumulada</td></tr>
<tr><td><code>AVG(col) OVER (PARTITION BY g)</code></td><td>média do grupo ao lado de cada linha</td></tr></table>
${run(`SELECT nome, depto, salario,
       RANK()       OVER (PARTITION BY depto ORDER BY salario DESC) AS rank_no_depto,
       DENSE_RANK() OVER (ORDER BY salario DESC)                    AS dense_geral,
       ROW_NUMBER() OVER (ORDER BY salario DESC, nome)              AS linha,
       ROUND(AVG(salario) OVER (PARTITION BY depto), 2)             AS media_depto
FROM empregado
ORDER BY depto, salario DESC;`)}
${run(`SELECT nome, datanasc, salario,
       SUM(salario) OVER (ORDER BY datanasc) AS folha_acumulada,
       LAG(nome)    OVER (ORDER BY datanasc) AS anterior,
       LEAD(nome)   OVER (ORDER BY datanasc) AS proximo
FROM empregado
ORDER BY datanasc;`)}
${run(`-- top-2 por departamento com janela (não dá para usar a janela direto no WHERE)
SELECT * FROM (
  SELECT nome, depto, salario,
         ROW_NUMBER() OVER (PARTITION BY depto ORDER BY salario DESC, nome) AS pos
  FROM empregado
) x
WHERE pos <= 2;`)}

<h3>14. DML além do básico</h3>
<ul>
<li><b>Várias linhas:</b> <code>INSERT INTO t VALUES (…), (…), (…);</code></li>
<li><b>A partir de consulta:</b> <code>INSERT INTO t (cols) SELECT …;</code> ou <code>CREATE TABLE t AS SELECT …;</code></li>
<li><b>RETURNING</b> (PostgreSQL): devolve as linhas inseridas/alteradas/apagadas.</li>
<li><b>UPSERT:</b> <code>INSERT … ON CONFLICT (chave) DO NOTHING</code> ou <code>DO UPDATE SET col = EXCLUDED.col</code> (<code>EXCLUDED</code> = a linha que você tentou inserir).</li>
<li><b>UPDATE com junção:</b> <code>UPDATE t SET … FROM outra WHERE …</code>. <b>DELETE com junção:</b> <code>DELETE FROM t USING outra WHERE …</code>.</li>
<li><code>TRUNCATE t</code> apaga tudo sem varrer linha a linha (não dispara triggers de linha; não aceita WHERE).</li>
</ul>
${run(`INSERT INTO projeto (pnome, pcodigo, plocalizacao, depto)
VALUES ('Mata Atlântica', 4, 'Paraty', 'DES'),
       ('Cerrado', 5, 'Brasília', 'PROD')
RETURNING *;`)}
${run(`-- 004 já tem 40 h no projeto 3: soma 10 h em vez de dar erro de chave
INSERT INTO trabalha_em (empmat, pcodigo, horas) VALUES ('004', 3, 10)
ON CONFLICT (empmat, pcodigo)
DO UPDATE SET horas = trabalha_em.horas + EXCLUDED.horas
RETURNING *;`)}
${run(`UPDATE empregado e
SET salario = e.salario * 1.05
FROM departamento d
WHERE d.deptosigla = e.depto AND d.deptonome = 'Producao'
RETURNING e.nome, e.salario;`)}
${run(`DELETE FROM trabalha_em t
USING projeto p
WHERE p.pcodigo = t.pcodigo AND p.pnome = 'Jubarte'
RETURNING t.*;`)}

<h3>15. Transações</h3>
<p><code>BEGIN</code> inicia; <code>COMMIT</code> confirma; <code>ROLLBACK</code> desfaz tudo; <code>SAVEPOINT s</code> + <code>ROLLBACK TO SAVEPOINT s</code> desfaz só o trecho depois do ponto. Fora de um BEGIN, cada comando é uma transação (autocommit).</p>
${run(`BEGIN;
UPDATE empregado SET salario = 0;
SAVEPOINT antes_do_delete;
DELETE FROM dependente;
ROLLBACK TO SAVEPOINT antes_do_delete;
SELECT COUNT(*) AS dependentes FROM dependente;   -- o DELETE foi desfeito
ROLLBACK;                                        -- desfaz também o UPDATE
SELECT nome, salario FROM empregado ORDER BY matricula LIMIT 3;`)}

<h3>16. Índices e desempenho</h3>
<p>Índice = estrutura do nível <b>interno</b> que acelera buscas (independência física: a consulta não muda). PRIMARY KEY e UNIQUE criam índice automaticamente; FKs <b>não</b>.</p>
${run(`CREATE INDEX idx_emp_depto ON empregado (depto);
CREATE UNIQUE INDEX idx_emp_nome ON empregado (nome, snome);
EXPLAIN SELECT * FROM empregado WHERE matricula = '004';`)}

<h3>17. Mensagens de erro frequentes</h3>
<table class="tbl">
<tr><th>Mensagem (PostgreSQL)</th><th>Causa provável</th></tr>
<tr><td>column "x" must appear in the GROUP BY clause or be used in an aggregate function</td><td>coluna do SELECT fora do GROUP BY</td></tr>
<tr><td>aggregate functions are not allowed in WHERE</td><td>use HAVING</td></tr>
<tr><td>column "x" does not exist</td><td>nome errado, ou apelido do SELECT usado no WHERE, ou texto com aspas duplas em vez de simples</td></tr>
<tr><td>missing FROM-clause entry for table "e"</td><td>apelido não declarado no FROM</td></tr>
<tr><td>column reference "x" is ambiguous</td><td>coluna existe nas duas tabelas: qualifique (<code>e.nome</code>)</td></tr>
<tr><td>more than one row returned by a subquery used as an expression</td><td>subconsulta escalar com várias linhas</td></tr>
<tr><td>subquery in FROM must have an alias</td><td>falta <code>AS d</code> na tabela derivada</td></tr>
<tr><td>operator does not exist: integer = character varying</td><td>tipos diferentes: converta com <code>::</code></td></tr>
<tr><td>duplicate key value violates unique constraint</td><td>PK/UNIQUE repetida (pense em ON CONFLICT)</td></tr>
<tr><td>insert or update on table … violates foreign key constraint</td><td>valor da FK não existe na tabela referenciada</td></tr>
<tr><td>update or delete on table … violates foreign key constraint</td><td>há linhas apontando para a que você quer apagar (apague-as antes ou use CASCADE)</td></tr>
<tr><td>division by zero</td><td>use <code>NULLIF(divisor, 0)</code></td></tr></table>
`,
};
