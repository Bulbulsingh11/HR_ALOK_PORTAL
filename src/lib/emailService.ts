import emailjs from '@emailjs/browser';

emailjs.init('zUAWBN4oEdvyuq03C');

export async function sendEmail(to_email: string, subject: string, message: string): Promise<void> {
  try {
    await emailjs.send(
      'service_l1uaxok',
      'template_zceq0wb',
      {
        to_email: to_email,
        subject: subject,
        message: message
      }
    );
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email failed:', error);
    throw error;
  }
}
