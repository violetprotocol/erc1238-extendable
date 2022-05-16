# ERC1238 Implementation as Extendable

## Overview

See the original EIP-1238: https://github.com/ethereum/EIPs/issues/1238 describing Non-transferable Tokens (NTTs).

This repository hosts a conversion of [@violetprotocol/ERC1238-token](https://github.com/violetprotocol/ERC1238-token) to the [Extendable framework](https://github.com/violetprotocol/extendable).

## Architecture

### Storage

- **ERC1238Storage**: ERC1238's main storage for balances and `baseURI`.
- **ERC1238ApprovalStorage**: Stores the domain type hash to verify EIP-712 signatures in `ERC1238Approval`
- **ERC1238URIStorage**: Stores `tokenURI`s by token id.
- **ERC1238CollectionStorage**: Stores base id balances (see `ICollectionLogic`).
- **PermissionStorage**: Stores the addresses which have been granted different roles (`rootController`, `intermediateController` and `controller`).

### Badge

Badge.sol is the main Extendable contract, it is responsible for managing the whole lifecycle of non-transferable tokens. It contains custom business logic, specific to Violet and becomes feature-complete after extending it with all the extensions specified below.
It uses `PermissionStorage`, `ERC1238Storage` and `ERC1238ApprovalStorage` during construction.

<br/>

#### Badge Extensions

`ExtendLogic`: Default extension from the Extendable Framework that enables extending.

`BalanceGettersLogic`: Contains the logic to query balances of token owners. It uses `ERC1238Storage`.

`BadgeBaseURILogic`: Contains the logic to query and set the base URI associated with tokens by default. It uses `ERC1238Storage` and has a dependency to the `PermissionLogic`.

`BadgeMintLogic`: Contains the logic to mint tokens and how they can be minted. It uses `ERC1238ApprovalStorage` and `ERC1238Storage`. It has a dependency to `PermissionLogic`, `TokenURISetLogic` and `BadgeBeforeMintLogic`.

`BurnLogic`: Contains the logic to burn tokens and how they can be burnt. It uses `ERC1238Storage`. It has a dependency to `PermissionLogic`, `TokenURISetLogic` and `BeforeBurnLogic`.

`BadgeBeforeMintLogic`: Contains custom logic for what happens before tokens are minted. It has a dependency to the `CollectionLogic`.

`BadgeBeforeBurnLogic`: Contains custom logic for what happens before tokens are burnt. It has a dependency to the `CollectionLogic`.

`TokenURIGetLogic`: Contains the logic to fetch the token URI associated with a token id. It uses `ERC1238URIStorage` and `ERC1238Storage`.

`TokenURISetLogic`: Contains the logic to set the token URI associated with a token id. It uses `ERC1238URIStorage` and has a dependency to the `PermissionLogic`.

`CollectionLogic`: Contains the logic to track balances of token owners for tokens belonging to the same collection, represented by a shared `baseId` ("semi-fungible" tokens). It uses `ERC1238CollectionStorage`.

`PermissionLogic`: Contains the logic to gate execution of some part of the code in other extensions. It uses `PermissionStorage`.

<br/>

## Tools

This repository was generated from Solidity-template, which includes:

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript types for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Waffle](https://github.com/EthWorks/Waffle): tooling for writing comprehensive smart contract tests
- [Solhint](https://github.com/protofire/solhint): linter
- [Solcover](https://github.com/sc-forks/solidity-coverage): code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter

## Usage

### Pre Requisites

Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploying a Badge contract

Deploy the contracts to Hardhat Network:

1. Deploy all required extensions.

```
TS_NODE_FILES=true HARDHAT_NETWORK=localhost ts-node scripts/deployAllExtensions.ts
```

2. Follow the instructions in `/tasks/deploy/deployBadge`.

3. Deploy the badge contract.

```
npx hardhat run --network local deploy:ERC1238-extendable
```

4. Extend with any missing extension using the `extend` hardhat task.

## Syntax Highlighting

If you use VSCode, you can enjoy syntax highlighting for your Solidity code via the [hardhat-vscode](https://github.com/NomicFoundation/hardhat-vscode) extension.
