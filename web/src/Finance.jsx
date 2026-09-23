import { useCallback, useEffect, useState } from 'react';

let plaidScriptPromise;

function loadPlaidScript() {
  if (window.Plaid) return Promise.resolve();
  if (!plaidScriptPromise) {
    plaidScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-astitva-plaid]');
      const script = existing || document.createElement('script');
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error('Plaid Link could not be loaded. Check your internet connection.')), { once: true });
      if (!existing) {
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.async = true;
        script.dataset.astitvaPlaid = 'true';
        document.head.appendChild(script);
      }
    });
  }
  return plaidScriptPromise;
}

const thisMonth = () => new Date().toISOString().slice(0, 7);
const title = (value = '') => value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const dateTime = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never';
const money = (value, currency = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value || 0);
  } catch (_) {
    return `${value || 0} ${currency}`;
  }
};

function TransactionList({ transactions, empty = 'No synchronized transactions yet.' }) {
  if (!transactions.length) return <p className="finance-muted">{empty}</p>;
  return <div className="finance-transactions">
    {transactions.map((transaction) => {
      const displayAmount = transaction.direction === 'expense'
        ? -Math.abs(transaction.amount)
        : transaction.direction === 'income'
          ? Math.abs(transaction.amount)
          : -transaction.amount;
      return <article key={transaction.id}>
        <time dateTime={transaction.date}>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${transaction.date}T12:00:00`))}</time>
        <div><strong>{transaction.merchantName || transaction.name}</strong><span>{title(transaction.category)}{transaction.pending ? ' · Pending' : ''}</span></div>
        <strong className={displayAmount > 0 ? 'finance-positive' : ''}>{displayAmount > 0 ? '+' : ''}{money(displayAmount, transaction.currency)}</strong>
      </article>;
    })}
  </div>;
}

function AccountDetail({ accountId, apiRequest, busy, reloadKey, actionError, actionMessage, onBack, onRefresh, onRemoved }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setData(null);
    apiRequest(`/api/finance/accounts/${accountId}`)
      .then((result) => { if (active) { setData(result); setError(''); } })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [accountId, apiRequest, reloadKey]);

  async function stopTracking() {
    if (!window.confirm('Stop tracking this account? Its local transactions and holdings will be deleted, but the institution will remain connected.')) return;
    await onRemoved(accountId);
  }

  return <section className="profile-content finance-page">
    <button className="text-action back-action" type="button" onClick={onBack}>← Back to Finance</button>
    {actionError && <p className="form-message finance-notice" role="alert">{actionError}</p>}
    {actionMessage && <p className="finance-notice" role="status">{actionMessage}</p>}
    {error && <p className="form-message" role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading account…</p>}
    {data && <>
      <header className="profile-header finance-detail-header">
        <div><p className="eyebrow">Finance / {data.account.institutionName}</p><h1>{data.account.name}{data.account.mask ? ` ··${data.account.mask}` : ''}</h1></div>
      </header>
      <div className="finance-detail-grid">
        <article><span>Current balance</span><strong>{money(data.account.currentBalance, data.account.currency)}</strong></article>
        <article><span>{data.account.assetClass === 'investment' ? 'Account value' : 'Available'}</span><strong>{money(data.account.assetClass === 'investment' ? data.account.currentBalance : data.account.availableBalance, data.account.currency)}</strong></article>
        <article><span>Last synced</span><strong>{dateTime(data.account.lastSuccessfulSyncAt)}</strong></article>
      </div>
      <div className="finance-actions">
        <button className="button" type="button" disabled={busy} onClick={onRefresh}>{busy ? 'Refreshing…' : 'Refresh finances'}</button>
        <button className="button danger" type="button" disabled={busy} onClick={stopTracking}>Stop tracking account</button>
      </div>
      {data.holdings.length > 0 && <section className="finance-section">
        <h2>Holdings</h2>
        <div className="finance-table">
          {data.holdings.map((holding) => <article key={holding.id}>
            <div><strong>{holding.name}</strong><span>{holding.tickerSymbol || title(holding.securityType)}</span></div>
            <span>{holding.quantity} shares</span>
            <strong>{money(holding.marketValue, holding.currency)}</strong>
          </article>)}
        </div>
      </section>}
      <section className="finance-section"><h2>Recent activity</h2><TransactionList transactions={data.recentTransactions} /></section>
    </>}
  </section>;
}

export default function Finance({ apiRequest }) {
  const [month, setMonth] = useState(thisMonth);
  const [summary, setSummary] = useState(null);
  const [connections, setConnections] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState(0);

  const load = useCallback(async () => {
    const [summaryResult, connectionResult] = await Promise.all([
      apiRequest(`/api/finance/summary?month=${month}`),
      apiRequest('/api/finance/connections')
    ]);
    setSummary(summaryResult);
    setConnections(connectionResult.connections);
    setError('');
  }, [apiRequest, month]);

  useEffect(() => {
    let active = true;
    setSummary(null);
    load().catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [load, version]);

  function shiftMonth(amount) {
    const date = new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + amount);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  async function run(action, work, success) {
    setBusy(action); setError(''); setMessage('');
    try {
      const result = await work();
      if (result !== false) setMessage(success);
      setVersion((value) => value + 1);
      return result !== false;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setBusy('');
    }
  }

  async function connect() {
    await run('connect', async () => {
      const session = await apiRequest('/api/finance/connection-sessions', {
        method: 'POST',
        body: JSON.stringify({ provider: 'plaid' })
      });
      await loadPlaidScript();
      return new Promise((resolve, reject) => {
        const handler = window.Plaid.create({
          token: session.sessionToken,
          onSuccess: async (publicToken) => {
            try {
              await apiRequest('/api/finance/connections', {
                method: 'POST',
                body: JSON.stringify({ provider: 'plaid', exchangeToken: publicToken })
              });
              handler.destroy();
              resolve();
            } catch (requestError) {
              handler.destroy();
              reject(requestError);
            }
          },
          onExit: (plaidError) => {
            handler.destroy();
            if (plaidError) reject(new Error('Plaid Link did not complete. Please try again.'));
            else resolve(false);
          }
        });
        handler.open();
      });
    }, 'Account connection completed.');
  }

  async function refresh() {
    await run('sync', () => apiRequest('/api/finance/sync', {
      method: 'POST', body: JSON.stringify({})
    }), 'Finance data refreshed.');
  }

  async function stopTracking(id) {
    const removed = await run('remove-account', () => apiRequest(`/api/finance/accounts/${id}`, { method: 'DELETE' }), 'Account removed from local Finance tracking.');
    if (removed) setAccountId(null);
  }

  async function disconnect(connection) {
    if (!window.confirm(`Disconnect ${connection.institutionName}? All of its locally synchronized Finance data will be deleted.`)) return;
    await run('disconnect', () => apiRequest(`/api/finance/connections/${connection.id}`, { method: 'DELETE' }), 'Institution disconnected and local data deleted.');
  }

  if (accountId) return <AccountDetail accountId={accountId} apiRequest={apiRequest} busy={Boolean(busy)} reloadKey={version}
    actionError={error} actionMessage={message}
    onBack={() => setAccountId(null)} onRefresh={refresh} onRemoved={stopTracking} />;

  return <section className="profile-content finance-page">
    <header className="profile-header finance-header">
      <div><p className="eyebrow">Local financial view</p><h1>Finance.</h1></div>
      <div className="finance-actions">
        <button className="button" type="button" disabled={Boolean(busy)} onClick={refresh}>{busy === 'sync' ? 'Refreshing…' : 'Refresh'}</button>
        <button className="button finance-connect" type="button" disabled={Boolean(busy)} onClick={connect}>{busy === 'connect' ? 'Opening Plaid…' : 'Connect account'}</button>
      </div>
    </header>
    {error && <p className="form-message finance-notice" role="alert">{error}</p>}
    {message && <p className="finance-notice" role="status">{message}</p>}
    {!summary && !error && <p role="status">Loading finances…</p>}
    {summary && <>
      <p className="finance-sync">{summary.asOf ? `Last synced ${dateTime(summary.asOf)}` : 'No financial data has been synchronized yet.'}</p>
      {summary.sync.status === 'stale' && <p className="finance-warning">Some connections need attention. Your last successful local data remains available.</p>}
      {summary.excludedCurrencyAccountCount > 0 && <p className="finance-warning">{summary.excludedCurrencyAccountCount} non-USD account value is excluded from consolidated totals.</p>}
      <div className="finance-summary">
        {[['Net worth', summary.totals.netWorth], ['Cash', summary.totals.cash], ['Investments', summary.totals.investments], ['Debt', summary.totals.debt]].map(([label, value]) =>
          <article key={label}><p className="eyebrow">{label}</p><strong>{money(value)}</strong></article>)}
      </div>

      <section className="finance-section">
        <div className="finance-section-heading"><div><p className="eyebrow">Connected locally</p><h2>Accounts</h2></div><span>{summary.accountCount} accounts · {summary.connectionCount} institutions</span></div>
        {!connections.length && <div className="finance-empty"><h3>No accounts connected.</h3><p>Connect a Plaid Sandbox institution to create your local financial view. Plaid credentials and durable access tokens stay on the server.</p><button className="button" onClick={connect} disabled={Boolean(busy)}>Connect account</button></div>}
        {connections.map((connection) => <article className="finance-connection" key={connection.id}>
          <header><div><h3>{connection.institutionName}</h3><p>{title(connection.status)} · Last synced {dateTime(connection.lastSuccessfulSyncAt)}</p></div>
            <button className="text-action" disabled={Boolean(busy)} onClick={() => disconnect(connection)}>Disconnect institution</button></header>
          {connection.lastSyncErrorCode && <p className="finance-warning">Sync issue: {title(connection.lastSyncErrorCode)}</p>}
          <div className="finance-account-list">{connection.accounts.map((account) => <button type="button" key={account.id} onClick={() => setAccountId(account.id)}>
            <span><strong>{account.name}{account.mask ? ` ··${account.mask}` : ''}</strong><small>{title(account.subtype || account.type)}</small></span>
            <strong>{money(account.currentBalance, account.currency)} <i>View ›</i></strong>
          </button>)}</div>
        </article>)}
      </section>

      <section className="finance-section">
        <div className="finance-section-heading"><div><p className="eyebrow">Monthly view</p><h2>Spending</h2></div>
          <div className="finance-month"><button className="text-action" onClick={() => shiftMonth(-1)}>‹ Previous</button><strong>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))}</strong><button className="text-action" onClick={() => shiftMonth(1)}>Next ›</button></div></div>
        <p className="finance-spending-total">{money(summary.monthlySpending.total)}</p>
        <div className="finance-categories">{summary.monthlySpending.categories.length
          ? summary.monthlySpending.categories.map((category) => <article key={category.name}><span>{title(category.name)}</span><strong>{money(category.amount)}</strong></article>)
          : <p className="finance-muted">No completed USD expenses for this month.</p>}</div>
      </section>

      <section className="finance-section"><p className="eyebrow">Last ten</p><h2>Recent transactions</h2><TransactionList transactions={summary.recentTransactions} /></section>
    </>}
  </section>;
}
