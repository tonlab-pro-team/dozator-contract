import {
    Blockchain,
    BlockchainSnapshot,
    SandboxContract,
    TreasuryContract,
} from "@ton/sandbox";
import { Address, Cell, fromNano, toNano } from "@ton/core";
import { Dozator } from "../wrappers/Dozator";
import "@ton/test-utils";
import { compile } from "@ton/blueprint";
import { JettonMinter } from "../wrappers/JettonMinter";
import { JettonWallet } from "../wrappers/JettonWallet";
import { randomAddress } from "@ton/test-utils";
import { Op } from "../wrappers/Op";

type DestinationData = {
    address: Address;
    amount: bigint;
    period: number;
};

const a: DestinationData = {
    address: Address.parse("EQCqNTwAYUNhPFS0RgqZoTLGJcQQxbAJ7csUo4YO3_TONLab"),
    amount: 2000000000000n,
    period: 1209000,
};
const b: DestinationData = {
    address: Address.parse("EQCL3DmCynaRK7-vsfeNmd4Jj-UxAIHPvA4qS2xwaL6UpLbF"),
    amount: 2400000000000n,
    period: 7776000,
};
const c: DestinationData = {
    address: Address.parse("EQDbU1SVEjBE73oUqgAoM9gDcShUkM5EC2PgoCjuwVUKo-Ee"),
    amount: 98893800000000n,
    period: 157680000,
};

const SEND_COST = toNano("0.21");

