const dns = require('dns');
const { Resolver } = dns;
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);

const shards = [
    'cluster0-shard-00-00.q66shap.mongodb.net',
    'cluster0-shard-00-01.q66shap.mongodb.net',
    'cluster0-shard-00-02.q66shap.mongodb.net'
];

// Or try to resolve them from the ac- names if they are different
// Let's first try to get the SRV targets again more clearly
resolver.resolveSrv('_mongodb._tcp.cluster0.q66shap.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('SRV lookup failed:', err);
        return;
    }
    console.log('Targets:');
    addresses.forEach(a => console.log(a.name));
});
