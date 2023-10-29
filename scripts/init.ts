import { Address, toNano } from "@ton/core";
import { Dozator } from "../wrappers/Dozator";
import { NetworkProvider } from "@ton/blueprint";
import { JettonMinter } from "../wrappers/JettonMinter";

const marga = "EQBjEw-SOe8yV2kIbGVZGrsPpLTaaoAOE87CGXI2ca4XdzXA";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const dozatorAddress = Address.parse(
        await ui.input("Enter deployed uninited dozator address")
    );

    const dozator = provider.open(Dozator.createFromAddress(dozatorAddress));

    const setAddr = await dozator.getWalletAddress();
    if (setAddr !== null) {
        ui.write(
            "Dozator has been already inited with wallet address: " +
                setAddr.toString()
        );
        return;
    }

    const jminterAddress = Address.parse(
        (await ui.input("Enter jminter address (empty for MARGA)")) || marga
    );
    const jminter = provider.open(
        JettonMinter.createFromAddress(jminterAddress)
    );

    const jwallet = await jminter.getWalletAddress(dozator.address);

    const zero_time = Number(
        (await ui.input(
            "Enter time to start scheduling (Enter for current):"
        )) || 0
    );

    await dozator.sendDeploy(
        provider.sender(),
        jwallet,
        toNano("0.5"),
        zero_time
    );

    await provider.waitForDeploy(dozator.address);

    ui.write(
        "Dozator has been successfully inited on address: " +
            dozator.address.toString()
    );
    ui.write("It's Jetton wallet address: " + jwallet.toString());
}
