// written to `Cargo.toml` for the service chain
const AUTHOR = "Sean Walker <sean.walker@yale.edu>";

// standard imports for all service chains
const TOP_BOILERPLATE = `#![feature(box_syntax)]
extern crate netbricks;
use netbricks::config::{basic_opts, read_matches};
use netbricks::interface::*;
use netbricks::operators::*;
use netbricks::scheduler::*;
use std::env;
use std::fmt::Display;
use std::sync::Arc;
use std::thread;
use std::time::Duration;`;

const MAIN_START = `\nfn test<T, S>(ports: Vec<T>, sched: &mut S)
where
    T: PacketRx + PacketTx + Display + Clone + 'static,
    S: Scheduler + Sized,
{
    println!("receiving started...");
    let pipelines: Vec<_> = ports
        .iter()`;

const MAIN_END = `
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

const CARGO_BOILERPLATE = `[package]
name = "${serviceChainName}"
version = "0.1.0"
authors = ["${AUTHOR_STRING}"]

[dependencies]
netbricks = { path = "../../framework", features = ["performance"] }`;

export { AUTHOR, TOP_BOILERPLATE, MAIN_START, MAIN_END, CARGO_BOILERPLATE };
