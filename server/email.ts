import sgMail from '@sendgrid/mail';

// Set SendGrid API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable is not set. Email functionality will not work.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Cannot send email: SENDGRID_API_KEY not set');
      return false;
    }

    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
      replyTo: params.replyTo
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a contact form email
 */
export async function sendContactEmail(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  const params: EmailParams = {
    to: 'gfp.footprint2024@gmail.com', // Change to your receiving email
    from: 'noreply@excelanalytics.com', // Change to your verified sender
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: `
      <strong>Name:</strong> ${name}<br>
      <strong>Email:</strong> ${email}<br>
      <strong>Subject:</strong> ${subject}<br>
      <strong>Message:</strong><br>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
    text: `
      Name: ${name}
      Email: ${email}
      Subject: ${subject}
      Message:
      ${message}
    `
  };

  return sendEmail(params);
} 