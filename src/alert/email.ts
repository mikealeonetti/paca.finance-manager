import SMTPTransport from "nodemailer/lib/smtp-transport";
import { EMAIL_FROM, EMAIL_HOST, EMAIL_IS_SECURE, EMAIL_PASSWORD, EMAIL_PORT, EMAIL_TIMEOUT, EMAIL_TO, EMAIL_USER } from "../constants";

import nodemailer, { Transporter } from 'nodemailer';
import logger from "../logger";

import Debug from 'debug';
import { format as dateFormat } from "date-fns";
import { debounce } from "lodash";

const debug = Debug("unibalancer:alerts:email");

// Make sure we have all of the elements
const emailEnabled = EMAIL_HOST != null &&
    EMAIL_PORT != null &&
    EMAIL_USER != null &&
    EMAIL_PASSWORD != null &&
    EMAIL_TO != null &&
    EMAIL_FROM !=null;

let emailTransport: Transporter<SMTPTransport.SentMessageInfo> | undefined;

// Running messages
let messages: string[] = [];

if (emailEnabled) {
    debug("E-mail is enabled.");

    emailTransport = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_IS_SECURE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD
        }
    });
}

const nowFormatted = ()=>dateFormat(new Date(), "Ppp");

const sendEmail = debounce( async function() : Promise<void> {
    try {
        // Do we have anything to send?
        if (messages.length == 0) {
            logger.error("Wanted to send e-mail BUT we have no message.");
            return;
        }

        if( !emailTransport ) {
            logger.error("Wanted to send message but we do NOT have an e-mail transport.");
            return;
        }

        debug("Attempting to send e-mail.");

        // Compile the messages
        const text = `${messages.join('\n')}


Your servant in crypto,

Paca.finance Manager`;

        // The subject
        const subject = `paca.finance report ${nowFormatted()}.`;

        // send mail with defined transport object
        const info = await emailTransport.sendMail({
            from: EMAIL_FROM,
            to: EMAIL_TO,
            subject,
            text
        });

        logger.info("E-mail message sent: %s", info.messageId);
    }
    catch (e) {
        logger.warn( "Could not send e-mail message to %s.", EMAIL_TO, e );
    }
    finally {
        // Clear the messages
        messages = [];
    }
}, EMAIL_TIMEOUT);

export default async function alert(message: string): Promise<void> {
    // Is the email enabled?
    if (!emailEnabled)
        return debug("E-mail is not enabled.");

    debug("Handling e-mail", message);

    // Get the formatted date
    const datePlusMessage = `${nowFormatted()}: ${message}`;

    // Add to the message
    messages.push(datePlusMessage);

    // Schedule a new send
    sendEmail();
}