import { beginCell } from "@ton/core";
import { compile, NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const code = await compile("Dozator");
    const data = beginCell()
        .storeUint(0, 48 * 3) // a, b, c - next payment times are 0 at deploy
        .storeAddress(null)
        .endCell();

    ui.write("Code HEX:\n" + code.toBoc().toString("hex"));
    ui.write("Init data HEX:\n" + data.toBoc().toString("hex"));
}
