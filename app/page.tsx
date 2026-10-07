export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>DynaSport Live Football ⚽</h1>

      <p>
        Automated live football updates for the DynaSport Facebook Page.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2>System Status</h2>

      <p>🟢 Application: Online</p>
      <p>🟡 Football API: Not configured yet</p>
      <p>🟡 Facebook: Not configured yet</p>
      <p>🟡 Automation: Not running yet</p>
    </main>
  );
}
