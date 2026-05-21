export type MunfiqPlpkRow = {
  id: string
  kodeMunfiq: string
  nama: string
  alamat: string
  noHp: string
  upzis: string
  ranting: string
  plpkCode: string
  plpkName: string
  periode: string
  tanggalJemput?: string
  koinTerjemput: number
  status: 'Terverifikasi' | 'Tidak Terjemput'
}

export type PlpkKordesRow = {
  id: string
  upzis: string
  ranting: string
  kordes: string
  kordesContact: string
  plpkCode: string
  plpkName: string
  periode: string
  aktif: number
  terjemput: number
  koinTerjemput: number
  status: 'Terverifikasi Kordes' | 'Perlu Review'
}

export type KordesUpzisRow = {
  id: string
  upzis: string
  ketuaUpzis: string
  ketuaUpzisContact: string
  rantingCode: string
  ranting: string
  periode: string
  aktif: number
  terjemput: number
  perolehan: number
  status: 'Terverifikasi UPZIS' | 'Perlu Review'
}

export type UpzisPcRow = {
  id: string
  upzisCode: string
  upzis: string
  ketuaUpzis: string
  ketuaUpzisContact: string
  periode: string
  aktif: number
  terjemput: number
  koinTerjemput: number
  status: 'Terverifikasi Fundraising' | 'Menunggu PC'
}

export const gocapPeriods = ['Agustus 2025', 'September 2025', 'Oktober 2025']

