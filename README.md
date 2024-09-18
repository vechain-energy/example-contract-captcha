# Deploy Contract on TestNet

```shell
cd contracts
npm install --legacy-peer-deps
echo "PRIVATE_KEY=0x$(openssl rand -hex 32)" > .env
npx hardhat deploy --network vechain_testnet
echo "Contract Deployed at:"
jq ".address" deployments/vechain_testnet/CaptchaVerifier.json
```

# Run Backend Signer as local CloudFlare Worker in Development

* Adjust `backend-signer/wrangler.toml` to your needs (CONTRACT_ADDRESS!)

```shell
cd backend-signer
npm install
wrangler dev
```

# Run Frontend Web App

* Adjust `web-app/.env.local` to your needs (CONTRACT_ADDRESS!)

```shell
cd web-app
npm install
npm start
```

Open: http://localhost:1234

- Connect Wallet
- Click on "Transact with Contract"


# Todos

- [ ] Documentation / Explanation
- [ ] Adjust `CaptchaVerifier.sol` to store required signer in local contract
- [ ] Document a better (safer) way to store the env variables (wrangler secret for example)
- [ ] Add CloudFlare Turnstile documentation