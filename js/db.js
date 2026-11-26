// "Backend" do site: PostgreSQL real (PGlite/WebAssembly) rodando no navegador.
import { seedSQL } from './data/seeds.js';

const PGLITE_URL = 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.3.16/dist/index.js';

let dbPromise = null;
let current = null; // nome do banco atualmente carregado

// Mantém datas/números como texto para exibição fiel.
const PARSERS = { 1082: (v) => v, 1083: (v) => v, 1114: (v) => v, 1184: (v) => v, 1700: (v) => v, 20: (v) => v, 1186: (v) => v };

export function getDB() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const mod = globalThis.__PGLITE_MODULE || (await import(PGLITE_URL));
      const db = new mod.PGlite({ parsers: PARSERS });
      await db.exec("SET datestyle TO 'ISO, DMY'");
      return db;
    })();
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}

// Fila simples: garante que reset + execução não se misturem.
let chain = Promise.resolve();
export function serial(fn) {
  const p = chain.then(fn, fn);
  chain = p.catch(() => {});
  return p;
}

const RESET_SQL = `
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT nspname FROM pg_namespace
           WHERE nspname NOT LIKE 'pg\\_%' AND nspname <> 'information_schema' LOOP
    EXECUTE format('DROP SCHEMA %I CASCADE', r.nspname);
  END LOOP;
END $$;
CREATE SCHEMA public;
SET search_path TO public;
SET datestyle TO 'ISO, DMY';
`;

/** Recria o banco do zero e carrega o seed indicado (+ SQL extra opcional). */
export async function resetTo(name, extra = '') {
  const db = await getDB();
  await db.exec(RESET_SQL);
  await db.exec(await seedSQL(name));
  if (extra) await db.exec(extra);
  current = name;
  return db;
}

export function currentDB() { return current; }

/** Executa um script e devolve [{fields, rows, affectedRows}] por comando. */
export async function runScript(sql) {
  const db = await getDB();
  const res = await db.exec(sql, { rowMode: 'array' });
  return res.map((r) => ({ fields: (r.fields || []).map((f) => f.name), rows: r.rows || [], affectedRows: r.affectedRows }));
}

export async function query(sql) {
  const db = await getDB();
  const r = await db.query(sql, [], { rowMode: 'array' });
  return { fields: r.fields.map((f) => f.name), rows: r.rows };
}

export function errMsg(e) {
  if (!e) return 'erro desconhecido';
  let m = e.message || String(e);
  if (e.detail) m += `\nDETALHE: ${e.detail}`;
  if (e.hint) m += `\nDICA: ${e.hint}`;
  if (e.where) m += `\nONDE: ${e.where}`;
  return m;
}

// ---------- comparação de resultados ----------

function normVal(v) {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'boolean') return v ? 't' : 'f';
  if (typeof v === 'number' || typeof v === 'bigint') return fmtNum(Number(v));
  const s = String(v).replace(/\s+$/, '');
  if (/^-?\d+(\.\d+)?$/.test(s)) return fmtNum(Number(s));
  return s;
}
function fmtNum(n) { return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100); }

export function compareResults(user, expected, { ordered = false } = {}) {
  if (!user) return { ok: false, msg: 'Sua consulta não retornou um conjunto de resultados (use SELECT).' };
  const nu = user.fields.length, ne = expected.fields.length;
  if (nu !== ne) return { ok: false, msg: `Número de colunas diferente: você retornou ${nu}, o esperado tem ${ne} (${expected.fields.join(', ')}).` };
  const ser = (rows) => rows.map((r) => JSON.stringify(r.map(normVal)));
  let a = ser(user.rows), b = ser(expected.rows);
  if (a.length !== b.length) {
    return { ok: false, msg: `Número de linhas diferente: você retornou ${a.length}, o esperado tem ${b.length}.` };
  }
  if (!ordered) { a = [...a].sort(); b = [...b].sort(); }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      if (ordered && [...a].sort().join() === [...b].sort().join()) return { ok: false, msg: 'As linhas estão certas, mas a ORDEM não é a pedida (confira o ORDER BY).' };
      return { ok: false, msg: `Conteúdo diferente. Ex.: você tem ${fmtRow(a[i])} e o esperado contém ${fmtRow(b[i])} (compare a tabela esperada).` };
    }
  }
  return { ok: true };
}
const fmtRow = (j) => '(' + JSON.parse(j).join(', ') + ')';

// ---------- verificações de catálogo (DDL) ----------

const lc = (s) => String(s).toLowerCase();

async function tableOid(name) {
  const [schema, tbl] = name.includes('.') ? name.split('.') : [null, name];
  const r = await query(`SELECT c.oid, n.nspname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = '${lc(tbl)}' AND c.relkind IN ('r','v','p') ${schema ? `AND n.nspname='${lc(schema)}'` : "AND n.nspname NOT IN ('pg_catalog','information_schema')"}
    ORDER BY (n.nspname = ANY(current_schemas(false))) DESC LIMIT 1`);
  return r.rows[0]?.[0] ?? null;
}

