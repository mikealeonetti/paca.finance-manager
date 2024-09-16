import assert from "assert";
import { EMAIL_FROM, EMAIL_HOST, EMAIL_IS_SECURE, EMAIL_PASSWORD, EMAIL_PORT, EMAIL_TO, EMAIL_USER } from "../constants";
import nodemailer from 'nodemailer';

assert.ok(EMAIL_HOST);
assert.ok(EMAIL_PORT);
assert.ok(EMAIL_PASSWORD);
assert.ok(EMAIL_FROM);
assert.ok(EMAIL_USER);
assert.ok(EMAIL_TO);

const subject = "This is a test from node.";
const text = "This is a test body.\n\n\nThankyou!";

(async function(){
    const emailTransport = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_IS_SECURE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD
        }
    });

    const info = await emailTransport.sendMail({
        from: EMAIL_FROM,
        to: EMAIL_TO,
        subject,
        text
    });

    console.log("Output=", info);
})();