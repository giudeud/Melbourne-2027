import { useMemo, useState, type InputHTMLAttributes } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Deposit } from '../types';
import { useStore } from '../store/Store';
import { fetchAudBrl } from '../lib/fx';
import { fmtDate, fmtDateTime, fmtMoney, pct, todayISO, uid } from '../lib/utils';
import { Button, Card, Empty, Field, IconButton, Input, PageHeader, Progress, SectionTitle, Select } from '../components/ui';

function NumberInput({ value, onCommit, ...p }: { value: number; onCommit: (n: number) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [v, setV] = useState(String(value || ''));
  return (
    <Input
      {...p}
      inputMode="decimal"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = Number(v.replace(',', '.'));
        onCommit(Number.isFinite(n) && n >= 0 ? n : 0);
      }}
    />
  );
}

export default function Finance() {
  const { data, update } = useStore();
  const fin = data.finance;
  const rate = fin.rate.brlPerAud;
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'AUD' | 'BRL'>('BRL');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [manualRate, setManualRate] = useState(rate ? String(rate) : '');
  const [fxBusy, setFxBusy] = useState(false);
  const [fxErr, setFxErr] = useState<string | null>(null);
  const [conv, setConv] = useState({ aud: '', brl: '' });

  const total = fin.deposits.reduce((a, d) => a + d.amountAud, 0);
  const remaining = Math.max(0, fin.goalAud - total);
  const p = pct(total, fin.goalAud);
  const monthsLeft = fin.monthlyGoalAud > 0 ? Math.ceil(remaining / fin.monthlyGoalAud) : null;

  const thisMonth = todayISO().slice(0, 7);
  const savedThisMonth = fin.deposits.filter((d) => d.date.startsWith(thisMonth)).reduce((a, d) => a + d.amountAud, 0);

  const chart = useMemo(() => {
    const sorted = [...fin.deposits].sort((a, b) => (a.date < b.date ? -1 : 1));
    let acc = 0;
    return sorted.map((d) => ({ date: fmtDate(d.date), total: Math.round((acc += d.amountAud) * 100) / 100 }));
  }, [fin.deposits]);

  const setFin = (patch: Partial<typeof fin>) => update((d) => ({ ...d, finance: { ...d.finance, ...patch } }));

  const refresh = async () => {
    setFxBusy(true);
    setFxErr(null);
    try {
      const r = await fetchAudBrl();
      setFin({ rate: { brlPerAud: r.brlPerAud, updatedAt: new Date().toISOString(), source: 'api', refDate: r.refDate } });
      setManualRate(String(r.brlPerAud));
    } catch (e) {
      setFxErr(e instanceof Error ? e.message : String(e));
    } finally {
      setFxBusy(false);
    }
  };

  const saveManual = () => {
    const n = Number(manualRate.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return setFxErr('Informe uma cotação válida (BRL por 1 AUD).');
    setFxErr(null);
    setFin({ rate: { brlPerAud: n, updatedAt: new Date().toISOString(), source: 'manual', refDate: todayISO() } });
  };

  const amountNum = Number(amount.replace(',', '.'));
  const needsRate = currency === 'BRL' && !rate;
  const addDeposit = () => {
    if (!Number.isFinite(amountNum) || amountNum <= 0 || needsRate) return;
    const r = rate ?? 0;
    const dep: Deposit = {
      id: uid(),
      date,
      amount: amountNum,
      currency,
      rateBrlPerAud: r,
      amountAud: currency === 'AUD' ? amountNum : amountNum / r,
      note: note.trim(),
    };
    setFin({ deposits: [...fin.deposits, dep] });
    setAmount('');
    setNote('');
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Financial Tracker" subtitle="Reserva para a Austrália — meta sem contar a passagem de saída." />

      <div className="grid md:grid-cols-4 gap-3">
        <Card className="p-4 md:col-span-2">
          <p className="text-xs text-ink-muted font-medium">Total acumulado</p>
          <p className="text-3xl font-semibold mt-1 tabular-nums">{fmtMoney(total, 'AUD')}</p>
          {rate && <p className="text-xs text-ink-faint mt-0.5">≈ {fmtMoney(total * rate, 'BRL')} na cotação atual</p>}
          <div className="flex items-center gap-3 mt-4">
            <Progress value={p} className="h-2" />
            <span className="text-sm font-semibold tabular-nums">{p}%</span>
          </div>
          <p className="text-xs text-ink-muted mt-1">da meta de {fmtMoney(fin.goalAud, 'AUD')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-muted font-medium">Falta economizar</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{fmtMoney(remaining, 'AUD')}</p>
          {rate && <p className="text-xs text-ink-faint">≈ {fmtMoney(remaining * rate, 'BRL')}</p>}
          {monthsLeft !== null && remaining > 0 && <p className="text-xs text-ink-muted mt-2">≈ {monthsLeft} {monthsLeft === 1 ? 'mês' : 'meses'} na meta mensal</p>}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-muted font-medium">Este mês</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{fmtMoney(savedThisMonth, 'AUD')}</p>
          <p className="text-xs text-ink-muted mt-2">meta mensal {fmtMoney(fin.monthlyGoalAud, 'AUD')}</p>
          <Progress value={pct(savedThisMonth, fin.monthlyGoalAud)} className="mt-2" />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <SectionTitle>Evolução da reserva</SectionTitle>
            <Card className="p-4">
              {chart.length === 0 ? (
                <Empty>Registre o primeiro depósito para ver o gráfico.</Empty>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#3F7D58" stopOpacity={0.18} />
                          <stop offset="1" stopColor="#3F7D58" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#EEEDEA" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `A$${v}`} domain={[0, (max: number) => Math.max(max, fin.goalAud)]} />
                      <Tooltip formatter={(v) => [fmtMoney(Number(v), 'AUD'), 'Acumulado']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E7E5E4' }} />
                      <ReferenceLine y={fin.goalAud} stroke="#B7791F" strokeDasharray="4 4" label={{ value: 'Meta', position: 'insideTopRight', fontSize: 11, fill: '#B7791F' }} />
                      <Area type="monotone" dataKey="total" stroke="#3F7D58" strokeWidth={2} fill="url(#g)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div>
            <SectionTitle>Registrar depósito</SectionTitle>
            <Card className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-[1fr_100px_150px] gap-3">
                <Field label="Valor"><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" onKeyDown={(e) => e.key === 'Enter' && addDeposit()} /></Field>
                <Field label="Moeda">
                  <Select value={currency} onChange={(e) => setCurrency(e.target.value as 'AUD' | 'BRL')}>
                    <option value="BRL">BRL</option>
                    <option value="AUD">AUD</option>
                  </Select>
                </Field>
                <Field label="Data" className="col-span-2 sm:col-span-1"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                <Field label="Observação" className="col-span-2 sm:col-span-3"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: salário de novembro" /></Field>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Button variant="primary" onClick={addDeposit} disabled={!(amountNum > 0) || needsRate}>Adicionar depósito</Button>
                {amountNum > 0 && rate && (
                  <span className="text-xs text-ink-muted">
                    = {currency === 'BRL' ? fmtMoney(amountNum / rate, 'AUD') : fmtMoney(amountNum * rate, 'BRL')}
                  </span>
                )}
                {needsRate && <span className="text-xs text-warn">Defina a cotação AUD/BRL para registrar valores em BRL.</span>}
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>Histórico de depósitos</SectionTitle>
            {fin.deposits.length === 0 ? (
              <Empty>Nenhum depósito registrado ainda.</Empty>
            ) : (
              <Card className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs text-ink-muted border-b border-line">
                      <th className="font-medium px-4 py-2.5">Data</th>
                      <th className="font-medium px-4 py-2.5">Valor</th>
                      <th className="font-medium px-4 py-2.5">Em AUD</th>
                      <th className="font-medium px-4 py-2.5">Cotação usada</th>
                      <th className="font-medium px-4 py-2.5">Observação</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[...fin.deposits].sort((a, b) => (a.date < b.date ? 1 : -1)).map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(d.date)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{fmtMoney(d.amount, d.currency)}</td>
                        <td className="px-4 py-2.5 tabular-nums font-medium">{fmtMoney(d.amountAud, 'AUD')}</td>
                        <td className="px-4 py-2.5 text-ink-muted text-xs">{d.currency === 'BRL' ? `R$ ${d.rateBrlPerAud.toFixed(4)} / AUD` : '—'}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{d.note || '—'}</td>
                        <td className="px-2">
                          <IconButton label="Excluir depósito" className="hover:text-crit" onClick={() => confirm('Excluir este depósito?') && setFin({ deposits: fin.deposits.filter((x) => x.id !== d.id) })}>
                            <Trash2 size={14} />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle>Cotação AUD/BRL</SectionTitle>
            <Card className="p-4 space-y-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{rate ? `R$ ${rate.toFixed(4)}` : '—'}</p>
                <p className="text-xs text-ink-muted">por 1 AUD</p>
                <p className="text-[11px] text-ink-faint mt-1">
                  {fin.rate.updatedAt
                    ? `${fin.rate.source === 'api' ? `Frankfurter / BCE (ref. ${fin.rate.refDate})` : 'Manual'} · atualizado ${fmtDateTime(fin.rate.updatedAt)}`
                    : 'Nenhuma cotação registrada.'}
                </p>
              </div>
              <Button onClick={refresh} disabled={fxBusy} className="w-full">
                <RefreshCw size={14} className={fxBusy ? 'animate-spin' : ''} /> Atualizar pela API
              </Button>
              <div className="flex gap-2 items-end">
                <Field label="Cotação manual (BRL por AUD)" className="flex-1">
                  <Input inputMode="decimal" value={manualRate} onChange={(e) => setManualRate(e.target.value)} placeholder="Ex.: 3,50" />
                </Field>
                <Button onClick={saveManual}>Salvar</Button>
              </div>
              {fxErr && <p className="text-xs text-crit">{fxErr}</p>}
              <p className="text-[11px] text-ink-faint">Taxas de referência do Banco Central Europeu; o câmbio do seu banco/casa de câmbio será diferente.</p>
            </Card>
          </div>

          <div>
            <SectionTitle>Conversor</SectionTitle>
            <Card className="p-4 grid grid-cols-2 gap-3">
              <Field label="AUD">
                <Input inputMode="decimal" disabled={!rate} value={conv.aud} onChange={(e) => { const n = Number(e.target.value.replace(',', '.')); setConv({ aud: e.target.value, brl: rate && n ? (n * rate).toFixed(2) : '' }); }} />
              </Field>
              <Field label="BRL">
                <Input inputMode="decimal" disabled={!rate} value={conv.brl} onChange={(e) => { const n = Number(e.target.value.replace(',', '.')); setConv({ brl: e.target.value, aud: rate && n ? (n / rate).toFixed(2) : '' }); }} />
              </Field>
              {!rate && <p className="col-span-2 text-[11px] text-ink-faint">Defina a cotação para usar o conversor.</p>}
            </Card>
          </div>

          <div>
            <SectionTitle>Metas</SectionTitle>
            <Card className="p-4 space-y-3">
              <Field label="Meta da reserva (AUD)"><NumberInput value={fin.goalAud} onCommit={(n) => setFin({ goalAud: n })} /></Field>
              <Field label="Meta mensal de economia (AUD)"><NumberInput value={fin.monthlyGoalAud} onCommit={(n) => setFin({ monthlyGoalAud: n })} /></Field>
              <Field label="Passagem de saída — estimativa (BRL)" hint="Planejada à parte da reserva."><NumberInput value={fin.exitTicketBrl} onCommit={(n) => setFin({ exitTicketBrl: n })} /></Field>
              <Field label="Orçamento inicial de chegada (AUD)"><NumberInput value={fin.arrivalBudgetAud} onCommit={(n) => setFin({ arrivalBudgetAud: n })} /></Field>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
