import express from "express";
import multer from "multer";
import fs from "fs";

// port to run server on
const PORT = 3000;

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

// open a config file and send it to JSON parser
const openFile = filePath => {
    fs.readFile(filePath, "utf-8", (err, contents) =>
        parseConfigFile(contents)
    );
};

// parse config file into JS object
const parseConfigFile = contents => {
    const parsed = JSON.parse(contents);
    console.log("pared JSON object:", parsed);

    // initialize a Docker container with a service chain respecting the
    // directed graph specified in the config file
    // TODO
};

/* ROUTING SETUP */

// initialize app, file upload middleware
const app = express();
const upload = multer({ fileFilter: jsonFileFilter, storage: storage });
app.use(express.json());

// define API endpoint
app.post("/start", upload.single("data"), (req, res, next) => {
    console.log("config file saved as:", req.file.filename);
    res.sendStatus(200);
    openFile(req.file.path);
});

// listen for requests
app.listen(PORT, () => {
    console.log("server running at port", PORT);
});
