import {
  createToonReactAdapter,
  createToonReactRuntime,
  type CreateToonReactRuntimeOptions,
  type ToonReactRuntime,
} from '@toon-ui/react';

export * from '@toon-ui/core';
export * from '@toon-ui/react';

export interface CreateToonClientOptions extends CreateToonReactRuntimeOptions {}

export function createToonClient(
  options: CreateToonClientOptions = {},
): ToonReactRuntime {
  const adapter = options.adapter ?? createToonReactAdapter({ level: 'default' });

  return createToonReactRuntime({
    ...options,
    adapter,
  });
}

export const createToonAdapter = createToonReactAdapter;
