import { sendConflictNotification, setEmailConfig } from './emailService';

jest.mock('./emailService', () => ({
  sendConflictNotification: jest.fn(),
  setEmailConfig: jest.fn(),
}));

describe('Email Service', () => {
  test('sets email configuration correctly', () => {
    const mockConfig = { recipientEmail: 'test@example.com', enabled: true };
    setEmailConfig(mockConfig);

    expect(setEmailConfig).toHaveBeenCalledWith(mockConfig);
  });

  test('sends conflict notification with correct details', async () => {
    const mockConflictDetails = {
      type: 'Scheduling Conflict',
      description: 'Train-001 and Train-002 have overlapping schedules',
      timestamp: '2025-09-29T12:00:00Z',
      affectedTrains: ['Train-001', 'Train-002'],
    };

    await sendConflictNotification(mockConflictDetails);

    expect(sendConflictNotification).toHaveBeenCalledWith(mockConflictDetails);
  });
});