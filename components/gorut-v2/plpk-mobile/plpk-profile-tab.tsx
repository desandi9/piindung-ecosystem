'use client';

import {
  CustomerSupportIcon,
  InformationCircleIcon,
  Logout03Icon,
  Notification02Icon,
  Settings02Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { formatDateShort, formatPhoneNumber, getInitials } from '@/features/gorut-v2/formatters';
import type { PlpkProfile } from '@/features/gorut-v2/types';

import { MobileServiceIcon } from './mobile-service-icon';
import { MobilePageHeader, MobileSectionHeader } from './mobile-ui';

type ProfileInfo = 'help' | 'privacy' | 'about' | null;

export function PlpkProfileTab({ profile, onNotice }: { profile: PlpkProfile; onNotice: (message: string) => void }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [openInfo, setOpenInfo] = useState<ProfileInfo>(null);

  const info = openInfo === 'help'
    ? { title: 'Bantuan', description: `Hubungi Kordes ${profile.kordesName} untuk bantuan operasional dan koreksi data penjemputan.` }
    : openInfo === 'privacy'
      ? { title: 'Kebijakan Privasi', description: 'Data Munfiq hanya digunakan untuk kebutuhan operasional penghimpunan sesuai wilayah tugas PLPK.' }
      : openInfo === 'about'
        ? { title: 'Tentang Aplikasi', description: 'GORUT Mobile adalah prototipe aplikasi kerja lapangan multi-role untuk Munfiq, PLPK, dan Kordes.' }
        : null;

  return (
    <>
      <MobilePageHeader title="Profil" subtitle="Akun dan pengaturan PLPK" />
      <div className="plpk-scroll">
        <section className="plpk-profile-hero">
          <div className="plpk-profile-avatar" aria-hidden="true">{getInitials(profile.name)}</div>
          <div><h1>{profile.name}</h1><span>{profile.plpkId}</span><small>Aktif sejak {formatDateShort(profile.joinedAt)}</small></div>
          <span className="plpk-account-badge">Akun Aktif</span>
        </section>

        <MobileSectionHeader title="Informasi Petugas" />
        <section className="plpk-card">
          <dl className="plpk-profile-rows">
            <div><dt>ID PLPK</dt><dd>{profile.plpkId}</dd></div>
            <div><dt>Wilayah tugas</dt><dd>Desa {profile.village}, {profile.kecamatan}</dd></div>
            <div><dt>Nomor HP</dt><dd>{formatPhoneNumber(profile.phone)}</dd></div>
            <div><dt>Kordes</dt><dd>{profile.kordesName}</dd></div>
            <div><dt>Status akun</dt><dd><span className="plpk-account-inline">Aktif</span></dd></div>
          </dl>
        </section>

        <MobileSectionHeader title="Pengaturan" />
        <section className="plpk-profile-menu">
          <div className="plpk-profile-menu-row">
            <span><MobileServiceIcon icon={Notification02Icon} label="Pengaturan notifikasi" size={20} /></span>
            <div><strong>Notifikasi</strong><small>Pengingat periode dan informasi Kordes</small></div>
            <button type="button" className={notificationsEnabled ? 'plpk-switch is-on' : 'plpk-switch'} aria-label="Aktifkan notifikasi" aria-pressed={notificationsEnabled} onClick={() => { setNotificationsEnabled((value) => !value); onNotice(`Notifikasi ${notificationsEnabled ? 'dinonaktifkan' : 'diaktifkan'}.`); }}><i /></button>
          </div>
          <button type="button" onClick={() => setOpenInfo(openInfo === 'help' ? null : 'help')}><span><MobileServiceIcon icon={CustomerSupportIcon} label="Bantuan" size={20} /></span><div><strong>Bantuan</strong><small>Panduan dan kontak Kordes</small></div><ChevronRight size={18} aria-hidden="true" /></button>
          <button type="button" onClick={() => setOpenInfo(openInfo === 'privacy' ? null : 'privacy')}><span><MobileServiceIcon icon={Settings02Icon} label="Kebijakan privasi" size={20} /></span><div><strong>Kebijakan Privasi</strong><small>Penggunaan dan perlindungan data</small></div><ChevronRight size={18} aria-hidden="true" /></button>
          <button type="button" onClick={() => setOpenInfo(openInfo === 'about' ? null : 'about')}><span><MobileServiceIcon icon={InformationCircleIcon} label="Tentang aplikasi" size={20} /></span><div><strong>Tentang Aplikasi</strong><small>GORUT Mobile untuk petugas PLPK</small></div><ChevronRight size={18} aria-hidden="true" /></button>
        </section>

        {info ? <section className="plpk-profile-info"><MobileServiceIcon icon={UserIcon} label={info.title} size={20} /><div><strong>{info.title}</strong><p>{info.description}</p></div></section> : null}

        <div className="plpk-app-version"><span>Versi aplikasi</span><strong>2.0.0-prototype</strong></div>
        <button type="button" className="plpk-logout-button" onClick={() => onNotice('Fitur keluar dinonaktifkan pada prototipe ini.')}><MobileServiceIcon icon={Logout03Icon} label="Keluar" size={19} />Keluar</button>
      </div>
    </>
  );
}
