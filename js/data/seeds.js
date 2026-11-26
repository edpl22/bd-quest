// Bancos de dados usados nos exercícios.
// EMPRESA: script "scriptEmpresav2020" da disciplina (schema emp), com dependentes da prática de visões.
// ALGEBRA: empresa no estilo Elmasri usada no caderno de Álgebra Relacional passo a passo (schema ar).

export const EMPRESA_SQL = `
CREATE SCHEMA emp;
SET search_path TO emp, public;

CREATE TABLE emp.empregado (
  nome      varchar(15) NOT NULL,
  snome     varchar(15) NOT NULL,
  matricula char(9)     NOT NULL,
  datanasc  date,
  endereco  varchar(30),
  sexo      char(1),
  salario   numeric(10,2),
  supermat  char(9),
  depto     char(5)     NOT NULL,
  CONSTRAINT empregado_pkey PRIMARY KEY (matricula),
  CONSTRAINT empregado_supermat_fkey FOREIGN KEY (supermat)
    REFERENCES emp.empregado (matricula) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE emp.departamento (
  deptonome        varchar(15) NOT NULL,
  deptosigla       char(5)     NOT NULL,
  matriculagerente char(9),
  CONSTRAINT departamento_pkey PRIMARY KEY (deptosigla),
  CONSTRAINT departamento_matriculagerente_fkey FOREIGN KEY (matriculagerente)
    REFERENCES emp.empregado (matricula) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT departamento_deptonome_key UNIQUE (deptonome)
);

INSERT INTO emp.departamento VALUES ('Producao','PROD',NULL), ('Desenvolvimento','DES',NULL), ('Diretoria','DG',NULL);

INSERT INTO emp.empregado VALUES ('Maria','Silva','001','13/07/1955','','F',1000,NULL,'DG');
INSERT INTO emp.empregado VALUES ('Joao','Goya','002','23/12/1965','','M',2000,'001','DG');
INSERT INTO emp.empregado VALUES ('Abel','Flores','003','31/10/1973','','M',1000,'001','DG');

ALTER TABLE emp.empregado ADD CONSTRAINT empregado_depto_fkey FOREIGN KEY (depto)
  REFERENCES emp.departamento (deptosigla) ON UPDATE CASCADE ON DELETE RESTRICT;

UPDATE emp.departamento SET matriculagerente='001' WHERE deptosigla='DES';
UPDATE emp.departamento SET matriculagerente='002' WHERE deptosigla='DG';
UPDATE emp.departamento SET matriculagerente='003' WHERE deptosigla='PROD';

INSERT INTO emp.empregado VALUES ('Carlos','Gardel','004','11/09/1972','','M',2000,'002','DES');
INSERT INTO emp.empregado VALUES ('Edson','Celui','005','21/02/1944','','M',800,'003','PROD');
INSERT INTO emp.empregado VALUES ('Flávio','Altolá','006','30/09/1956','','M',1000,'003','PROD');
INSERT INTO emp.empregado VALUES ('Gilda','Gomes','007','01/08/1966','','F',900,'003','PROD');
INSERT INTO emp.empregado VALUES ('Hilton','Silva','008','15/05/1964','','M',1800,'002','DES');
INSERT INTO emp.empregado VALUES ('Irene','Santos','009','16/04/1963','','F',1900,'002','DES');
INSERT INTO emp.empregado VALUES ('José','Souza','010','25/05/1959','','M',1000,'003','DES');
INSERT INTO emp.empregado VALUES ('Kátia','Moura','011','22/03/1960','','F',1400,'002','PROD');
INSERT INTO emp.empregado VALUES ('Noel','Reis','012','03/01/1961','','M',900,'003','DES');
INSERT INTO emp.empregado VALUES ('Otto','Bastos','013','01/11/1962','','M',850,'003','DES');

CREATE TABLE emp.projeto (
  pnome        varchar(15) NOT NULL,
  pcodigo      int         NOT NULL,
  plocalizacao varchar(15),
  depto        char(5)     NOT NULL,
  PRIMARY KEY (pcodigo),
  UNIQUE (pnome),
  FOREIGN KEY (depto) REFERENCES emp.departamento (deptosigla)
);
INSERT INTO emp.projeto VALUES ('Tamar',1,'Itaúnas','PROD'), ('Jubarte',2,'Abrolhos','PROD'), ('Pantanal',3,'Bonito','DES');

CREATE TABLE emp.trabalha_em (
  empmat  char(9)      NOT NULL,
  pcodigo int          NOT NULL,
  horas   decimal(3,1) NOT NULL,
  PRIMARY KEY (empmat, pcodigo),
  FOREIGN KEY (empmat) REFERENCES emp.empregado (matricula),
  FOREIGN KEY (pcodigo) REFERENCES emp.projeto (pcodigo)
);
INSERT INTO emp.trabalha_em VALUES
  ('004',3,40), ('005',1,40), ('006',1,40), ('007',2,40), ('008',3,40), ('009',3,20), ('010',3,20),
  ('011',2,40), ('012',3,20), ('013',3,20), ('009',1,20), ('010',1,20), ('012',2,20), ('013',2,20);

CREATE TABLE emp.dependente (
  empmat        char(9)     NOT NULL,
  depnome       varchar(15) NOT NULL,
  sexo          char,
  datanasc      date,
  parentesco    varchar(8)  NOT NULL,
  auxiliocreche numeric(6,2),
  PRIMARY KEY (empmat, depnome),
  FOREIGN KEY (empmat) REFERENCES emp.empregado (matricula)
);
INSERT INTO emp.dependente VALUES ('001','Sofia','F','31/01/2008','filha',NULL);
INSERT INTO emp.dependente VALUES ('001','Lucia','F','11/11/2003','filha',NULL);
INSERT INTO emp.dependente VALUES ('002','Yoshi','M','18/08/2020','pet',NULL);
INSERT INTO emp.dependente VALUES ('004','Ana','F','02/03/2019','filha',150.00);
INSERT INTO emp.dependente VALUES ('008','Pedro','M','20/06/2021','filho',150.00);
INSERT INTO emp.dependente VALUES ('008','Clara','F','05/09/1966','esposa',NULL);
`;

