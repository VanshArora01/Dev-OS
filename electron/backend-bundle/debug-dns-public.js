const dns = require('dns');
const { Resolver } = dns;
const resolver = new Resolver();

// Using Google's public DNS
resolver.setServers(['8.8.8.8', '8.8.4.4']);

const hostname = '_mongodb._tcp.cluster0.q66shap.mongodb.net';

console.log('Attempting SRV lookup using Google DNS...');

resolver.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('SRV lookup failed with Google DNS:', err);
        return;
    }
    console.log('SRV Records found:', JSON.stringify(addresses, null, 2));

    addresses.forEach(addr => {
        resolver.resolve4(addr.name, (err, ips) => {
            if (err) {
                console.error(`Failed to resolve IP for ${addr.name}:`, err);
            } else {
                console.log(`IPs for ${addr.name}:`, ips);
            }
        });
    });
});
