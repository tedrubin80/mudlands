const { Resend } = require('resend');

class EmailService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@mudlands.online';
    }

    /**
     * Send a generic email
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} html - HTML content
     * @param {string} [text] - Plain text content (optional)
     */
    async send({ to, subject, html, text }) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject,
                html,
                text
            });

            if (error) {
                console.error('Email send error:', error);
                throw new Error(error.message);
            }

            console.log('Email sent successfully:', data.id);
            return data;
        } catch (err) {
            console.error('Failed to send email:', err);
            throw err;
        }
    }

    /**
     * Send a welcome email to new users
     * @param {string} to - User's email address
     * @param {string} username - User's username
     */
    async sendWelcome(to, username) {
        return this.send({
            to,
            subject: 'Welcome to MUDlands Online!',
            html: `
                <h1>Welcome to MUDlands Online, ${username}!</h1>
                <p>Your adventure awaits in the world of MUDlands.</p>
                <p>Create your character and start exploring the dangerous wastelands!</p>
                <p>May your journey be epic!</p>
                <br>
                <p>- The MUDlands Team</p>
            `,
            text: `Welcome to MUDlands Online, ${username}!\n\nYour adventure awaits in the world of MUDlands.\n\nCreate your character and start exploring the dangerous wastelands!\n\nMay your journey be epic!\n\n- The MUDlands Team`
        });
    }

    /**
     * Send a password reset email
     * @param {string} to - User's email address
     * @param {string} resetToken - Password reset token
     * @param {string} resetUrl - Full URL for password reset
     */
    async sendPasswordReset(to, resetToken, resetUrl) {
        return this.send({
            to,
            subject: 'MUDlands Online - Password Reset',
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested a password reset for your MUDlands Online account.</p>
                <p>Click the link below to reset your password:</p>
                <p><a href="${resetUrl}">Reset Password</a></p>
                <p>Or copy this link: ${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <br>
                <p>- The MUDlands Team</p>
            `,
            text: `Password Reset Request\n\nYou requested a password reset for your MUDlands Online account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n- The MUDlands Team`
        });
    }

    /**
     * Send account verification email
     * @param {string} to - User's email address
     * @param {string} username - User's username
     * @param {string} verifyUrl - Verification URL
     */
    async sendVerification(to, username, verifyUrl) {
        return this.send({
            to,
            subject: 'MUDlands Online - Verify Your Email',
            html: `
                <h1>Verify Your Email, ${username}</h1>
                <p>Please verify your email address to complete your registration.</p>
                <p><a href="${verifyUrl}">Verify Email</a></p>
                <p>Or copy this link: ${verifyUrl}</p>
                <br>
                <p>- The MUDlands Team</p>
            `,
            text: `Verify Your Email, ${username}\n\nPlease verify your email address to complete your registration.\n\n${verifyUrl}\n\n- The MUDlands Team`
        });
    }

    /**
     * Send notification email
     * @param {string} to - User's email address
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     */
    async sendNotification(to, title, message) {
        return this.send({
            to,
            subject: `MUDlands Online - ${title}`,
            html: `
                <h1>${title}</h1>
                <p>${message}</p>
                <br>
                <p>- The MUDlands Team</p>
            `,
            text: `${title}\n\n${message}\n\n- The MUDlands Team`
        });
    }
}

module.exports = new EmailService();
