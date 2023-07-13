import express from 'express';
import {MailSender} from "./mailer.js";
import {devFlag} from "./dev.js";
import {r6sapi} from "./r6sapi.js";
import * as fs from "fs";
import {scheduledJob} from './scheduler.js';
import cors from "cors";

const app = express();
const port = 8964;

app.use(cors(
    // {
    // origin: 'https://catroll.io'
    // }
))

app.get("/register", async function (req, res) {
    let name = req.query.name;
    let email = req.query.email;
    let platform = req.query.platform;
    // get id
    let id;
    try {
        id = (await r6sapi.findByUsername(platform, name))[0]["userId"];
    } catch (e) {
        console.log("/register -> no id for " + name);
        // no such user
        res.sendStatus(204);
        return;
    }
    // save id to file
    fs.writeFile('traciege-data/' + id, platform + ',' + email, function (err) {
        if (err) {
            // internal server err
            console.log("/register -> err creating file");
            res.sendStatus(500);
            return;
        }
    });
    // send confirm email
    let subject = "Traciege Registration Confirmation";
    let content = "You have successfully registered for account name: "
        + name + " platform: " + platform;
    if (devFlag === true) {
        console.log("/register -> dev mode");
    } else {
        let regSender = new MailSender(email, subject, content);
        if ((await regSender.send()) === true) {
            console.log("/register -> created: " + id + ', ' + email + ', ' + name + ', ' + platform);
            res.sendStatus(201);
            return;
        } else {
            // Unprocessable Content
            console.log("/register -> unable to send email to: " + email)
            fs.unlinkSync('traciege-data/' + id);
            res.sendStatus(422);
            return;
        }
    }
});

app.get("/dereg", async function (req, res) {
    let name = req.query.name;
    let email = req.query.email;
    let platform = req.query.platform;
    // get id
    let id = (await r6sapi.findByUsername(platform, name))[0]["userId"];
    // check existence
    if (fs.existsSync('traciege-data/' + id)) {
        fs.unlinkSync('traciege-data/' + id);
        res.sendStatus(200);
    } else {
        res.sendStatus(204);
    }
});

app.get("/status", async function (req, res) {
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Traciege backend listening on port ${port}!`);
});

scheduledJob.start();
