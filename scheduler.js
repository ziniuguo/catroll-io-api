import cron from 'node-cron';
import {devFlag} from "./profile.js";
import * as fs from "fs";
import {r6sapi} from "./r6sapi.js";
import {MailSender} from "./mailer.js";
import {Player} from "./db.js";
 async function sendEmail() {
    console.log("/sendEmail -> overall updating...")
    // read from mongodb
    const result = await Player.find();
    for await (let record of result) {
        let email = record["email"];
        let platform = record["platform"];
        let id = record["id"];
        console.log("/sendEmail loop -> id : " + id + " platform: " + platform + " email: " + email)
        let name;
        try {
            name = (await r6sapi.findById(platform, id))[0]["username"];
        } catch (e) {
            console.log("/sendEmail loop -> no name for " + id + " | " + platform, ", deleting bad record from db...");
            // delete from db
            Player.deleteOne({email, platform, id});
            continue;
        }
        if (devFlag === true) {
            console.log("/sendEmail loop -> checked for account id: " + id + " name: " + name + " platform: " + platform);
        } else {
            let mailSender = new MailSender(email,
                "Daily Recap for " + name,
                "checked for account id: " + id + " name: " + name + " platform: " + platform
            );
            await mailSender.transporter.sendMail(mailSender.mailOpt, async err => {
                if (err) {
                    console.log("/sendEmail: failed to send email. record deleted" + err);
                    await Player.deleteOne({email, platform, id});
                }
            });
        }
        console.log("/sendEmail: completed one cycle");
        // sleep 1s
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log("/sendEmail: completed overall cycle");
}

export let scheduledJob;
if (devFlag === true) {
    // dev
    scheduledJob = cron.schedule('*/5 * * * * *', sendEmail, {
        scheduled: false
    });
} else {
    // prod
    scheduledJob = cron.schedule('45 9 * * *', sendEmail, {
        scheduled: false,
        timezone: "Asia/Singapore"
    });
}
