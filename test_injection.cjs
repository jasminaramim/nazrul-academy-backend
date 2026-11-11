(async () => {
  const testPayloads = [
    { name: '1. Classic SQL Injection', body: { username: "admin' OR '1'='1", password: "' OR '1'='1" } },
    { name: '2. SQL Injection Comment', body: { username: "admin'--", password: "any" } },
    { name: '3. NoSQL Operator Injection', body: { username: { "$gt": "" }, password: { "$ne": null } } }
  ];

  for (const t of testPayloads) {
    try {
      const res = await fetch('http://localhost:3005/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t.body)
      });
      const data = await res.json();
      console.log('Test:', t.name);
      console.log('HTTP Status:', res.status);
      console.log('Server Message:', data.message);
      console.log('Bypass Succeeded?:', data.token ? '🚨 YES (VULNERABLE)' : '🛡️ NO (100% BLOCKED)');
      console.log('--------------------------------------------------');
    } catch(e) {
      console.error(e.message);
    }
  }
})();

