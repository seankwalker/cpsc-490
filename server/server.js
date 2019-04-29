import dockerode from "dockerode";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

// id for NetBricks image
const NB_IMAGE_ID = "eadf70e1ee5a";

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
    // TODO

    // check if we have any below-capacity containers which are running the
    // specified service chain
    if (containers.has(parsed)) {
        console.log(
            "found existing candidate containers! checking capacity..."
        );
        let candidates = containers.get(parsed);
        for (let i = 0; i < candidates.length; i++) {
            let candidate = candidates[i];
            if (candidate.remainingCapacity > 0) {
                // route to this container
                console.log(`candidate container ${candidate} has space!`);
                let d = new dockerode({
                    host: candidate.host,
                    port: candidate.port
                });

                // register this route in the routing table
                routing.set({ clientIp, clientPort }, d);
                return true;
            }
        }
    }

    console.log(
        "no containers with remaining capacity found already running this service chain"
    );
    // must spin up a new container
    // TODO: where??
    let d = new dockerode();

    console.log("creating new container");

    // create new container
    d.createContainer(
        {
            image: NB_IMAGE_ID,
            HostConfig: {
                Binds: [
                    path.resolve(process.cwd(), "../") + ":/opt/cpsc-490",
                    "/dev/hugepages:/dev/hugepages",
                    "/lib/modules:/lib/modules",
                    "/usr/src:/usr/src"
                ],
                NetworkMode: "host",
                Privileged: true
            },
            WorkingDir: "/opt/cpsc-490/NetBricks",
            Cmd: ["/bin/ls"],
            Volumes: {
                "/dev/hugepages": {},
                "/lib/modules": {},
                "/opt/cpsc-490": {},
                "/usr/src": {}
            }
        },
        (err, container) => {
            if (err) {
                console.log("error!", err);
                return;
            }

            container.attach(
                {
                    stream: true,
                    stdout: true,
                    stderr: true,
                    tty: true
                },
                (err, stream) => {
                    if (err) {
                        console.log("error!", err);
                        return;
                    }

                    stream.pipe(process.stdout);

                    container.start((err, data) => {
                        if (err) {
                            console.log("error!", err);
                            return;
                        }

                        console.log(`data: ${data}`);
                    });
                }
            );
        }
    );

    return true;
};

/* ROUTING SETUP */

// initialize app, file upload middleware
const app = express();
const upload = multer({ fileFilter: jsonFileFilter, storage: storage });
app.use(express.json());

// define API endpoint
app.post("/start", upload.single("data"), async (req, res, next) => {
    console.log("config file saved as:", req.file.filename);
    console.log(req.connection.remoteAddress, req.connection.remotePort);
    const configFileContents = fs.readFileSync(req.file.path, "utf-8");
    const status = await parseConfigFile(
        req.connection.remoteAddress,
        req.connection.remotePort,
        configFileContents
    );

    if (status) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

// listen for requests
app.listen(PORT, () => {
    console.log("server running at port", PORT);
});
