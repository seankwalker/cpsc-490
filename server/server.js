import express from "express";
import multer from "multer";

// port to run server on
const PORT = 3000;

/* FILE UPLOAD SETUP */

/*
 * Return `true` if `f` is a JSON file, else false.
 */
const jsonFileFilter = (req, f, cb) => {
    let valid = f.originalname.substring(f.originalname.length - 5) === ".json";
    cb(null, valid);
};

/*
 * Save files as "`Date.now()`-filename.json"
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

/* ROUTING SETUP */

// initialize app, file upload middleware
const app = express();
const upload = multer({ fileFilter: jsonFileFilter, storage: storage });
app.use(express.json());

// define API endpoint
app.post("/start", upload.single("data"), (req, res, next) => {
    console.log("config file saved as:", req.file.filename);
    res.sendStatus(200);
});

// listen for requests
app.listen(PORT, () => {
    console.log("server running at port", PORT);
});
