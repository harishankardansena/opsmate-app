// instrumentation.ts — runs before anything else in Next.js server startup
// Uses Google DNS-over-HTTPS (port 443) to bypass ISP DNS blocks on port 53

export async function register() {
  const originalUri = process.env.MONGODB_URI || '';
  if (!originalUri.startsWith('mongodb+srv://')) return; // Only needed for SRV URIs

  try {
    // Extract credentials and cluster from the SRV URI
    const match = originalUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)/);
    if (!match) return;
    const [, user, pass, cluster] = match;

    console.log('\x1b[36m→ Resolving MongoDB SRV via Google DNS over HTTPS...\x1b[0m');

    // Step 1: Resolve SRV record via Google DoH (HTTPS port 443 — never blocked by ISP)
    const srvRes = await fetch(
      `https://dns.google/resolve?name=_mongodb._tcp.${cluster}&type=SRV`,
      { headers: { Accept: 'application/dns-json' } }
    );
    const srvData = await srvRes.json();

    if (!srvData.Answer || srvData.Answer.length === 0) {
      console.log('\x1b[33m⚠ SRV records not found, keeping original URI\x1b[0m');
      return;
    }

    // Parse SRV records: "priority weight port target"
    const hosts = srvData.Answer.map((r: { data: string }) => {
      const parts = r.data.split(' ');
      const port = parts[2];
      const host = parts[3].replace(/\.$/, ''); // strip trailing dot
      return `${host}:${port}`;
    }).join(',');

    // Step 2: Resolve TXT record for replica set name
    let replicaSet = '';
    try {
      const txtRes = await fetch(
        `https://dns.google/resolve?name=${cluster}&type=TXT`,
        { headers: { Accept: 'application/dns-json' } }
      );
      const txtData = await txtRes.json();
      if (txtData.Answer) {
        for (const txt of txtData.Answer) {
          const m = txt.data.replace(/"/g, '').match(/replicaSet=([^&\s]+)/);
          if (m) { replicaSet = m[1]; break; }
        }
      }
    } catch { /* TXT optional */ }

    // Build a standard mongodb:// URI (no SRV, no port-53 needed)
    const params = new URLSearchParams({
      ssl: 'true',
      authSource: 'admin',
      appName: 'Bantydansena',
    });
    if (replicaSet) params.set('replicaSet', replicaSet);

    process.env.MONGODB_URI = `mongodb://${user}:${encodeURIComponent(pass)}@${hosts}/?${params.toString()}`;
    console.log('\x1b[32m✔ MongoDB URI resolved via Google DoH\x1b[0m');
    console.log(`\x1b[36m→ Hosts: ${hosts}\x1b[0m`);
  } catch (err) {
    console.error('\x1b[31m✖ DoH resolution failed, using original SRV URI:\x1b[0m', (err as Error).message);
  }
}
