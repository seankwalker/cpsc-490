/**
 * server.js
 * Sean Walker
 * CPSC 490
 * Implements a server to dynamically generate virtual network function (VNF)
 * service chains based off of config files, run the service chains in
 * containers, and pass back the MAC address of the container to the calling
 * orchestrator for traffic routing.
 */

import dockerode from "dockerode";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

import ContainerRegistry from "./ContainerRegistry";
import functionChainer, { supportedNetworkFunctions } from "./FunctionChainer";

// max number of clients per container
const MAX_CLIENTS = 3;

// id for NetBricks image
const NB_IMAGE = "seankwalker/cpsc-490-dev";

// port to run server on
const PORT = 3000;

// registry of Docker containers, service chains, remaining capacity
let containers = new ContainerRegistry();

/* FILE UPLOAD SETUP */

// filter out non-JSON file extensions
const jsonFileFilter = (req, f, cb) => {
    let valid = f.originalname.substring(f.originalname.length - 5) === ".json";
    cb(null, valid);
};

// save files with their original name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

/* CONFIG FILE PARSING */

/*
 * Config file format: an array of objects, each representing a VNF
 * The order of objects in the array defines the order of the service chain
 * (i.e. the direction of the VNF graph).
 *
 *  e.g. for a service chain of
 *  Firewall -> Deep Packet Inspection -> Network Address Translation
 *
 *  [
 *      {"name": "firewall"},
 *      {"name": "dpi"},
 *      {"name": "nat"}
 *  ]
 */

// Docker API
const d = new dockerode();

// get container's mac address
const getMACAddress = async container => {
    const containerData = await container.inspect();
    const mac = containerData.NetworkSettings.MacAddress;
    return mac;
};

// parse config file into JS object
const parseConfigFile = async (clientIp, clientPort, contents) => {
    const parsed = JSON.parse(contents);
    console.log("parsed JSON object:", parsed);

    // initialize a Docker container with a service chain respecting the
    // directed graph specified in the config file

    // check if there are any below-capacity containers which are running the
    // specified service chain
    let candidates = containers.has(parsed) ? containers.get(parsed) : [];
    for (let i = 0; i < candidates.length; i++) {
        let candidate = candidates[i];
        if (candidate.remainingCapacity <= 0) {
            continue;
        }

        // route to this container
        console.log(
            `found container ${candidate}, already running the specified`,
            "service chain, with space for another connection"
        );

        // update container capacity
        const container = candidate.container;
        candidates.slice(candidates.indexOf(candidate));
        containers.set(parsed, [
            ...candidates,
            {
                ...candidate,
                remainingCapacity: candidate.remainingCapacity - 1
            }
        ]);

        // return container MAC address to server
        return await getMACAddress(container);
    }

    // must spin up a new container
    console.log(
        "no containers with remaining capacity found already running this",
        "service chain; spinning up new container!"
    );

    // create executable for specified service chain
    const serviceChain = functionChainer(parsed);
    if (!serviceChain) {
        // unsupported function was specified
        console.log("error: unsupported function was requested");
        return false;
    }

    // create a container to host the service chain
    const container = await d.createContainer({
        Image: NB_IMAGE,
        Tty: true,
        ExposedPorts: { "80/tcp": {} },
        HostConfig: {
            Binds: [
                path.resolve(process.cwd(), "../") + ":/opt/cpsc-490",
                "/dev/hugepages:/dev/hugepages",
                "/lib/modules:/lib/modules",
                "/usr/src:/usr/src"
            ],
            NetworkMode: "bridge",
            Privileged: true
        },
        WorkingDir: "/opt/cpsc-490/NetBricks",
        Cmd: ["cpsc-490/build.sh", serviceChain],
        Volumes: {
            "/dev/hugepages": {},
            "/lib/modules": {},
            "/opt/cpsc-490": {},
            "/usr/src": {}
        }
    });

    // add new container to registry
    containers.set(parsed, [
        ...candidates,
        { container: container, remainingCapacity: MAX_CLIENTS - 1 }
    ]);

    // run the container with output piped to the server terminal
    const stream = await container.attach({
        stream: true,
        stderr: true,
        stdin: true,
        stdout: true
    });
    stream.pipe(process.stdout);
    await container.start();

    // get container MAC addres to send back to server
    return await getMACAddress(container);
};

/* ROUTING SETUP */

// initialize app, file upload middleware
const app = express();
const upload = multer({ fileFilter: jsonFileFilter, storage: storage });
app.use(express.json());

// define API endpoints
app.post("/start", upload.single("data"), async (req, res, next) => {
    if (!req.file) {
        res.sendStatus(400);
        return;
    }
    console.log("config file saved as:", req.file.filename);

    const configFileContents = fs.readFileSync(req.file.path, "utf-8");
    const parseResult = await parseConfigFile(
        req.connection.remoteAddress,
        req.connection.remotePort,
        configFileContents
    );

    if (parseResult) {
        // send MAC address back to orchestrator
        // the orchestrator should use this mac address in packets it sends for
        // this UE, and the the kernel of the VM the server is running on will
        // route packets to the correct container
        res.status(200).send(`destination slice MAC address: ${parseResult}\n`);
    } else {
        res.sendStatus(500);
    }
});

// tells whether the server supports NF specified by query parameter `nf`
app.get("/does-support", (req, res, next) => {
    const queriedNF = req.query.nf;
    const isSupported = supportedNetworkFunctions[queriedNF];
    res.status(200).send(isSupported);
});

// lists all supported NFs
app.get("/supported", (req, res, next) => {
    res.status(200).send(Object.keys(supportedNetworkFunctions));
});

// listen for requests
app.listen(PORT, () => {
    console.log("server running at port", PORT);
});
