# Dozator contract

Jetton semi-auto Dozator Contract.

A contract that sends \
3 diffrent jetton amounts to \
3 different addresses in \
3 different periods. \
In parallel.

It was created to organize \
the tokenomics of the MARGA jetton.

Semi-auto means that to initiate the payment of tokens, someone needs to send any empty external message to the contract.

Deployed contract: `EQAA33b2hXwfi1HvpVdKHKjkvX4zJroy5nw7uzORnU--BANK`

### Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

### How to use

`yarn start` - run one of the scripts. deploy, scan, call.
`yarn build` - build contract and code hex.
`yarn test` - run tests.

### License

MIT
