# Smart Contracts for Web3 Voting Platform

This directory contains the smart contracts for the Web3 Voting Platform. These contracts should be deployed to the Celo Alfajores testnet.

## Contract Overview

1. **CustomToken.sol**: ERC20 token with additional governance features
2. **TokenFactory.sol**: Factory contract for creating new token instances
3. **Governance.sol**: Contract for creating and managing proposals and votes

## Deployment Instructions

### Using Remix IDE with Celo Alfajores Testnet

1. **Setup Metamask with Celo Alfajores**:
   - Add Celo Alfajores to Metamask:
     - Network Name: Celo Alfajores Testnet
     - RPC URL: https://alfajores-forno.celo-testnet.org
     - Chain ID: 44787
     - Currency Symbol: CELO
     - Block Explorer: https://alfajores.celoscan.io/

2. **Get Testnet CELO**:
   - Visit the Celo faucet: https://faucet.celo.org/alfajores
   - Enter your wallet address and request test CELO

3. **Deploy Contracts in Sequence**:
   - Open Remix IDE: https://remix.ethereum.org/
   - Create new files and paste the contract code
   - Compile contracts with Solidity 0.8.20 or later
   - Connect Remix to Metamask (Injected Provider - Metamask)
   - Deploy contracts in this order:

     a. First, deploy the `CustomToken.sol`:
        - This is only for verification purposes, as we'll use the factory to create tokens

     b. Deploy the `TokenFactory.sol`:
        - No constructor arguments needed
        - Save the deployed contract address

     c. Deploy the `Governance.sol`:
        - No constructor arguments needed
        - Save the deployed contract address

4. **Update Contract Addresses in the Application**:
   - Update the `client/src/lib/contracts.ts` file:
     - Set `TOKEN_FACTORY_ADDRESS` to your deployed TokenFactory address
     - Set `GOVERNANCE_ADDRESS` to your deployed Governance address

## Contract Interaction

After deployment, you can interact with the contracts:

1. **Create a Token**:
   - Use the application UI, or
   - Call the `createToken` function on the TokenFactory contract with:
     - name: Token name
     - symbol: Token symbol
     - initialSupply: The initial token supply (e.g., 1000000)
     - decimals: Number of decimals (usually 18)
     - transferable: Whether tokens can be transferred (true/false)

2. **Create a Proposal**:
   - Use the application UI, or
   - Call the `createProposal` function on the Governance contract with:
     - title: Proposal title
     - description: Proposal description
     - tokenAddress: Address of the token to use for voting
     - duration: Duration in seconds (e.g., 604800 for 7 days)
     - quorumPercent: Required participation percentage (e.g., 10 for 10%)

3. **Vote on a Proposal**:
   - Use the application UI, or
   - Call the `castVote` function on the Governance contract with:
     - proposalId: ID of the proposal to vote on
     - support: true to vote in favor, false to vote against

## Contract Verification

After deployment, you can verify your contracts on Celoscan for better transparency:

1. Visit https://alfajores.celoscan.io/
2. Search for your contract address
3. Go to the "Contract" tab
4. Click "Verify and Publish"
5. Select the compiler version (0.8.20)
6. Paste your flattened contract code
7. Submit and verify
