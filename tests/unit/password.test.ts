import { hashPassword, comparePassword } from '../../src/utils/password';

describe('Password Utils', () => {
  const testPassword = 'testPassword123!';

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const hashedPassword = await hashPassword(testPassword);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });
  });

  describe('comparePassword', () => {
    let hashedPassword: string;

    beforeEach(async () => {
      hashedPassword = await hashPassword(testPassword);
    });

    it('should return true for correct password', async () => {
      const isValid = await comparePassword(testPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isValid = await comparePassword('wrongPassword', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const isValid = await comparePassword('', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash', async () => {
      await expect(comparePassword(testPassword, 'invalid-hash')).rejects.toThrow();
    });
  });
});