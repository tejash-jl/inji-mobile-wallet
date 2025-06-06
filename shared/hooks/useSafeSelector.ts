import {useSelector as xstateUseSelector} from '@xstate/react';

/**
 * Wrapper around xstate's useSelector hook that adds defensive checks
 * to prevent errors when the actor/service is invalid (null or undefined).
 *
 * @param actor The actor/service to select state from
 * @param selector The selector function
 * @param compare Optional compare function
 * @returns Selected state or undefined if actor is invalid
 */
export function useSafeSelector(actor, selector) {
  if (!actor || typeof actor !== 'object') {
    console.warn('useSafeSelector: actor is invalid:', actor);
    // Return undefined or a safe default value
    return undefined;
  }
  return xstateUseSelector(actor, selector);
}