export const EMPRESA_DESC = `Esquema <code>emp</code> (script da disciplina):
<ul>
<li><b>empregado</b>(<u>matricula</u>, nome, snome, datanasc, endereco, sexo, salario, supermat→empregado, depto→departamento)</li>
<li><b>departamento</b>(<u>deptosigla</u>, deptonome, matriculagerente→empregado)</li>
<li><b>projeto</b>(<u>pcodigo</u>, pnome, plocalizacao, depto→departamento)</li>
<li><b>trabalha_em</b>(<u>empmat, pcodigo</u>, horas) — empmat→empregado, pcodigo→projeto</li>
<li><b>dependente</b>(<u>empmat, depnome</u>, sexo, datanasc, parentesco, auxiliocreche)</li>
</ul>`;

export const ALGEBRA_SQL = `
CREATE SCHEMA ar;
SET search_path TO ar, public;

CREATE TABLE ar.empregado (
  pnome varchar(15), minic char(1), snome varchar(15), mat char(6) PRIMARY KEY,
  datan date, sexo char(1), salario numeric(10,2), matsup char(6), dnum int
);
INSERT INTO ar.empregado VALUES
 ('João','B','Rocha','123456','09/01/1955','M',30000,'333444',5),
 ('Franklin','T','Silva','333444','08/12/1945','M',40000,'111144',5),
 ('Alícia','J','Barreto','654321','19/07/1958','F',25000,'552233',4),
 ('Janete','S','Castro','552233','20/06/1940','F',43000,'111144',4),
 ('Rames','M','Cardoso','111666','15/09/1952','M',38000,'333444',5),
 ('Joyce','A','Pereira','161616','31/07/1962','F',25000,'333444',5),
 ('Amaral','V','Amado','521634','29/03/1959','M',25000,'552233',4),
 ('Jaime','E','Siqueira','111144','10/11/1937','M',55000,NULL,1);

CREATE TABLE ar.departamento (dnome varchar(20), dnum int PRIMARY KEY, matger char(6), inicger date);
INSERT INTO ar.departamento VALUES
 ('Pesquisa',5,'333444','22/05/1978'), ('Administração',4,'552233','01/01/1985'), ('Presidência',1,'111144','19/06/1971');

CREATE TABLE ar.depto_local (dnum int, dlocal varchar(20), PRIMARY KEY (dnum, dlocal));
INSERT INTO ar.depto_local VALUES (1,'Rio de Janeiro'), (4,'São Paulo'), (5,'Belo Horizonte'), (5,'Recife'), (5,'Rio de Janeiro');

CREATE TABLE ar.projeto (projnome varchar(20), pnum int PRIMARY KEY, plocal varchar(20), dnum int);
INSERT INTO ar.projeto VALUES
 ('Produto X',1,'Belo Horizonte',5), ('Produto Y',2,'Recife',5), ('Produto Z',3,'Rio de Janeiro',5),
 ('Automação',10,'São Paulo',4), ('Reengenharia',20,'Rio de Janeiro',1), ('Benefícios',30,'São Paulo',4);

CREATE TABLE ar.trabalha_em (mat char(6), pnum int, horas numeric(4,1), PRIMARY KEY (mat, pnum));
INSERT INTO ar.trabalha_em VALUES
 ('123456',1,32.5), ('123456',2,7.5), ('111666',3,40), ('161616',1,20), ('161616',2,20),
 ('333444',2,10), ('333444',3,10), ('333444',10,10), ('333444',20,10),
 ('654321',30,30), ('654321',10,10), ('521634',10,35), ('521634',30,5),
 ('552233',30,20), ('552233',20,15), ('111144',20,NULL);

CREATE TABLE ar.dependente (emat char(6), depnome varchar(15), sexo char(1), nasc date, relacao varchar(10), PRIMARY KEY (emat, depnome));
INSERT INTO ar.dependente VALUES
 ('333444','Alice','F','05/04/1986','filha'), ('333444','Teodoro','M','25/10/1983','filho'), ('333444','Ana','F','03/05/1958','esposa'),
 ('552233','Jonas','M','28/02/1942','esposo'),
 ('123456','Miguel','M','01/01/1988','filho'), ('123456','Alice','F','31/12/1988','filha'), ('123456','Elizabete','F','05/05/1967','esposa');
`;

