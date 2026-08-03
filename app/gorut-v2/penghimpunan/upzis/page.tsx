import { redirect } from 'next/navigation';

/** Alias lama sebelum Verifikasi UPZIS dipindah ke /gorut-v2/penghimpunan/verifikasi-upzis. */
export default function PenghimpunanUpzisRedirectPage() { redirect('/gorut-v2/penghimpunan/verifikasi-upzis'); }
