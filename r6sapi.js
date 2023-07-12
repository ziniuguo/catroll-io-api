import * as dotenv from 'dotenv';
dotenv.config();
import R6API from 'r6api.js';
import credentials from './credentials.json' assert { type: "json" };

const { UBI_EMAIL: email = credentials.uplayEmail,
    UBI_PASSWORD: password = credentials.uplayPwd } = process.env;
export const r6sapi = new R6API({ email, password });