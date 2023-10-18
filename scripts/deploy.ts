import { Address, toNano } from "@ton/core";
import { Dozator } from "../wrappers/Dozator";
import { compile, NetworkProvider } from "@ton/blueprint";
import { JettonMinter } from "../wrappers/JettonMinter";

const marga = "EQBjEw-SOe8yV2kIbGVZGrsPpLTaaoAOE87CGXI2ca4XdzXA";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const jminterAddress = Address.parse(
        (await ui.input("Enter jminter address (empty for MARGA)")) || marga
    );
    const jminter = provider.open(
        JettonMinter.createFromAddress(jminterAddress)
    );

    const dozator = provider.open(
        Dozator.createFromConfig({}, await compile("Dozator"))
    );

    const jwallet = await jminter.getWalletAddress(dozator.address);

    await dozator.sendDeploy(provider.sender(), jwallet, toNano("0.05"));

    await provider.waitForDeploy(dozator.address);

    ui.write(
        "Dozator has been successfully deployed on address: " +
            dozator.address.toString()
    );
    ui.write("It's Jetton wallet address: " + jwallet.toString());
}
