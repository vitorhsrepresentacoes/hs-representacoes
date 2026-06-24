export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <main className="auth-page"><form className="auth-card" action="/api/auth/login" method="post"><p className="eyebrow">ACESSO RESTRITO</p><h1>Painel HS</h1><p>Entre com seu e-mail autorizado.</p><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>{erro && <p className="form-error">E-mail ou senha inválidos.</p>}<button className="button button-primary" type="submit">Entrar no painel</button><a className="back-link" href="/">Voltar ao site</a></form></main>;
}
