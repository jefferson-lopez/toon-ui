import {
  createToonCoreRuntime,
  type CreateToonUIOptions,
} from '@toon-ui/core';
import {
  basicPreset,
  type ToonReactComponentRegistry,
  type ToonReactRuntime,
} from '@toon-ui/react';

export * from '@toon-ui/core';
export * from '@toon-ui/react';

export function createToonRuntime(
  options: CreateToonUIOptions<ToonReactComponentRegistry> = {},
): ToonReactRuntime {
  const mergedComponents: ToonReactComponentRegistry = {
    ...basicPreset(),
    ...(options.components ?? {}),
  };

  return createToonCoreRuntime<ToonReactComponentRegistry>({
    ...options,
    components: mergedComponents,
  }) as ToonReactRuntime;
}