export const munfiqPlpkRows: MunfiqPlpkRow[] = [
  { id: '1', kodeMunfiq: 'GK00100001', nama: 'H. Dadan Ramdani', alamat: 'Pakuwon, Garut Kota', noHp: '0812-1111-0001', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Pakuwon', plpkCode: 'PG-Q030001', plpkName: 'Ahmad Fadil', periode: 'Oktober 2025', tanggalJemput: '2025-10-03 09:15', koinTerjemput: 250000, status: 'Terverifikasi' },
  { id: '2', kodeMunfiq: 'GK00100002', nama: 'Siti Fatimah', alamat: 'Regol, Garut Kota', noHp: '0812-1111-0002', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Regol', plpkCode: 'PG-Q030001', plpkName: 'Ahmad Fadil', periode: 'Oktober 2025', tanggalJemput: '2025-10-03 11:00', koinTerjemput: 60000, status: 'Terverifikasi' },
  { id: '3', kodeMunfiq: 'GK00100003', nama: 'H. Ahmad Sulaiman', alamat: 'Pakuwon, Garut Kota', noHp: '0812-1111-0003', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Pakuwon', plpkCode: 'PG-Q030001', plpkName: 'Ahmad Fadil', periode: 'Oktober 2025', tanggalJemput: '2025-10-04 08:30', koinTerjemput: 125000, status: 'Terverifikasi' },
  { id: '4', kodeMunfiq: 'GK00700004', nama: 'Ahmad Fatimah', alamat: 'Kota Wetan, Garut Kota', noHp: '0812-1111-0004', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Kota Wetan', plpkCode: 'PG-Q030006', plpkName: 'Tunjiah', periode: 'Oktober 2025', koinTerjemput: 0, status: 'Tidak Terjemput' },
  { id: '5', kodeMunfiq: 'GK00700005', nama: 'H. Endang Nurhayati', alamat: 'Kota Wetan, Garut Kota', noHp: '0812-1111-0005', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Kota Wetan', plpkCode: 'PG-Q030006', plpkName: 'Tunjiah', periode: 'Oktober 2025', tanggalJemput: '2025-10-05 10:45', koinTerjemput: 80000, status: 'Terverifikasi' },
]

export const plpkKordesRows: PlpkKordesRow[] = [
  { id: '1', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Pakuwon', kordes: 'Wardoyo', kordesContact: '0813-1111-1001', plpkCode: 'PG-Q030001', plpkName: 'Ahmad Fadil', periode: 'Oktober 2025', aktif: 37, terjemput: 30, koinTerjemput: 5214600, status: 'Terverifikasi Kordes' },
  { id: '2', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Regol', kordes: 'Wardoyo', kordesContact: '0813-1111-1001', plpkCode: 'PG-Q030002', plpkName: 'Dedi Kurniawan', periode: 'Oktober 2025', aktif: 35, terjemput: 25, koinTerjemput: 949500, status: 'Terverifikasi Kordes' },
  { id: '3', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Kota Wetan', kordes: 'Wardoyo', kordesContact: '0813-1111-1001', plpkCode: 'PG-Q030006', plpkName: 'Tunjiah', periode: 'Oktober 2025', aktif: 28, terjemput: 26, koinTerjemput: 702500, status: 'Terverifikasi Kordes' },
  { id: '4', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Jayawaras', kordes: 'Wardoyo', kordesContact: '0813-1111-1001', plpkCode: 'PG-Q030004', plpkName: 'Deni Rahman', periode: 'Oktober 2025', aktif: 42, terjemput: 31, koinTerjemput: 1560000, status: 'Perlu Review' },
  { id: '5', upzis: 'UPZIS Garut Kota', ranting: 'Ranting Sukamentri', kordes: 'Wardoyo', kordesContact: '0813-1111-1001', plpkCode: 'PG-Q030007', plpkName: 'Yusuf Kurnia', periode: 'Oktober 2025', aktif: 33, terjemput: 29, koinTerjemput: 1110000, status: 'Terverifikasi Kordes' },
]

export const kordesUpzisRows: KordesUpzisRow[] = [
  { id: '1', upzis: 'UPZIS Garut Kota', ketuaUpzis: 'Qoribul Husni, S.Mat', ketuaUpzisContact: '0812-7777-2001', rantingCode: '33.01.06.2003', ranting: 'Pakuwon', periode: 'Oktober 2025', aktif: 129, terjemput: 114, perolehan: 2393400, status: 'Terverifikasi UPZIS' },
  { id: '2', upzis: 'UPZIS Garut Kota', ketuaUpzis: 'Qoribul Husni, S.Mat', ketuaUpzisContact: '0812-7777-2001', rantingCode: '33.01.06.2010', ranting: 'Regol', periode: 'Oktober 2025', aktif: 107, terjemput: 89, perolehan: 1942200, status: 'Terverifikasi UPZIS' },
  { id: '3', upzis: 'UPZIS Garut Kota', ketuaUpzis: 'Qoribul Husni, S.Mat', ketuaUpzisContact: '0812-7777-2001', rantingCode: '33.01.06.2016', ranting: 'Kota Wetan', periode: 'Oktober 2025', aktif: 236, terjemput: 136, perolehan: 7946100, status: 'Terverifikasi UPZIS' },
  { id: '4', upzis: 'UPZIS Garut Kota', ketuaUpzis: 'Qoribul Husni, S.Mat', ketuaUpzisContact: '0812-7777-2001', rantingCode: '33.01.06.2018', ranting: 'Jayawaras', periode: 'Oktober 2025', aktif: 98, terjemput: 63, perolehan: 1685400, status: 'Perlu Review' },
]

export const upzisPcRows: UpzisPcRow[] = [
  { id: '1', upzisCode: '33.01.03', upzis: 'UPZIS Garut Kota', ketuaUpzis: 'Suratno, M.Pd', ketuaUpzisContact: '089895444096', periode: 'Oktober 2025', aktif: 3872, terjemput: 2175, koinTerjemput: 52781600, status: 'Terverifikasi Fundraising' },
  { id: '2', upzisCode: '33.01.20', upzis: 'UPZIS Tarogong Kaler', ketuaUpzis: 'Maman Suherman', ketuaUpzisContact: '0813-5555-4402', periode: 'Oktober 2025', aktif: 2121, terjemput: 965, koinTerjemput: 17672300, status: 'Terverifikasi Fundraising' },
  { id: '3', upzisCode: '33.01.04', upzis: 'UPZIS Tarogong Kidul', ketuaUpzis: 'Cecep Kurnia', ketuaUpzisContact: '0813-5555-4403', periode: 'Oktober 2025', aktif: 4901, terjemput: 3420, koinTerjemput: 70644300, status: 'Terverifikasi Fundraising' },
  { id: '4', upzisCode: '33.01.05', upzis: 'UPZIS Karangpawitan', ketuaUpzis: 'Asep Maulana', ketuaUpzisContact: '0813-5555-4404', periode: 'Oktober 2025', aktif: 651, terjemput: 308, koinTerjemput: 13591600, status: 'Menunggu PC' },
]

export function calculatePercentage(terjemput: number, aktif: number) {
  if (!aktif) return 0
  return (terjemput / aktif) * 100
}

export function calculateAverage(koinTerjemput: number, terjemput: number) {
  if (!terjemput) return 0
  return koinTerjemput / terjemput
}

export function calculatePlpkBisyaroh(terjemput: number) {
  return terjemput * 2000
}

export function calculateKordesBisyaroh(terjemput: number) {
  return terjemput * 2500
}
