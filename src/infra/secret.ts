import Vault from 'node-vault';

const vaultOptions: Vault.VaultOptions = {
  apiVersion: process.env.SECRET_API_VERSION,
  endpoint: process.env.SECRET_API_ENDPOINT,
  token: process.env.SECRET_API_TOKEN,
};

export const secret = Vault(vaultOptions);
