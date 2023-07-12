import cron from 'node-cron';
import {devFlag} from "./dev.js";
import * as fs from "fs";
import {r6sapi} from "./r6sapi.js";
import {MailSender} from "./mailer.js";

async function update() {
    // read files
    const dir = await fs.promises.opendir('traciege-data/');
    for await (const dirent of dir) {
        let id = dirent.name;
        let data = fs.readFileSync('traciege-data/' + id, 'utf8');
        let platform = data.split(',')[0];
        let email = data.split(',')[1];
        // call api for username
        let name;
        if (platform === "uplay"
            || platform === "xbl"
            || platform === "psn") {
            name = (await r6sapi.findById(platform, id))[0]["username"];
        }
        if (devFlag === true) {
            console.log("checked for account id: " + id + " name: " + name + " platform: " + platform);
        } else {
            let mailSender = new MailSender(email,
                "Daily Recap for " + name,
                "checked for account id: " + id + " name: " + name + " platform: " + platform
            );
            if ((await mailSender.send()) !== true) {
                console.log("err: scheduler -> update");
            } else {
                console.log("scheduler -> job for id: " + id);
            }
        }
        // sleep 1s
        await new Promise(r => setTimeout(r, 1000));
    }
}

export let scheduledJob;
if (devFlag === true) {
    // dev
    scheduledJob = cron.schedule('*/30 * * * * *', update);
} else {
    // prod
    scheduledJob = cron.schedule('45 9 * * *', update, {
        scheduled: true,
        timezone: "Asia/Singapore"
    });
}
