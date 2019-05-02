/**
 * FunctionChainer.js
 * Sean Walker
 * CPSC 490
 * Implements a function to, given a list of virtual network functions (VNFs),
 * create a NetBricks source file to run the specified functions in chain.
 */

import fs from "fs";
import path from "path";
import { TOP_BOILERPLATE, MAIN_START, MAIN_END } from "./boilerplate";

// TODO: parse through NetBricks test/ directory and complete list of supported
// VNFs
const supportedNetworkFunctions = { mme: true, nat: true };

// creates NF chain source file from `graph`
const functionChainer = graph => {
    // check if an identical service chain has already been built
    const nfNames = [];
    for (let i = 0; i < graph.length; i++) {
        nfNames.push(graph[i].name);
    }
    const serviceChainName = nfNames.join("-");

    // ../NetBricks/cpsc-490/nat-mme/main.rs
    const mainFunctionPath = path.join(
        "..",
        "NetBricks",
        "cpsc-490",
        serviceChainName,
        "src",
        "main.rs"
    );
    try {
        fs.accessSync(mainFunctionPath);
        return serviceChainName;
    } catch (err) {}

    // if not, build it
    let mainFunctionBoilerplate = TOP_BOILERPLATE;
    let mainFunctionContents = MAIN_START;
    let cargoAuthors = new Set();
    let cargoDeps = new Set();

    for (let i = 0; i < graph.length; i++) {
        // each node in the graph is the next function in the service chain
        const nf = graph[i];

        // ensure the specified function is supported
        if (!supportedNetworkFunctions[nf.name]) {
            console.log(
                "[functionChainer] error: requested function",
                nf.name,
                "was specified but not supported"
            );
            return false;
        }

        // make the directory for this service chain if it doesn't already exist
        const nfDestDir = path.join(
            "..",
            "NetBricks",
            "cpsc-490",
            serviceChainName,
            "src"
        );
        try {
            fs.mkdirSync(nfDestDir, { recursive: true });
        } catch (err) {}

        // build the NF file if it doesn't already exist
        // ../NetBricks/cpsc-490/nat-mme/mme.rs
        const nfDestPath = path.join(
            "..",
            "NetBricks",
            "cpsc-490",
            serviceChainName,
            "src",
            nf.name + ".rs"
        );

        try {
            fs.accessSync(nfDestPath);
        } catch (err) {
            // ../NetBricks/test/mme/src/nf.rs
            const nfSrcPath = path.join(
                "..",
                "NetBricks",
                "test",
                nf.name,
                "src",
                "nf.rs"
            );
            fs.copyFileSync(nfSrcPath, nfDestPath);
        }

        // append this nf to the service chain in the main function
        mainFunctionContents += `.map(|port| ${
            nf.name
        }(ReceiveBatch::new(port.clone()))`;
        mainFunctionBoilerplate += `use ${nf.name}::${nf.name};\nmod ${
            nf.name
        };\n`;

        // retrieve dependencies and authorship info from source NF Cargo.toml
        const srcCargoPath = path.join(
            "..",
            "NetBricks",
            "test",
            nf.name,
            "Cargo.toml"
        );
        const srcCargoContents = fs.readFileSync(srcCargoPath, "utf-8");
        let cargoLines = srcCargoContents.split("\n");
        let parsingDeps = false;
        for (let i = 0; i < cargoLines.length; i++) {
            const trimmed = cargoLines[i].trim();
            const leftSide = trimmed.split(" ", 1)[0];
            const rightSide = trimmed
                .split(" ")
                .slice(2)
                .join(" ");

            if (parsingDeps) {
                // dependency-name = dependency
                cargoDeps.add([leftSide, rightSide]);
            } else {
                if (leftSide !== "authors") {
                    if (leftSide === "[dependencies]") {
                        parsingDeps = true;
                    }
                    continue;
                }

                // authors = ["First Last <email>, First2 Last2 <email2> {...}"]
                // chop of the brackets and quotes on either side
                cargoAuthors.add(rightSide.slice(2, -2));
            }
        }
    }

    // all members of service chain are ready

    // a NetBricks NF service chain simply passes the RX traffic and passes
    // it through each function in series, since each one returns a
    // `CompositionBatch`.
    // thus, there should be one "main" file which chains them all together,
    // as well as files for each of the function definitions

    // build main function
    mainFunctionContents += MAIN_END;
    console.log("service chain assembled!");
    const mainFunctionFd = fs.openSync(mainFunctionPath, "w");
    fs.writeSync(mainFunctionFd, mainFunctionBoilerplate);
    fs.writeSync(mainFunctionFd, mainFunctionContents);
    fs.closeSync(mainFunctionFd);

    // write `Cargo.toml` for service chain

    // TODO: what if the NF requires more dependencies?
    // -> should be able to pull them from each NF's Cargo.toml deps...
    const authors = Array.from(cargoAuthors).join(" ");
    let cargoContents = `
[package]
name = "${serviceChainName}"
version = "0.1.0"
authors = ["${authors}"]

[dependencies]
`;

    const deps = Array.from(cargoDeps);
    for (let i = 0; i < deps.length; i++) {
        cargoContents += deps[i].join(" = ") + "\n";
    }

    const cargoPath = path.join(
        "..",
        "NetBricks",
        "cpsc-490",
        serviceChainName,
        "Cargo.toml"
    );
    const cargoFd = fs.openSync(cargoPath, "w");
    fs.writeSync(cargoFd, cargoContents);

    console.log("saved to file", mainFunctionPath);

    return serviceChainName;
};

export default functionChainer;
export { supportedNetworkFunctions };
