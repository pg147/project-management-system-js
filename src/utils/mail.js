// Email template modules
import Mailgen from 'mailgen';

// Email service modules
import nodemailer from 'nodemailer';

/**
 * Sends an email using Mailgen templates and Nodemailer with SMTP configuration.
 * Generates both plain text and HTML versions of the email and sends them through
 * a configured SMTP transporter.
 * 
 * @async
 * @function sendEmail
 * @param {Object} options - The email configuration options
 * @param {string} options.email - The recipient's email address
 * @param {string} options.subject - The email subject line
 * @param {Object} options.mailgenContent - The Mailgen content object for email template generation
 * @returns {Promise<void>} A promise that resolves when the email is sent successfully
 * @throws {Error} Logs error to console if email sending fails
 */
export async function sendEmail(options) {
    // Initialized an instance of Mailgen's template generator
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'PM System by PG',
            link: 'https://www.prathmesh.dev'
        }
    });

    // Generating plain text for the email with the content options provided
    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
    
    // Generating HTML for the email with the content options provided
    const emailHTML = mailGenerator.generate(options.mailgenContent);
    
    // Creating an email transporter instance for nodemailer 
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASSWORD
        }
    });
    
    // Payload for the transporter
    const mail = {
        from: 'mail.taskmanager@example.com',
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHTML
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Error sending email. Please check your credentials for MAILTRAP!");
        console.error("Error sending email ::", error);
    }
}

/**
 * Generates email content for user email verification.
 * Creates a structured content object with welcome message and verification button
 * that can be used with Mailgen to generate formatted emails.
 * 
 * @function verificationEmailContent
 * @param {string} username - The username of the user to be verified
 * @param {string} verificationURL - The URL link for email verification
 * @returns {Object} Mailgen content object containing email body structure with name, intro, action button, and outro
 */
export function verificationEmailContent(username, verificationURL) {
    return {
        body: {
            name: username,
            intro: `Welcome to PM System, ${username}! We are excited to have you with us.`,
            action: {
                instructions: 'To verify your email please click the button below',
                button: {
                    color: '#0c40e3',
                    text: 'Verify your email',
                    link: verificationURL
                },
            },
            outro: "Need help or have some questions? Just reply to this email, we'd love to help you out!"
        }
    };
}

/**
 * Generates email content for password reset requests.
 * Creates a structured content object with password reset instructions and action button
 * that can be used with Mailgen to generate formatted emails.
 * 
 * @function forgotPasswordContent
 * @param {string} username - The username of the user requesting password reset
 * @param {string} passwordResetURL - The URL link for password reset
 * @returns {Object} Mailgen content object containing email body structure with name, intro, action button, and outro
 */
export function forgotPasswordContent(username, passwordResetURL) {
    return {
        body: {
            name: username,
            intro: `Hi, ${username}! We have a request to reset password for your account`,
            action: {
                instructions: 'To reset your password please click the button below',
                button: {
                    color: '#0c40e3',
                    text: 'Reset Password',
                    link: passwordResetURL
                },
            },
            outro: "Need help or have some questions? Just reply to this email, we'd love to help you out!"
        }
    };
}