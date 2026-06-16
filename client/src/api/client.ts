import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Unwrap the axios envelope so every resolved value IS the API response body.
// Individual API functions cast the result to ApiResponse<T>.
client.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    // Preserve CanceledError as-is so hooks can detect it via err.name === 'CanceledError'
    // and silently ignore aborted requests instead of showing an error to the user.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    let message = 'An unexpected error occurred';
    if (axios.isAxiosError(error)) {
      const serverMsg = (error.response?.data as { error?: { message?: string } } | undefined)
        ?.error?.message;
      message = serverMsg ?? error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  },
);

export default client;
