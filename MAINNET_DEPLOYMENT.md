# Celo Mainnet Deployment Checklist

## Prerequisites
- [ ] Wallet with sufficient CELO tokens for deployment gas fees
- [ ] Private key or seed phrase for deployment wallet (safeguard this information)
- [ ] Updated deployment configuration to point to Celo mainnet (RPC: https://forno.celo.org)

## Deployment Steps

### 1. Deploy TokenFactory Contract
```bash
# Example if using Hardhat
npx hardhat run scripts/deploy_token_factory.js --network celo-mainnet
```

- [ ] Record the deployed TokenFactory address: __________________________

### 2. Deploy Governance Contract
```bash
# Example if using Hardhat
# Pass the TokenFactory address as an argument to your deployment script
npx hardhat run scripts/deploy_governance.js --network celo-mainnet --factory <TokenFactory Address>
```

- [ ] Record the deployed Governance address: __________________________

### 3. Update Contract Addresses

Update the following values in `client/src/lib/contracts.ts`:

```javascript
// Mainnet deployed contract addresses
export const TOKEN_FACTORY_ADDRESS = "0x..."; // Your mainnet TokenFactory address
export const GOVERNANCE_ADDRESS = "0x..."; // Your mainnet Governance address
```

### 4. Test Mainnet Deployment

- [ ] Create a new token on mainnet
- [ ] Check token balance
- [ ] Create a proposal using the token
- [ ] Cast votes on the proposal

### 5. Deploy Frontend Application

- [ ] Deploy frontend application with updated contract addresses
- [ ] Verify all functionality works with mainnet deployment

## Security Considerations

- Always double-check contract addresses before deploying
- Consider having your contracts audited before mainnet deployment if they handle significant value
- Monitor your deployed contracts for any unexpected behavior
- Consider implementing contract upgradeability for critical fixes
