const vault = require('node-vault')({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR,
    requestOptions: {
        timeout: 5000,
        proxy: false,
        followAllRedirects: true,
        rejectUnauthorized: process.env.NODE_ENV === 'production' // Verify SSL in production
    }
});

class VaultService {
    constructor() {
        this.token = process.env.VAULT_TOKEN;
    }

    async getSecrets(path) {
        try {
            await vault.tokenRenew({ token: this.token });
            const { data } = await vault.read(`secret/data/${path}`);
            return data.data;
        } catch (error) {
            console.error('Vault error:', error);
            throw new Error('Could not fetch secrets');
        }
    }

    async healthCheck() {
        try {
            const health = await vault.health();
            return health.initialized && health.sealed === false;
        } catch (error) {
            console.error('Vault health check failed:', error);
            return false;
        }
    }
}

module.exports = new VaultService();