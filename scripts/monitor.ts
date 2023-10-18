import { Address } from "@ton/core";
import { Dozator } from "../wrappers/Dozator";
import { NetworkProvider, sleep } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const dozatorAddress = Address.parse(
        await ui.input("Enter dozator address")
    );
    const dozator = provider.open(Dozator.createFromAddress(dozatorAddress));

    while (true) {
        const nextPayouts = await dozator.getNextPayouts();
        const now = Math.floor(Date.now() / 1000);
        const { a, b, c } = {
            a: nextPayouts.a - now,
            b: nextPayouts.b - now,
            c: nextPayouts.c - now,
        };
        ui.write("\n-----------------\n");
        ui.write(
            `Next payouts:\n` +
                `a: at ${nextPayouts.a}, in ${a} seconds\n` +
                `b: at ${nextPayouts.b}, in ${b} seconds\n` +
                `c: at ${nextPayouts.c}, in ${c} seconds`
        );
        const needSome = Math.min(a, b, c) <= 0;
        if (needSome) {
            ui.write(
                "\nDozator is ready to doze! Sending an external message..."
            );
            try {
                await dozator.sendCallDoze();
                ui.write("Sent!");
            } catch {
                ui.write("Code reported failure, but the transaction may pass successfully.");
            }
            await sleep(10000);
        }
        await sleep(4000);
    }
}
