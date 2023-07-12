import express from 'express';
import {MailSender} from "./mailer.js";
import {devFlag} from "./dev.js";
import {r6sapi} from "./r6sapi.js";
import * as fs from "fs";
import {job} from './scheduler.js';

const app = express();
const port = 3000;

app.get("/register", async function (req, res) {
    let name = req.query.name;
    let email = req.query.email;
    let platform = req.query.platform;
    // get id
    let id = (await r6sapi.findByUsername(platform, name))[0]["userId"];
    // save id to file
    fs.writeFile('traciege-data/' + id, platform + ',' + email, function (err) {
        if (err) {
            res.sendStatus(500);
        }
    });
    // send confirm email
    let subject = "Traciege Registration Confirmation";
    let content = "You have successfully registered for account name: "
        + name + " platform: " + platform;
    if (devFlag === true) {
        console.log(subject);
    } else {
        let regSender = new MailSender(email, subject, content);
        if ((await regSender.send()) === true) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
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
    console.log(`Example app listening on port ${port}!`);
});

job.start();
