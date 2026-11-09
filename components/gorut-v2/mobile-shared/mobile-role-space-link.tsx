'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { beginMobileRoleSpaceTransition } from '@/features/gorut-v2/mobile-role-transition';

export function MobileRoleSpaceLink({ onClick, prefetch = false, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={prefetch} onClick={(event) => {
    beginMobileRoleSpaceTransition();
    onClick?.(event);
  }} />;
}
