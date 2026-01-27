/**
 * Tests for FCC Proper User ID sync utilities
 * Tests syncing FCC Proper IDs to the database
 */

const mockPrisma = {
  user: {
    update: jest.fn(),
    findMany: jest.fn()
  },
  classroom: {
    findUnique: jest.fn()
  },
  $disconnect: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

jest.mock('../../util/fcc_proper', () => ({
  getFccProperUserIdByEmail: jest.fn()
}));

const { getFccProperUserIdByEmail } = require('../../util/fcc_proper');
const {
  syncUserFccProperUserId,
  syncClassroomUserIds,
  syncAllUserIds
} = require('../../util/server/syncFccProperUserIds');

describe('syncFccProperUserIds utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset default mock return values
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.classroom.findUnique.mockResolvedValue({
      classroomId: 'classroom-123',
      fccUserIds: []
    });
    mockPrisma.$disconnect.mockResolvedValue();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  describe('syncUserFccProperUserId', () => {
    it('should sync FCC Proper user ID for valid email', async () => {
      const email = 'student@test.com';
      const fccProperUserId = 'fcc-user-123';

      getFccProperUserIdByEmail.mockResolvedValue(fccProperUserId);
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        email,
        fccProperUserId
      });

      const result = await syncUserFccProperUserId(email);

      expect(result).toBe(true);
      expect(getFccProperUserIdByEmail).toHaveBeenCalledWith(email, null);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email },
        data: { fccProperUserId }
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(`✅ Synced FCC Proper User ID for ${email}`)
      );
    });

    it('should return false if FCC Proper user ID not found', async () => {
      const email = 'student@test.com';

      getFccProperUserIdByEmail.mockResolvedValue(null);

      const result = await syncUserFccProperUserId(email);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `No FCC Proper User ID found for email: ${email}`
        )
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const email = 'student@test.com';
      const error = new Error('API error');

      getFccProperUserIdByEmail.mockRejectedValue(error);

      const result = await syncUserFccProperUserId(email);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `Error syncing FCC Proper User ID for ${email}`
        ),
        error
      );
    });

    it('should accept optional context parameter', async () => {
      const email = 'student@test.com';
      const fccProperUserId = 'fcc-user-123';
      const mockContext = { req: { headers: {} } };

      getFccProperUserIdByEmail.mockResolvedValue(fccProperUserId);
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        email,
        fccProperUserId
      });

      await syncUserFccProperUserId(email, mockContext);

      expect(getFccProperUserIdByEmail).toHaveBeenCalledWith(
        email,
        mockContext
      );
    });
  });

  describe('syncClassroomUserIds', () => {
    it('should sync user IDs for all users in classroom', async () => {
      const classroomId = 'classroom-123';

      mockPrisma.classroom.findUnique.mockResolvedValue({
        classroomId,
        fccUserIds: ['user-1', 'user-2']
      });

      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' },
        { email: 'student2@test.com' }
      ]);

      getFccProperUserIdByEmail
        .mockResolvedValueOnce('fcc-user-1')
        .mockResolvedValueOnce('fcc-user-2');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      const result = await syncClassroomUserIds(classroomId);

      expect(result).toEqual({ success: 2, failed: 0 });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['user-1', 'user-2'] },
          fccProperUserId: null
        },
        select: { email: true }
      });
    });

    it('should track successful and failed syncs', async () => {
      const classroomId = 'classroom-123';

      mockPrisma.classroom.findUnique.mockResolvedValue({
        classroomId,
        fccUserIds: ['user-1', 'user-2']
      });

      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' },
        { email: 'student2@test.com' }
      ]);

      // First succeeds, second fails
      getFccProperUserIdByEmail
        .mockResolvedValueOnce('fcc-user-1')
        .mockResolvedValueOnce(null);

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      const result = await syncClassroomUserIds(classroomId);

      expect(result).toEqual({ success: 1, failed: 1 });
    });

    it('should throw error if classroom not found', async () => {
      const classroomId = 'nonexistent-123';

      mockPrisma.classroom.findUnique.mockResolvedValue(null);

      await expect(syncClassroomUserIds(classroomId)).rejects.toThrow(
        `Classroom not found: ${classroomId}`
      );
    });

    it('should only sync users without existing FCC Proper IDs', async () => {
      const classroomId = 'classroom-123';

      mockPrisma.classroom.findUnique.mockResolvedValue({
        classroomId,
        fccUserIds: ['user-1', 'user-2', 'user-3']
      });

      // Only return users without existing FCC Proper IDs
      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' },
        { email: 'student3@test.com' }
      ]);

      getFccProperUserIdByEmail
        .mockResolvedValueOnce('fcc-user-1')
        .mockResolvedValueOnce('fcc-user-3');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      await syncClassroomUserIds(classroomId);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fccProperUserId: null
          })
        })
      );
    });

    it('should accept optional context parameter', async () => {
      const classroomId = 'classroom-123';
      const mockContext = { req: { headers: {} } };

      mockPrisma.classroom.findUnique.mockResolvedValue({
        classroomId,
        fccUserIds: ['user-1']
      });

      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' }
      ]);

      getFccProperUserIdByEmail.mockResolvedValue('fcc-user-1');
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      await syncClassroomUserIds(classroomId, mockContext);

      expect(getFccProperUserIdByEmail).toHaveBeenCalledWith(
        'student1@test.com',
        mockContext
      );
    });
  });

  describe('syncAllUserIds', () => {
    it('should sync user IDs for all users without existing IDs', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' },
        { email: 'student2@test.com' },
        { email: 'student3@test.com' }
      ]);

      getFccProperUserIdByEmail
        .mockResolvedValueOnce('fcc-user-1')
        .mockResolvedValueOnce('fcc-user-2')
        .mockResolvedValueOnce('fcc-user-3');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      const result = await syncAllUserIds();

      expect(result).toEqual({ success: 3, failed: 0 });
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it('should only query users without existing FCC Proper IDs and with email', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await syncAllUserIds();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          fccProperUserId: null,
          email: { not: null }
        },
        select: { email: true }
      });
    });

    it('should handle rate limiting with delays', async () => {
      jest.useFakeTimers();

      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' },
        { email: 'student2@test.com' }
      ]);

      getFccProperUserIdByEmail
        .mockResolvedValueOnce('fcc-user-1')
        .mockResolvedValueOnce('fcc-user-2');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      const promise = syncAllUserIds();
      await jest.runAllTimersAsync();
      await promise;
      jest.useRealTimers();
    });

    it('should track successful and failed syncs', async () => {
      jest.useFakeTimers();
      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' },
        { email: 'student2@test.com' },
        { email: 'student3@test.com' }
      ]);

      // Mix of success and failures
      getFccProperUserIdByEmail
        .mockResolvedValueOnce('fcc-user-1')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('fcc-user-3');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      const resultPromise = syncAllUserIds();
      await jest.runAllTimersAsync();
      expect(resultPromise).toBeDefined();
      const result = await resultPromise;

      jest.useRealTimers();

      expect(result).toEqual({ success: 2, failed: 1 });
    });

    it('should disconnect Prisma after completion', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await syncAllUserIds();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it('should disconnect Prisma even on error', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      try {
        await syncAllUserIds();
      } catch (error) {
        // Expected
      }

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it('should accept optional context parameter', async () => {
      jest.useFakeTimers();
      const mockContext = { req: { headers: {} } };

      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' }
      ]);

      getFccProperUserIdByEmail.mockResolvedValue('fcc-user-1');
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      const promise = syncAllUserIds(mockContext);
      await jest.runAllTimersAsync();
      await promise;

      jest.useRealTimers();

      expect(getFccProperUserIdByEmail).toHaveBeenCalledWith(
        'student1@test.com',
        mockContext
      );
    });
  });

  describe('error handling', () => {
    it('should log and handle Prisma errors', async () => {
      const classroomId = 'classroom-123';

      mockPrisma.classroom.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(syncClassroomUserIds(classroomId)).rejects.toThrow(
        'Database connection failed'
      );

      expect(console.error).toHaveBeenCalled();
    });

    it('should continue syncing even if individual user sync fails', async () => {
      const classroomId = 'classroom-123';

      mockPrisma.classroom.findUnique.mockResolvedValue({
        classroomId,
        fccUserIds: ['user-1', 'user-2', 'user-3']
      });

      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'student1@test.com' },
        { email: 'student2@test.com' },
        { email: 'student3@test.com' }
      ]);

      // First and third succeed, second fails
      getFccProperUserIdByEmail
        .mockResolvedValueOnce('fcc-user-1')
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce('fcc-user-3');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        fccProperUserId: 'fcc-123'
      });

      const result = await syncClassroomUserIds(classroomId);

      expect(result).toEqual({ success: 2, failed: 1 });
    });
  });
});
