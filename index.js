import express from 'express';
import {MailSender} from "./mailer.js";
import {devFlag} from "./profile.js";
import {r6sapi} from "./r6sapi.js";
import * as fs from "fs";
import {scheduledJob} from './scheduler.js';
import cors from "cors";
import https from "https";
import {Player} from "./db.js";

let key;
let cert;
let options;

const app = express();
const port = 8964;

if (devFlag === false) {
    key = fs.readFileSync('/etc/letsencrypt/live/api.catroll.io/privkey.pem');
    cert = fs.readFileSync('/etc/letsencrypt/live/api.catroll.io/fullchain.pem');
    options = {
        key: key,
        cert: cert
    };
}

app.use(cors(
    // {
    // origin: 'https://catroll.io'
    // }
))

app.get("/sub", async function (req, res) {
    let name = req.query.name;
    let email = req.query.email;
    let platform = req.query.platform;
    console.log("/sub -> name : " + name + " platform: " + platform + " email: " + email);
    // get id
    let id;
    try {
        id = (await r6sapi.findByUsername(platform, name))[0]["userId"];
    } catch (e) {
        console.log("/sub -> no id for " + name + " | " + platform);
        // no such user
        res.sendStatus(204);
        return;
    }
    // check if this record exists
    let savedFlag = false;
    await Player.findOne({email, platform, id})// always need await here, or then won't finish...
        .then(async result => {
            if (result == null) {
                // no exist
                const player = new Player({email, platform, id});
                await player.save();
                console.log("/sub -> new record saved");
                savedFlag = true;
            } else {
                // exist
                console.log("/sub -> already exist");
                res.sendStatus(409);
            }
        })
        .catch(err => {
            console.log("/sub -> check whether record exists failed " + err);
            res.sendStatus(500);
        });
    if (savedFlag === true) {
        // send confirm email
        let subject = "Traciege Subscription Confirmation";
        let text = "You have successfully subscribed for account name: "
            + name + " platform: " + platform;
        if (devFlag === true) {
            console.log("/sub -> dev mode");
            res.sendStatus(201);
        } else {
            let regSender = new MailSender(email, subject, text);
            await regSender.transporter.sendMail(regSender.mailOpt, async err => {
                if (err) {
                    console.log("/sub -> failed to send email. record deleted" + err);
                    await Player.deleteOne({email, platform, id});
                    res.sendStatus(422); // Unprocessable Content
                } else {
                    console.log("/sub -> email sent, completed");
                    res.sendStatus(201);
                }
            })
        }
    }
});

// unsub:
// 204: no id
// 422: no exist
// 200: deleted ok
// 500
app.get("/unsub", async function (req, res) {
    let name = req.query.name;
    let email = req.query.email;
    let platform = req.query.platform;
    console.log("/unsub -> name : " + name + " platform: " + platform + " email: " + email);
    // get id
    let id;
    try {
        id = (await r6sapi.findByUsername(platform, name))[0]["userId"];
    } catch (e) {
        console.log("/register -> no id for " + name + " | " + platform);
        // no such user
        res.sendStatus(204);
        return;
    }
    await Player.findOne({email, platform, id})// always need await here, or then won't finish...
        .then(async result => {
            if (result == null) {
                // no exist
                console.log("/unsub -> no record exists");
                res.sendStatus(422);
            } else {
                // exist
                console.log("/unsub -> deleting...");
                await Player.deleteOne({email, platform, id});
                res.sendStatus(200);
            }
        })
        .catch(err => {
            console.log("/unsub -> failed " + err);
            res.sendStatus(500);
        });
})

app.get("/status", async function (req, res) {
    res.sendStatus(200);
});

if (devFlag === false) {
    // prod
    const server = https.createServer(options, app);
    server.listen(port, () => {
        console.log(`Traciege backend listening on port ${port}!`);
    })
} else {
    app.listen(port, () => {
        console.log(`Traciege backend listening on port ${port}!`);
    });
}

scheduledJob.start();