export const ALGEBRA_DESC = `Esquema <code>ar</code> (empresa do caderno de Álgebra Relacional):
<ul>
<li><b>EMPREGADO</b>(pnome, minic, snome, <u>mat</u>, datan, sexo, salario, matsup, dnum)</li>
<li><b>DEPARTAMENTO</b>(dnome, <u>dnum</u>, matger, inicger)</li>
<li><b>DEPTO_LOCAL</b>(<u>dnum, dlocal</u>)</li>
<li><b>PROJETO</b>(projnome, <u>pnum</u>, plocal, dnum)</li>
<li><b>TRABALHA_EM</b>(<u>mat, pnum</u>, horas)</li>
<li><b>DEPENDENTE</b>(<u>emat, depnome</u>, sexo, nasc, relacao)</li>
</ul>
<p class="small muted">Atributos com o mesmo nome (dnum, mat, pnum) permitem junção natural (⋈).</p>`;

export const CLUBE_DESC = `Esquema <code>cd</code> (pgexercises — clubdata):
<ul>
<li><b>members</b>(<u>memid</u>, surname, firstname, address, zipcode, telephone, recommendedby→members, joindate)</li>
<li><b>facilities</b>(<u>facid</u>, name, membercost, guestcost, initialoutlay, monthlymaintenance)</li>
<li><b>bookings</b>(<u>bookid</u>, facid→facilities, memid→members, starttime, slots)</li>
</ul>
<p class="small muted">memid = 0 é o convidado (GUEST). Cada slot = 30 minutos.</p>`;

export const DB_INFO = {
  empresa: { label: 'Empresa (emp) — script da disciplina', schema: 'emp', desc: EMPRESA_DESC },
  algebra: { label: 'Empresa Elmasri (ar) — álgebra', schema: 'ar', desc: ALGEBRA_DESC },
  clube: { label: 'Clube (cd) — pgexercises', schema: 'cd', desc: CLUBE_DESC },
  vazio: { label: 'Banco vazio (public)', schema: 'public', desc: 'Banco vazio: crie suas próprias tabelas.' },
};

export async function seedSQL(name) {
  if (name === 'empresa') return EMPRESA_SQL;
  if (name === 'algebra') return ALGEBRA_SQL;
  if (name === 'clube') return (await import('./clube.js')).default;
  return 'SET search_path TO public;';
}
