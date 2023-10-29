import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    external,
    Sender,
    SendMode,
    storeMessage,
} from "@ton/core";

export type DozatorConfig = {};

export function dozatorConfigToCell(config: DozatorConfig): Cell {
    return beginCell()
        .storeUint(0, 48 * 3) // a, b, c - next payment times are 0 at deploy
        .storeAddress(null)
        .endCell();
}

export class Dozator implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new Dozator(address);
    }

    static createFromConfig(config: DozatorConfig, code: Cell, workchain = 0) {
        const data = dozatorConfigToCell(config);
        const init = { code, data };
        return new Dozator(contractAddress(workchain, init), init);
    }

    async sendTopup(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });
    }

    static initMessage(jwallet: Address, zero_time: number) {
        return beginCell()
            .storeAddress(jwallet)
            .storeUint(zero_time, 48)
            .endCell();
    }

    async sendDeploy(
        provider: ContractProvider,
        via: Sender,
        jwallet: Address,
        value: bigint,
        zero_time: number = 0
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Dozator.initMessage(jwallet, zero_time),
        });
    }

    async sendCallDoze(provider: ContractProvider) {
        await provider.external(Cell.EMPTY);
    }

    async sendInternal(
        provider: ContractProvider,
        via: Sender,
        body: Cell,
        value: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    async getCallDozeBoc() {
        const msg = external({ to: this.address, body: Cell.EMPTY });
        return beginCell().store(storeMessage(msg)).endCell().toBoc();
    }

    async getNextPayouts(provider: ContractProvider) {
        const { stack } = await provider.get("get_next_payouts", []);
        return {
            a: stack.readNumber(),
            b: stack.readNumber(),
            c: stack.readNumber(),
        };
    }

    async getWalletAddress(
        provider: ContractProvider
    ): Promise<Address | null> {
        const { stack } = await provider.get("get_jwallet_address", []);
        return stack.readAddressOpt();
    }
}
