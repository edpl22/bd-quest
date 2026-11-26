// Correção automática de exercícios SQL comparando com a solução de referência.
import { serial, resetTo, runScript, errMsg, compareResults, catalogCheck, tryStmt, widenSearchPath } from './db.js';

/** Executa o SQL do aluno num banco recém-criado e devolve os resultados para exibição. */
export function runForDisplay(dbName, setup, sql) {
  return serial(async () => {
    await resetTo(dbName, setup);
    try {
      return { results: await runScript(sql) };
    } catch (e) {
      return { error: errMsg(e) };
    }
  });
}

const lastWithFields = (res) => [...res].reverse().find((r) => r.fields && r.fields.length) || null;

async function collect(level) {
  const out = [];
  try { await widenSearchPath(); } catch { /* ignora */ }
  for (const c of level.checks || []) {
    if (c.sql) {
      try { const r = await runScript(c.sql); out.push({ r: lastWithFields(r) }); }
      catch (e) { out.push({ err: errMsg(e) }); }
    } else if (c.test) {
      out.push(await tryStmt(c.test));
    } else out.push(null);
  }
  return out;
}

/**
 * level: { db, setup?, solution, mode: 'query'|'script', ordered?, checks?: [...] }
 * checks: {kind:'pk'|'fk'|'cols'|'unique'|'notnull'|'table'|'trigger', ...} (catálogo)
 *         {sql, desc}   -> resultado deve ser igual ao da solução
 *         {test, desc}  -> comando deve falhar/funcionar igual à solução
 */
export function gradeSQL(level, userSQL) {
  return serial(async () => {
    const mode = level.mode || 'query';
    if (!userSQL.trim()) return { pass: false, items: [{ status: 'err', text: 'Escreva sua resposta antes de verificar.' }] };

    // 1) referência
    await resetTo(level.db, level.setup);
    let expRes;
    try { expRes = await runScript(level.solution); }
    catch (e) { return { pass: false, items: [{ status: 'err', text: 'Erro interno na solução de referência: ' + errMsg(e) }] }; }
    const expChecks = mode === 'script' ? await collect(level) : [];

    // 2) aluno
    await resetTo(level.db, level.setup);
    let userRes;
    try { userRes = await runScript(userSQL); }
    catch (e) {
      return { pass: false, error: errMsg(e), items: [{ status: 'err', text: 'Seu SQL gerou erro — corrija antes de verificar.', why: errMsg(e).replace(/</g, '&lt;') }] };
    }

    const items = [];
    let pass = true;
    let expected = null;

    if (mode === 'query') {
      expected = lastWithFields(expRes);
      const mine = lastWithFields(userRes);
      const cmp = compareResults(mine, expected, { ordered: level.ordered });
      pass = cmp.ok;
      items.push(cmp.ok
        ? { status: 'ok', text: `Resultado idêntico ao esperado (${expected.rows.length} linha${expected.rows.length === 1 ? '' : 's'}).` }
        : { status: 'err', text: cmp.msg });
      if (cmp.ok && level.mustUse) {
        for (const kw of level.mustUse) {
          const re = new RegExp(kw.re, 'i');
          if (!re.test(userSQL)) { items.push({ status: 'warn', text: `O exercício pede para usar <b>${kw.label}</b> — o resultado bate, mas treine a técnica pedida.` }); }
        }
      }
    } else {
      const userChecks = await collect(level);
      for (let i = 0; i < (level.checks || []).length; i++) {
        const c = level.checks[i];
        if (c.kind) {
          let r;
          try { r = await catalogCheck(c); } catch (e) { r = { ok: false, text: errMsg(e) }; }
          items.push({ status: r.ok ? 'ok' : 'err', text: r.text });
          if (!r.ok) pass = false;
        } else if (c.sql) {
          const e = expChecks[i], u = userChecks[i];
          let ok = false, why = '';
          if (u.err) why = u.err;
          else if (e.err) why = 'erro na referência: ' + e.err;
          else { const cmp = compareResults(u.r, e.r, { ordered: c.ordered }); ok = cmp.ok; why = cmp.msg || ''; }
          items.push({ status: ok ? 'ok' : 'err', text: c.desc, why: ok ? '' : why.replace(/</g, '&lt;') });
          if (!ok) pass = false;
        } else if (c.test) {
          const e = expChecks[i], u = userChecks[i];
          const expErr = !!e.error, usrErr = !!u.error;
          const ok = expErr === usrErr;
          const what = expErr ? 'deveria ser BLOQUEADO (erro)' : 'deveria ser ACEITO';
          items.push({
            status: ok ? 'ok' : 'err',
            text: `${c.desc || c.test} — ${what}`,
            why: ok ? (usrErr ? 'Bloqueado: ' + u.error.split('\n')[0] : '') : (usrErr ? 'Mas deu erro: ' + u.error.split('\n')[0] : 'Mas foi aceito sem erro.'),
          });
          if (!ok) pass = false;
        }
      }
      if (!(level.checks || []).length) items.push({ status: 'info', text: 'Script executado sem erros.' });
    }
    return { pass, items, userResults: userRes, expected };
  });
}

/** Resultado da solução de referência (para "ver resultado esperado"). */
export function expectedResult(level) {
  return serial(async () => {
    await resetTo(level.db, level.setup);
    const r = await runScript(level.solution);
    return lastWithFields(r);
  });
}
