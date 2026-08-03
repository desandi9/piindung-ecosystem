'use client';

import { CustomerSupportIcon, InformationCircleIcon, Logout03Icon, Notification02Icon, Settings02Icon, UserIcon } from '@hugeicons/core-free-icons';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { formatPhoneNumber, getInitials } from '@/features/gorut-v2/formatters';

import type { KordesHomeProfile } from './kordes-home';
import { MobileServiceIcon } from '../plpk-mobile/mobile-service-icon';
import { MobilePageHeader, MobileSectionHeader } from '../plpk-mobile/mobile-ui';

export function KordesProfileTab({ profile, phone, plpkCount, onNotice }: { profile: KordesHomeProfile; phone: string; plpkCount: number; onNotice: (message: string) => void }) {
  const [notifications, setNotifications] = useState(true);
  const [info, setInfo] = useState<'help' | 'privacy' | 'about' | null>(null);
  const copy = info === 'help' ? ['Bantuan', `Hubungi admin ${profile.upzis} untuk bantuan operasional Kordes.`] : info === 'privacy' ? ['Kebijakan Privasi', 'Data PLPK dan Munfiq hanya digunakan dalam wilayah tugas Kordes.'] : info === 'about' ? ['Tentang Aplikasi', 'GORUT Mobile adalah prototipe aplikasi kerja multi-role Munfiq, PLPK, dan Kordes.'] : null;
  return <><MobilePageHeader title="Profil" subtitle="Akun dan pengaturan Kordes" /><div className="plpk-scroll"><section className="plpk-profile-hero"><div className="plpk-profile-avatar" aria-hidden="true">{getInitials(profile.name)}</div><div><h1>{profile.name}</h1><span>{profile.kordesId}</span><small>Kordes Desa {profile.village}</small></div><span className="plpk-account-badge">Akun Aktif</span></section>
    <MobileSectionHeader title="Informasi Kordes" /><section className="plpk-card"><dl className="plpk-profile-rows"><div><dt>ID Kordes</dt><dd>{profile.kordesId}</dd></div><div><dt>Ranting/desa</dt><dd>Desa {profile.village}</dd></div><div><dt>UPZIS/kecamatan</dt><dd>{profile.upzis}, {profile.kecamatan}</dd></div><div><dt>Nomor HP</dt><dd>{formatPhoneNumber(phone)}</dd></div><div><dt>PLPK binaan</dt><dd>{plpkCount} petugas</dd></div><div><dt>Status akun</dt><dd><span className="plpk-account-inline">Aktif</span></dd></div></dl></section>
    <MobileSectionHeader title="Pengaturan" /><section className="plpk-profile-menu"><div className="plpk-profile-menu-row"><span><MobileServiceIcon icon={Notification02Icon} label="Notifikasi" size={20} /></span><div><strong>Notifikasi</strong><small>Antrean dan pembaruan data PLPK</small></div><button type="button" className={notifications ? 'plpk-switch is-on' : 'plpk-switch'} aria-pressed={notifications} aria-label="Pengaturan notifikasi" onClick={() => { setNotifications((value) => !value); onNotice(`Notifikasi ${notifications ? 'dinonaktifkan' : 'diaktifkan'}.`); }}><i /></button></div><ProfileButton icon={CustomerSupportIcon} title="Bantuan" subtitle="Panduan operasional Kordes" onClick={() => setInfo(info === 'help' ? null : 'help')} /><ProfileButton icon={Settings02Icon} title="Kebijakan Privasi" subtitle="Penggunaan dan perlindungan data" onClick={() => setInfo(info === 'privacy' ? null : 'privacy')} /><ProfileButton icon={InformationCircleIcon} title="Tentang Aplikasi" subtitle="GORUT Mobile multi-role" onClick={() => setInfo(info === 'about' ? null : 'about')} /></section>
    {copy ? <section className="plpk-profile-info"><MobileServiceIcon icon={UserIcon} label={copy[0]} size={20} /><div><strong>{copy[0]}</strong><p>{copy[1]}</p></div></section> : null}<div className="plpk-app-version"><span>Versi aplikasi</span><strong>2.0.0-prototype</strong></div><button type="button" className="plpk-logout-button" onClick={() => onNotice('Fitur keluar dinonaktifkan pada prototipe ini.')}><MobileServiceIcon icon={Logout03Icon} label="Keluar" size={19} />Keluar</button>
  </div></>;
}

function ProfileButton({ icon, title, subtitle, onClick }: { icon: Parameters<typeof MobileServiceIcon>[0]['icon']; title: string; subtitle: string; onClick: () => void }) { return <button type="button" onClick={onClick}><span><MobileServiceIcon icon={icon} label={title} size={20} /></span><div><strong>{title}</strong><small>{subtitle}</small></div><ChevronRight size={18} aria-hidden="true" /></button>; }
