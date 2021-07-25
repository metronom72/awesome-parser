import { JobOptions } from 'bull';

const DEFAULT_ATTEMPTS = 10;

export const defaultOptions: JobOptions = {
  attempts: DEFAULT_ATTEMPTS,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

export const getJobOpts = () => {
  return defaultOptions;
};
