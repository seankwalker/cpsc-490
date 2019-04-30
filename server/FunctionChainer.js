import fs from "fs";
import path from "path";

const AUTHOR_STRING = "Sean Walker <sean.walker@yale.edu>";

// imports common to all service chains
const BOILERPLATE =
    "#![feature(box_syntax)] extern crate netbricks;use netbricks::config::{basic_opts, read_matches};" +
    "use netbricks::interface::*;use netbricks::operators::*;use netbricks::scheduler::*;use std::env;" +
    "use std::fmt::Display;use std::sync::Arc;use std::thread;use std::time::Duration;";

const supportedNetworkFunctions = { mme: true, nat: true };

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
    let mainFunctionBoilerplate = BOILERPLATE;
    let mainFunctionContents = `\nfn test<T, S>(ports: Vec<T>, sched: &mut S)
    where
        T: PacketRx + PacketTx + Display + Clone + 'static,
        S: Scheduler + Sized,
    {
        println!("receiving started...");
        let pipelines: Vec<_> = ports
            .iter()`;

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
        mainFunctionBoilerplate += `use ${nf.name}::${nf.name};mod ${nf.name};`;
    }

    // all members of service chain are ready

    // a NetBricks NF service chain simply passes the RX traffic and passes
    // it through each function in series, since each one returns a
    // `CompositionBatch`.
    // thus, there should be one "main" file which chains them all together,
    // as well as files for each of the function definitions

    // build main function
    mainFunctionContents += `
            .send(port.clone()))
            .collect();

        println!("running {} pipelines...", pipelines.len());
        for pipeline in pipelines {
            sched.add_task(pipeline).unwrap();
        }
    }

    fn main() {
        // parse command-line arguments
        let opts = basic_opts();
        let args: Vec<String> = env::args().collect();
        let matches = match opts.parse(&args[1..]) {
            Ok(m) => m,
            Err(e) => panic!(e.to_string()),
        };
        // build netbricks configuration and context
        let configuration = read_matches(&matches, &opts);

        match initialize_system(&configuration) {
            Ok(mut context) => {
                context.start_schedulers();
                context.add_pipeline_to_run(Arc::new(move |p, s: &mut StandaloneScheduler| test(p, s)));
                context.execute();

                loop {
                    // do nothing
                }
            }
            Err(e) => {
                panic!(e.to_string());
            }
        }
    }`;

    console.log("service chain assembled!");
    const mainFunctionFd = fs.openSync(mainFunctionPath, "w");
    fs.writeSync(mainFunctionFd, mainFunctionBoilerplate);
    fs.writeSync(mainFunctionFd, mainFunctionContents);
    fs.closeSync(mainFunctionFd);

    // write `Cargo.toml` for service chain

    // TODO: what if the NF requires more dependencies?
    // -> should be able to pull them from each NF's Cargo.toml deps...
    const cargoContents = `[package]
    name = "${serviceChainName}"
    version = "0.1.0"
    authors = ["${AUTHOR_STRING}"]

    [dependencies]
    netbricks = { path = "../../framework", features = ["performance"] }`;

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
