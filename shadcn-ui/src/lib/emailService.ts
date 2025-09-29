import { toast } from '@/hooks/use-toast';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);

interface EmailConfig {
  recipientEmail: string;
  enabled: boolean;
}

let emailConfig: EmailConfig = {
  recipientEmail: '',
  enabled: false
};

export const setEmailConfig = (config: EmailConfig) => {
  console.log('setEmailConfig called with:', config);
  emailConfig = config;
};

export const sendConflictNotification = async (conflictDetails: {
  type: string;
  description: string;
  timestamp: string;
  affectedTrains?: string[];
}) => {
  if (!emailConfig.enabled || !emailConfig.recipientEmail) {
    console.log('Current emailConfig:', emailConfig);
    console.log('Email notifications are disabled or no recipient email configured');
    toast({
      title: 'Email Disabled',
      description: 'Email notifications are disabled or no recipient email is configured.',
      variant: 'default',
    });
    return;
  }

  const msg = {
    to: emailConfig.recipientEmail,
    from: 'csbs269031@saranathan.ac.in', // Replace with your verified sender email
    subject: `Scheduling Conflict Alert: ${conflictDetails.type}`,
    text: `
      Scheduling Conflict Detected
      Type: ${conflictDetails.type}
      Time: ${conflictDetails.timestamp}
      Description: ${conflictDetails.description}
      Affected Trains: ${conflictDetails.affectedTrains?.join(', ') || 'N/A'}
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
    toast({
      title: 'Success',
      description: 'Email notification sent successfully.',
      variant: 'default',
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    toast({
      title: 'Error',
      description: `Failed to send email notification: ${error.message}`,
      variant: 'destructive',
    });
    return false;
  }
};

export const getEmailConfig = () => {
  return emailConfig;
};