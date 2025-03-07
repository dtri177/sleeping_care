const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail", // You can change to another provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
transporter.verify(function (error, success) {
    if (error) {
        console.log("Error:", error);
    } else {
        console.log("Server is ready to take our messages");
    }
});
const sendVerificationEmail = async (email) => {
    const verificationLink = `http://localhost:3000/auth/verify-email?email=${email}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Email",
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email and Sign In.</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = { sendVerificationEmail };