async function constraintCols(oid, type) {
  const r = await query(`SELECT con.conname,
      (SELECT array_agg(a.attname ORDER BY a.attname) FROM unnest(con.conkey) k JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k)::text AS cols,
      ft.relname AS reftable, con.confdeltype, con.confupdtype
    FROM pg_constraint con LEFT JOIN pg_class ft ON ft.oid = con.confrelid
    WHERE con.conrelid = ${oid} AND con.contype = '${type}'`);
  return r.rows.map(([name, cols, ref, del, upd]) => ({
    name, cols: String(cols || '').replace(/[{}"]/g, '').split(',').filter(Boolean), ref, del, upd,
  }));
}

const sameSet = (a, b) => a.length === b.length && [...a].map(lc).sort().join() === [...b].map(lc).sort().join();
const ACTIONS = { a: 'NO ACTION', r: 'RESTRICT', c: 'CASCADE', n: 'SET NULL', d: 'SET DEFAULT' };

/** Executa uma verificação estrutural. Devolve {ok, text}. */
export async function catalogCheck(c) {
  const oid = await tableOid(c.table);
  if (!oid) return { ok: false, text: `Tabela <code>${c.table}</code> não encontrada.` };
  switch (c.kind) {
    case 'table':
      return { ok: true, text: c.desc || `Tabela <code>${c.table}</code> existe.` };
    case 'cols': {
      const r = await query(`SELECT attname FROM pg_attribute WHERE attrelid=${oid} AND attnum>0 AND NOT attisdropped`);
      const have = r.rows.map((x) => lc(x[0]));
      const missing = c.cols.filter((x) => !have.includes(lc(x)));
      return { ok: !missing.length, text: c.desc || (missing.length ? `Faltam colunas em <code>${c.table}</code>: ${missing.join(', ')}` : `Colunas de <code>${c.table}</code> ok.`) };
    }
    case 'pk': {
      const pk = (await constraintCols(oid, 'p'))[0];
      const ok = pk && sameSet(pk.cols, c.cols);
      return { ok, text: c.desc || `Chave primária de <code>${c.table}</code> = (${c.cols.join(', ')})` + (ok ? '' : pk ? ` — encontrada (${pk.cols.join(', ')})` : ' — nenhuma PK declarada') };
    }
    case 'fk': {
      const fks = await constraintCols(oid, 'f');
      const f = fks.find((x) => sameSet(x.cols, c.cols) && lc(x.ref) === lc(c.ref));
      let ok = !!f;
      let extra = '';
      if (f && c.onDelete) { ok = ACTIONS[f.del] === c.onDelete.toUpperCase(); if (!ok) extra = ` — ON DELETE está ${ACTIONS[f.del]}`; }
      if (f && ok && c.onUpdate) { ok = ACTIONS[f.upd] === c.onUpdate.toUpperCase(); if (!ok) extra = ` — ON UPDATE está ${ACTIONS[f.upd]}`; }
      return { ok, text: c.desc || `FK <code>${c.table}(${c.cols.join(', ')})</code> → <code>${c.ref}</code>${c.onDelete ? ' ON DELETE ' + c.onDelete : ''}${c.onUpdate ? ' ON UPDATE ' + c.onUpdate : ''}${extra}` };
    }
    case 'unique': {
      const us = await constraintCols(oid, 'u');
      const idx = await query(`SELECT (SELECT array_agg(a.attname ORDER BY a.attname) FROM unnest(i.indkey) k JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k)::text
        FROM pg_index i WHERE i.indrelid=${oid} AND i.indisunique AND NOT i.indisprimary`);
      const sets = us.map((u) => u.cols).concat(idx.rows.map((r) => String(r[0] || '').replace(/[{}"]/g, '').split(',')));
      const ok = sets.some((s) => sameSet(s, c.cols));
      return { ok, text: c.desc || `UNIQUE em <code>${c.table}(${c.cols.join(', ')})</code>` };
    }
    case 'notnull': {
      const r = await query(`SELECT attnotnull FROM pg_attribute WHERE attrelid=${oid} AND attname='${lc(c.col)}'`);
      const ok = r.rows[0]?.[0] === true;
      return { ok, text: c.desc || `<code>${c.table}.${c.col}</code> é NOT NULL` };
    }
    case 'trigger': {
      const r = await query(`SELECT count(*) FROM pg_trigger WHERE tgrelid=${oid} AND NOT tgisinternal`);
      const ok = Number(r.rows[0][0]) > 0;
      return { ok, text: c.desc || `Existe trigger em <code>${c.table}</code>` };
    }
    default:
      return { ok: false, text: 'verificação desconhecida: ' + c.kind };
  }
}

/** Coloca todos os schemas criados pelo usuário no search_path (para as verificações). */
export async function widenSearchPath() {
  const r = await query(`SELECT string_agg(quote_ident(nspname), ', ' ORDER BY (nspname = 'public') DESC, nspname)
    FROM pg_namespace WHERE nspname NOT LIKE 'pg\\_%' AND nspname <> 'information_schema'`);
  const cur = await query('SHOW search_path');
  const list = [...new Set([...String(cur.rows[0][0]).split(',').map((s) => s.trim()).filter((s) => s && s !== '"$user"'), ...String(r.rows[0][0] || 'public').split(', ')])];
  await runScript('SET search_path TO ' + list.join(', '));
}

/** Executa um comando isolado e informa se deu erro. */
export async function tryStmt(sql) {
  try {
    const r = await runScript(sql);
    return { error: null, result: r[r.length - 1] };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
