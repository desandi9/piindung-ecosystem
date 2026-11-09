import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';
import { serializeGorutMunfiqSelfIdentity } from '@/lib/gorut-munfiq-identity-pure';
import { requireGorutContext } from '@/lib/gorut/server';
import { resolveSwitchableOperationalPersona } from '@/features/gorut-v2/mobile-role-space';

/** Uses the existing Munfiq self guard; an operational role by itself never enables the space. */
export async function hasCurrentMunfiqSpace() {
  const auth = await requireGorutMunfiqContext();
  return !('response' in auth);
}

export async function resolveCurrentMunfiqPresentation() {
  const [munfiqAuth, operationalAuth] = await Promise.all([
    requireGorutMunfiqContext(),
    requireGorutContext(),
  ]);
  if ('response' in munfiqAuth || 'response' in operationalAuth) return null;
  const operationalPersona = resolveSwitchableOperationalPersona(operationalAuth.context.operationalRole);
  if (!operationalPersona) return null;
  return {
    identity: serializeGorutMunfiqSelfIdentity(munfiqAuth.context),
    owner: { userId: munfiqAuth.context.userId, munfiqCode: munfiqAuth.context.munfiqCode },
    operationalPersona,
  };
}