describe("Dozator", () => {
    let code: Cell;

    let blockchain: Blockchain;
    let dozator: SandboxContract<Dozator>;
    let deployer: SandboxContract<TreasuryContract>;

    const mintAmount = toNano("7777777");
    let jminter: SandboxContract<JettonMinter>;
    let jwallet: SandboxContract<JettonWallet>;

    beforeAll(async () => {
        code = await compile("Dozator");

        const jminter_code = Cell.fromBoc(
            Buffer.from(
                "b5ee9c7241020d0100029c000114ff00f4a413f4bcf2c80b0102016202030202cc040502037a600b0c02f1d906380492f81f000e8698180b8d8492f81f07d207d2018fd0018b8eb90fd0018fd001801698fe99ff6a2687d007d206a6a18400aa9385d47199a9a9b1b289a6382f97024817d207d006a18106840306b90fd001812881a282178050a502819e428027d012c678b666664f6aa7041083deecbef29385d7181406070093b5f0508806e0a84026a8280790a009f404b19e2c039e2d99924591960225e801e80196019241f200e0e9919605940f97ff93a0ef003191960ab19e2ca009f4042796d625999992e3f60101c036373701fa00fa40f82854120670542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05006c705f2e04aa1034545c85004fa0258cf16ccccc9ed5401fa403020d70b01c300915be30d0801a682102c76b9735270bae30235373723c0038e1a335035c705f2e04903fa403059c85004fa0258cf16ccccc9ed54e03502c0048e185124c705f2e049d4304300c85004fa0258cf16ccccc9ed54e05f05840ff2f009003e8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb0001fe365f03820898968015a015bcf2e04b02fa40d3003095c821cf16c9916de28210d1735400708018c8cb055005cf1624fa0214cb6a13cb1f14cb3f23fa443070ba8e33f828440370542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d0cf16966c227001cb01e2f4000a000ac98040fb00007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e840001faf16f6a2687d007d206a6a183faa9040ef7c997d",
                "hex"
            )
        )[0];
        const jwallet_code = Cell.fromBoc(
            Buffer.from(
                "b5ee9c7241021101000323000114ff00f4a413f4bcf2c80b0102016202030202cc0405001ba0f605da89a1f401f481f481a8610201d40607020120080900c30831c02497c138007434c0c05c6c2544d7c0fc03383e903e900c7e800c5c75c87e800c7e800c1cea6d0000b4c7e08403e29fa954882ea54c4d167c0278208405e3514654882ea58c511100fc02b80d60841657c1ef2ea4d67c02f817c12103fcbc2000113e910c1c2ebcb853600201200a0b0083d40106b90f6a2687d007d207d206a1802698fc1080bc6a28ca9105d41083deecbef09dd0958f97162e99f98fd001809d02811e428027d012c678b00e78b6664f6aa401f1503d33ffa00fa4021f001ed44d0fa00fa40fa40d4305136a1522ac705f2e2c128c2fff2e2c254344270542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c920f9007074c8cb02ca07cbffc9d004fa40f40431fa0020d749c200f2e2c4778018c8cb055008cf1670fa0217cb6b13cc80c0201200d0e009e8210178d4519c8cb1f19cb3f5007fa0222cf165006cf1625fa025003cf16c95005cc2391729171e25008a813a08209c9c380a014bcf2e2c504c98040fb001023c85004fa0258cf1601cf16ccc9ed5402f73b51343e803e903e90350c0234cffe80145468017e903e9014d6f1c1551cdb5c150804d50500f214013e809633c58073c5b33248b232c044bd003d0032c0327e401c1d3232c0b281f2fff274140371c1472c7cb8b0c2be80146a2860822625a019ad822860822625a028062849e5c412440e0dd7c138c34975c2c0600f1000d73b51343e803e903e90350c01f4cffe803e900c145468549271c17cb8b049f0bffcb8b08160824c4b402805af3cb8b0e0841ef765f7b232c7c572cfd400fe8088b3c58073c5b25c60063232c14933c59c3e80b2dab33260103ec01004f214013e809633c58073c5b3327b552000705279a018a182107362d09cc8cb1f5230cb3f58fa025007cf165007cf16c9718010c8cb0524cf165006fa0215cb6a14ccc971fb0010241023007cc30023c200b08e218210d53276db708010c8cb055008cf165004fa0216cb6a12cb1f12cb3fc972fb0093356c21e203c85004fa0258cf1601cf16ccc9ed5495eaedd7",
                "hex"
            )
        )[0];

        blockchain = await Blockchain.create();
        blockchain.now = 100;
        deployer = await blockchain.treasury("deployer");

        dozator = blockchain.openContract(Dozator.createFromConfig({}, code));

        jminter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    admin: deployer.address,
                    content: Cell.EMPTY,
                    wallet_code: jwallet_code,
                },
                jminter_code
            )
        );

        const mintResult = await jminter.sendMint(
            deployer.getSender(),
            dozator.address,
            mintAmount
        );
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jminter.address,
            success: true,
        });

        const jwalletAddress = await jminter.getWalletAddress(dozator.address);
        jwallet = blockchain.openContract(
            JettonWallet.createFromAddress(jwalletAddress)
        );
        const balance = await jwallet.getJettonBalance();
        expect(balance).toEqual(mintAmount);
    });

    it("should deploy jettons and mint to dozator", async () => {});

    it("should topup the dozator", async () => {
        const topupResult = await dozator.sendTopup(
            deployer.getSender(),
            toNano("1")
        );
        expect(topupResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dozator.address,
            deploy: true,
            success: true,
        });
    });

    it("should have pre-init data", async () => {
        const jwalletAddress = await dozator.getWalletAddress();
        expect(jwalletAddress).toBe(null);
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual({
            a: 0,
            b: 0,
            c: 0,
        });
    });

    it("should not pay if not inited", async () => {
        const nextPayouts = await dozator.getNextPayouts();
        const now = blockchain.now || 0;
        expect(nextPayouts.a).toBeLessThan(now);
        try {
            const callResult = await dozator.sendCallDoze();
            expect(callResult.transactions).toHaveTransaction({
                from: undefined,
                on: dozator.address,
                success: false,
                exitCode: 92,
            });
        } catch (e) {}
    });

    let uninited: BlockchainSnapshot;
    it("should init", async () => {
        uninited = blockchain.snapshot();
        const deployResult = await dozator.sendDeploy(
            deployer.getSender(),
            jwallet.address,
            toNano("0.05")
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dozator.address,
            success: true,
            endStatus: "active",
        });
    });

    let remNextPayouts: { a: number; b: number; c: number };
    it("should have correct next payouts", async () => {
        const now = blockchain.now || 0;
        remNextPayouts = {
            a: now + a.period,
            b: now + b.period,
            c: now + c.period,
        };
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual(remNextPayouts);
    });

    it("should have the correct wallet address", async () => {
        const walletAddress = await dozator.getWalletAddress();
        expect(walletAddress?.equals(jwallet.address)).toBe(true);
    });

    it("should not init twice", async () => {
        const deployTwiceResult = await dozator.sendDeploy(
            deployer.getSender(),
            randomAddress(),
            toNano("0.05")
        );
        expect(deployTwiceResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dozator.address,
            success: true, // just accept message
        });
        // nothing should change
        const walletAddress = await dozator.getWalletAddress();
        expect(walletAddress?.equals(jwallet.address)).toBe(true);
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual(remNextPayouts);
    });

    it("should not pay if not enough time passed", async () => {
        const now = blockchain.now || 0;
        // contract checks for `last < now + a.period` - strict less
        // so 1 more second required
        blockchain.now = now + a.period;
        try {
            const callResult = await dozator.sendCallDoze();
            expect(callResult.transactions).toHaveTransaction({
                from: undefined,
                on: dozator.address,
                success: false,
                exitCode: 91,
            });
        } catch (e) {
            // external was not accepted - ok.
        }
    });

    it("should allow to pay if enough time passed", async () => {
        const now = blockchain.now || 0;
        blockchain.now = now + 1;
        const callResult = await dozator.sendCallDoze();
        expect(callResult.transactions).toHaveTransaction({
            from: undefined,
            on: dozator.address,
            success: true,
            outMessagesCount: 1,
        });
        remNextPayouts.a += a.period + 1;

        // transfer request to wallet
        expect(callResult.transactions).toHaveTransaction({
            from: dozator.address,
            to: jwallet.address,
            op: Op.transfer,
            success: true,
        });

        const a_jwallet = await jminter.getWalletAddress(a.address);

        // notification and excesses
        expect(callResult.transactions).toHaveTransaction({
            from: a_jwallet,
            to: a.address,
            op: Op.excesses,
        });
        expect(callResult.transactions).toHaveTransaction({
            from: a_jwallet,
            to: a.address,
            op: Op.transfer_notification,
        });
    });

    it("should update next payouts", async () => {
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual(remNextPayouts);
    });

    it("should pay 3 at a time", async () => {
        const now = remNextPayouts.c + 1;
        blockchain.now = now;

        const jbalancesBefore: bigint[] = [];
        for (const dest of [a, b, c]) {
            const dest_jwallet = blockchain.openContract(
                JettonWallet.createFromAddress(
                    await jminter.getWalletAddress(dest.address)
                )
            );
            jbalancesBefore.push(await dest_jwallet.getJettonBalance());
        }

        const callResult = await dozator.sendCallDoze();
        expect(callResult.transactions).toHaveTransaction({
            from: undefined,
            on: dozator.address,
            success: true,
            outMessagesCount: 3,
        });
        remNextPayouts = {
            a: now + a.period,
            b: now + b.period,
            c: now + c.period,
        };
        for (const dest of [a, b, c]) {
            const dest_jwallet = blockchain.openContract(
                JettonWallet.createFromAddress(
                    await jminter.getWalletAddress(dest.address)
                )
            );
            expect(callResult.transactions).toHaveTransaction({
                from: jwallet.address,
                to: dest_jwallet.address,
                op: Op.internal_transfer,
                success: true,
            });
            expect(callResult.transactions).toHaveTransaction({
                from: dest_jwallet.address,
                to: dest.address,
                op: Op.excesses,
            });
            const balanceInc =
                (await dest_jwallet.getJettonBalance()) -
                jbalancesBefore.shift()!;
            expect(balanceInc).toEqual(dest.amount);
        }
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual(remNextPayouts);
    });

    it("should not decrease balance if message is not accepted", async () => {
        const { balance: balanceBefore } = await blockchain.getContract(
            dozator.address
        );
        for (let i = 0; i < 10; i++) {
            try {
                const callResult = await dozator.sendCallDoze();
                expect(callResult.transactions).toHaveTransaction({
                    from: undefined,
                    on: dozator.address,
                    success: false,
                    exitCode: 91,
                });
            } catch (e) {}
        }
        const { balance: balanceAfter } = await blockchain.getContract(
            dozator.address
        );
        expect(balanceAfter).toEqual(balanceBefore);
    });

    it("should fail if balance is not enough", async () => {
        const { balance } = await blockchain.getContract(dozator.address);
        expect(balance).toBeLessThan(SEND_COST * 2n);
        const nextPayouts = await dozator.getNextPayouts();
        const timeForTwoSends = nextPayouts.b + 1;
        blockchain.now = timeForTwoSends;

        try {
            await dozator.sendCallDoze(); // storage fee spend
            throw new Error("should fail");
        } catch (e) {}

        const { balance: balanceBefore } = await blockchain.getContract(
            dozator.address
        );
        try {
            const callResult = await dozator.sendCallDoze();
            expect(callResult.transactions).toHaveTransaction({
                from: undefined,
                on: dozator.address,
                success: false,
                exitCode: 93,
            });
        } catch (e) {}
        const { balance: balanceAfter } = await blockchain.getContract(
            dozator.address
        );
        expect(balanceAfter).toEqual(balanceBefore);
    });

    it("should init with custom zero_time", async () => {
        await blockchain.loadFrom(uninited);
        const zero_time = 500;
        const deployResult = await dozator.sendDeploy(
            deployer.getSender(),
            jwallet.address,
            toNano("0.05"),
            zero_time
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            on: dozator.address,
            success: true,
        });
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual({
            a: zero_time + a.period,
            b: zero_time + b.period,
            c: zero_time + c.period,
        });
    });

    it("should init with custom zero_time when it passed", async () => {
        await blockchain.loadFrom(uninited);
        blockchain.now = 400;
        const zero_time = 200;
        const deployResult = await dozator.sendDeploy(
            deployer.getSender(),
            jwallet.address,
            toNano("0.05"),
            zero_time
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            on: dozator.address,
            success: true,
        });
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual({
            a: zero_time + a.period,
            b: zero_time + b.period,
            c: zero_time + c.period,
        });
    });

    it("should init with zero_time = 0 and schedule from now", async () => {
        await blockchain.loadFrom(uninited);
        blockchain.now = 100;

        const deployResult = await dozator.sendDeploy(
            deployer.getSender(),
            jwallet.address,
            toNano("0.05"),
            0
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            on: dozator.address,
            success: true,
        });
        const nextPayouts = await dozator.getNextPayouts();
        expect(nextPayouts).toEqual({
            a: blockchain.now + a.period,
            b: blockchain.now + b.period,
            c: blockchain.now + c.period,
        });
    });

    it("should not init if there are extra bits in message", async () => {
        await blockchain.loadFrom(uninited);
        const deployResult = await dozator.sendInternal(
            deployer.getSender(),
            Dozator.initMessage(jwallet.address, 0)
                .asBuilder()
                .storeBit(1)
                .endCell(),
            toNano("0.05")
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            on: dozator.address,
            success: false,
            exitCode: 9,
        });
    });
});
