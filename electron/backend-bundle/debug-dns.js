const dns = require('dns');

const hostname = '_mongodb._tcp.cluster0.q66shap.mongodb.net';

dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('SRV lookup failed:', err);
        return;
    }
    console.log('SRV Records found:', JSON.stringify(addresses, null, 2));

    addresses.forEach(addr => {
        dns.resolve4(addr.name, (err, ips) => {
            if (err) {
                console.error(`Failed to resolve IP for ${addr.name}:`, err);
            } else {
                console.log(`IPs for ${addr.name}:`, ips);
            }
        });
    });
});
