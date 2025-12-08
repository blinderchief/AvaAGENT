import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiClientError } from '@/lib/api-client';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('request', () => {
    it('makes successful GET request', async () => {
      const mockData = { id: '1', name: 'Test' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.get('/api/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('makes successful POST request with body', async () => {
      const requestBody = { name: 'New Item' };
      const mockResponse = { id: '1', ...requestBody };
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.post('/api/test', requestBody);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('handles 204 No Content response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await apiClient.delete('/api/test/1');

      expect(result).toBeNull();
    });

    it('throws ApiClientError on error response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: () => Promise.resolve({ message: 'Not found' }),
      });

      await expect(apiClient.get('/api/test/999')).rejects.toThrow(ApiClientError);
    });

    it('includes authorization header when token is set', async () => {
      apiClient.setTokenGetter(async () => 'test-token');
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('creates error with status and message', () => {
      const error = new ApiClientError('Not found', 404, 'NOT_FOUND');

      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('ApiClientError');
    });

    it('creates error from response', () => {
      const mockResponse = {
        ok: false,
        status: 400,
      } as Response;

      const body = {
        message: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: { field: 'name' },
      };

      const error = ApiClientError.fromResponse(mockResponse, body);

      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid request');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'name' });
    });
  });

  describe('retry logic', () => {
    it('retries on 500 errors', async () => {
      let callCount = 0;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return {
            ok: false,
            status: 500,
            headers: new Headers(),
            json: () => Promise.resolve({ message: 'Server error' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({ success: true }),
        };
      });

      const result = await apiClient.get('/api/test');

      expect(result).toEqual({ success: true });
      expect(callCount).toBe(3);
    });

    it('does not retry on 400 errors', async () => {
      let callCount = 0;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 400,
          headers: new Headers(),
          json: () => Promise.resolve({ message: 'Bad request' }),
        };
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow();
      expect(callCount).toBe(1);
    });
  });
});
