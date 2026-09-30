type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="admin-login">
      <form className="admin-login-card" action="/api/admin/login" method="post">
        <p className="admin-eyebrow">fındıkhane</p>
        <h1>Yönetim paneli</h1>
        <p className="admin-login-hint">Siparişleri görüntülemek için giriş yapın.</p>

        <label>
          Kullanıcı adı
          <input name="username" autoComplete="username" required autoFocus />
        </label>
        <label>
          Şifre
          <input name="password" type="password" autoComplete="current-password" required />
        </label>

        {error ? <p className="admin-login-error">{error}</p> : null}

        <button className="button button-primary admin-login-submit" type="submit">
          Giriş yap <span>→</span>
        </button>
      </form>
    </main>
  );
}
