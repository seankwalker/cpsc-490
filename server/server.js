import dockerode from "dockerode";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

// max number of clients per container
const MAX_CLIENTS = 3;

// id for NetBricks image
const NB_IMAGE = "seankwalker/cpsc-490-dev";

// port to run server on
const PORT = 3000;

// port to spin up next Docker container on
let nextContainerPort = 3001;

// registry of Docker containers, service chains, remaining capacity
let containers = new Map();

// routing table
let routing = new Map();

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

// parse config file into JS object
const parseConfigFile = async (clientIp, clientPort, contents) => {
    const parsed = JSON.parse(contents);
    console.log("parsed JSON object:", parsed);

    // initialize a Docker container with a service chain respecting the
    // directed graph specified in the config file

    // check if there are any below-capacity containers which are running the
    // specified service chain
    let d = new dockerode();
    let candidates = containers.has(parsed) ? containers.get(parsed) : [];
    if (candidates.length > 0) {
        console.log(
            "found existing candidate containers! checking capacity..."
        );
    }

    for (let i = 0; i < candidates.length; i++) {
        let candidate = candidates[i];
        if (candidate.remainingCapacity > 0) {
            // route to this container
            console.log(`candidate container ${candidate} has space!`);

            // register this route in the routing table
            let container = candidate.container;
            routing.set({ clientIp, clientPort }, container);

            // update `containers` list
            candidates.slice(candidates.indexOf(candidate));
            containers.set(parsed, [
                ...candidates,
                {
                    ...candidate,
                    remainingCapacity: candidate.remainingCapacity - 1
                }
            ]);
            return true;
        }
    }

    // must spin up a new container
    console.log(
        "no containers with remaining capacity found already running this service chain; spinning up new container!"
    );

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
            NetworkMode: "host",
            Privileged: true,
            PortBindings: {
                // container port 80 maps to host port `nextContainerPort`
                "80/tcp": [
                    {
                        HostPort: nextContainerPort.toString()
                    }
                ]
            }
        },
        WorkingDir: "/opt/cpsc-490/NetBricks",
        Cmd: ["./build.sh", "build"], // TODO: run command of VNF chain here
        Volumes: {
            "/dev/hugepages": {},
            "/lib/modules": {},
            "/opt/cpsc-490": {},
            "/usr/src": {}
        }
    });

    containers.set(parsed, [
        ...candidates,
        { container: container, remainingCapacity: MAX_CLIENTS - 1 }
    ]);
    nextContainerPort++;

    // run the container
    const stream = await container.attach({
        stream: true,
        stderr: true,
        stdin: true,
        stdout: true
    });
    stream.pipe(process.stdout);
    await container.start();

    return true;
};

/* ROUTING SETUP */

// initialize app, file upload middleware
const app = express();
const upload = multer({ fileFilter: jsonFileFilter, storage: storage });
app.use(express.json());

// define API endpoint
app.post("/start", upload.single("data"), async (req, res, next) => {
    if (!req.file) {
        res.sendStatus(400);
        return;
    }

    console.log("config file saved as:", req.file.filename);

    const configFileContents = fs.readFileSync(req.file.path, "utf-8");
    const success = await parseConfigFile(
        req.connection.remoteAddress,
        req.connection.remotePort,
        configFileContents
    );

    if (success) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

// listen for requests
app.listen(PORT, () => {
    console.log("server running at port", PORT);
});
