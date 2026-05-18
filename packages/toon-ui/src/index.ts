import {
  basicPreset,
  createToonReactRuntime,
  type CreateToonReactRuntimeOptions,
  type ToonReactComponentRegistry,
  type ToonReactRuntime,
} from '@toon-ui/react';

export * from '@toon-ui/core';
export * from '@toon-ui/react';

export function createToonRuntime(
  options: CreateToonReactRuntimeOptions = {},
): ToonReactRuntime {
  const mergedComponents: ToonReactComponentRegistry = {
    ...basicPreset(),
    ...(options.components ?? {}),
  };

  return createToonReactRuntime({
    ...options,
    components: mergedComponents,
  });
}
