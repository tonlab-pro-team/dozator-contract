import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from "@ton/core";
import { Op } from "./Op";

export type JettonWalletConfig = {};

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
    return beginCell().endCell();
}

export class JettonWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new JettonWallet(address);
    }

    static createFromConfig(
        config: JettonWalletConfig,
        code: Cell,
        workchain = 0
    ) {
        const data = jettonWalletConfigToCell(config);
        const init = { code, data };
        return new JettonWallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getJettonBalance(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type !== "active") {
            return 0n;
        }
        let res = await provider.get("get_wallet_data", []);
        return res.stack.readBigNumber();
    }
    static transferMessage(
        jetton_amount: bigint,
        to: Address,
        responseAddress: Address,
        customPayload: Cell,
        forward_ton_amount: bigint,
        forwardPayload: Cell
    ) {
        return beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(0, 64) // op, queryId
            .storeCoins(jetton_amount)
            .storeAddress(to)
            .storeAddress(responseAddress)
            .storeMaybeRef(customPayload)
            .storeCoins(forward_ton_amount)
            .storeMaybeRef(forwardPayload)
            .endCell();
    }
    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jetton_amount: bigint,
        to: Address,
        responseAddress: Address,
        customPayload: Cell,
        forward_ton_amount: bigint,
        forwardPayload: Cell
    ) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.transferMessage(
                jetton_amount,
                to,
                responseAddress,
                customPayload,
                forward_ton_amount,
                forwardPayload
            ),
            value: value,
        });
    }
    /*
      burn#595f07bc query_id:uint64 amount:(VarUInteger 16)
                    response_destination:MsgAddress custom_payload:(Maybe ^Cell)
                    = InternalMsgBody;
    */
    static burnMessage(
        jetton_amount: bigint,
        responseAddress: Address,
        customPayload: Cell
    ) {
        return beginCell()
            .storeUint(0x595f07bc, 32)
            .storeUint(0, 64) // op, queryId
            .storeCoins(jetton_amount)
            .storeAddress(responseAddress)
            .storeMaybeRef(customPayload)
            .endCell();
    }

    async sendBurn(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jetton_amount: bigint,
        responseAddress: Address,
        customPayload: Cell
    ) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.burnMessage(
                jetton_amount,
                responseAddress,
                customPayload
            ),
            value: value,
        });
    }
    /*
      withdraw_tons#107c49ef query_id:uint64 = InternalMsgBody;
    */
    static withdrawTonsMessage() {
        return beginCell()
            .storeUint(0x6d8e5e3c, 32)
            .storeUint(0, 64) // op, queryId
            .endCell();
    }

    async sendWithdrawTons(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.withdrawTonsMessage(),
            value: toNano("0.1"),
        });
    }
    /*
      withdraw_jettons#10 query_id:uint64 wallet:MsgAddressInt amount:Coins = InternalMsgBody;
    */
    static withdrawJettonsMessage(from: Address, amount: bigint) {
        return beginCell()
            .storeUint(0x768a50b2, 32)
            .storeUint(0, 64) // op, queryId
            .storeAddress(from)
            .storeCoins(amount)
            .storeMaybeRef(null)
            .endCell();
    }

    async sendWithdrawJettons(
        provider: ContractProvider,
        via: Sender,
        from: Address,
        amount: bigint
    ) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.withdrawJettonsMessage(from, amount),
            value: toNano("0.1"),
        });
    }

    /*
     transfer_notification query_id:uint64 amount:(VarUInteger 16)
           sender:MsgAddress forward_payload:(Either Cell ^Cell)
           = InternalMsgBody;
    */
    static notificationMessage(
        amount: bigint,
        sender: Address,
        forwardPayload?: Cell
    ) {
        return beginCell()
            .storeUint(0x7362d09c, 32)
            .storeUint(0, 64) // op, queryId
            .storeCoins(amount)
            .storeAddress(sender)
            .storeMaybeRef(forwardPayload)
            .endCell();
    }
    /*
    internal_transfer  query_id:uint64 amount:(VarUInteger 16) from:MsgAddress
           response_address:MsgAddress
           forward_ton_amount:(VarUInteger 16)
           forward_payload:(Either Cell ^Cell)
           = InternalMsgBody;
    */

    static internalTransferMessage(
        amount: bigint,
        from: Address,
        responseAddress: Address,
        forward_ton_amount: bigint,
        forwardPayload?: Cell
    ) {
        return beginCell()
            .storeUint(Op.internal_transfer, 32)
            .storeUint(0, 64) // queryId
            .storeCoins(amount)
            .storeAddress(from)
            .storeAddress(responseAddress)
            .storeCoins(forward_ton_amount)
            .storeMaybeRef(forwardPayload)
            .endCell();
    }
}
