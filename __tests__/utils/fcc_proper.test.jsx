import { getFccProperUserIdByEmail } from '../../util/fcc_proper.js';
import { getSession } from 'next-auth/react';

/* @jest-environment node */

jest.mock('next-auth/react');

describe('getFccProperUserIdByEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a user ID when the API call succeeds', async () => {
    const mockEmail = 'student@example.com';
    const mockUserId = '12345';
    const mockSession = { user: { email: mockEmail } };

    getSession.mockResolvedValue(mockSession);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { userId: mockUserId } })
    });

    const result = await getFccProperUserIdByEmail(mockEmail);

    expect(result).toBe(mockUserId);

    const [calledUrl, calledInit] = global.fetch.mock.calls[0];
    expect(calledUrl).toMatch(/\/api\/fcc-proxy$/);

    const bodyJson = JSON.parse(calledInit.body);
    expect(bodyJson.options?.email).toBe(mockEmail);
    expect(calledInit.method).toBe('POST');
    expect(calledInit.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('should return null when userId is not in response', async () => {
    const mockEmail = 'student@example.com';
    const mockSession = { user: { email: mockEmail } };

    getSession.mockResolvedValue(mockSession);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: {} })
    });

    const result = await getFccProperUserIdByEmail(mockEmail);

    expect(result).toBeNull();
  });

  it('should throw an error when user is not authenticated', async () => {
    getSession.mockResolvedValue(null);

    await expect(getFccProperUserIdByEmail('student@example.com')).rejects.toThrow(
      'User not authenticated'
    );
  });

  it('should throw an error when API request fails', async () => {
    const mockEmail = 'student@example.com';
    const mockSession = { user: { email: mockEmail } };

    getSession.mockResolvedValue(mockSession);
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400
    });

    await expect(getFccProperUserIdByEmail(mockEmail)).rejects.toThrow(
      'API request failed with status 400'
    );
  });

  it('should pass the correct targetUrl in the request body', async () => {
    const mockEmail = 'student@example.com';
    const mockSession = { user: { email: mockEmail } };

    getSession.mockResolvedValue(mockSession);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { userId: '12345' } })
    });

    await getFccProperUserIdByEmail(mockEmail);

    const callArgs = global.fetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.targetUrl).toBe('/api/protected/classroom/get-user-id');
    expect(body.options?.inClassroom).toBe(true);
  });

  it('should include context cookies when provided', async () => {
    const mockEmail = 'student@example.com';
    const mockSession = { user: { email: mockEmail } };
    const mockContext = {
      req: { headers: { cookie: 'test-cookie=value' } }
    };

    // Ensure server-side path (no window)
    const originalWindow = global.window;
    // eslint-disable-next-line no-undef
    delete global.window;

    getSession.mockResolvedValue(mockSession);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { userId: '12345' } })
    });

    await getFccProperUserIdByEmail(mockEmail, mockContext);

    const callArgs = global.fetch.mock.calls[0];
    expect(callArgs[1].headers.Cookie).toBe('test-cookie=value');

    // Restore window if it existed
    if (originalWindow !== undefined) {
      global.window = originalWindow;
    }
  });
});