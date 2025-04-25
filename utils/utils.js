import bcrypt from 'bcryptjs';
import sgMail from '@sendgrid/mail';

export const hashFn = async (value) => {
    const salt = await bcrypt.genSalt(10);
    const hash = bcrypt.hash(value, salt);
  
    return hash;
  };

  export const comparePasswords = async (password, hashedPassword) => {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  };

  
  
  
  // Set the API key from the .env file
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  /**
   * Send an email using SendGrid
   * @param {string} to - Recipient's email address
   * @param {string} subject - Subject of the email
   * @param {string} text - Plain text content of the email
   * @returns {Promise<void>}
  */
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL, // Verified sender email
      subject,
      html: htmlContent,
    };
    
    await sgMail.send(msg);
    console.log('Email sent successfully');
} catch (error) {
    console.error('Error sending email:', error.response?.body || error.message);
    throw error; // Optional: propagate error to handle it higher up
}
};

// export default { hashFn, comparePasswords, sendEmail };