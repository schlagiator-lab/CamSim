import type { Camera } from '../types'

const base = import.meta.env.BASE_URL
const cam = (f: string) => `${base}cameras/${f}`

export const cameras: Camera[] = [
  /* ── Caméras avec photos produit réelles ── */
  {
    id: 'axis-m3085v',
    brand: 'Axis',
    model: 'M3085-V',
    type: 'dome',
    label: 'Mini Dôme 2MP',
    realWidth: 100,
    realHeight: 100,
    color: '#d4d4d4',
    images: {
      front:      cam('axis-m3085v-front.webp'),
      angleLeft:  cam('axis-m3085v-angle-left.webp'),
      angleRight: cam('axis-m3085v-angle-right.webp'),
    },
  },
  {
    id: 'axis-p1475le',
    brand: 'Axis',
    model: 'P1475-LE',
    type: 'bullet',
    label: 'Bullet Ext. 5MP',
    realWidth: 100,
    realHeight: 100,
    color: '#c8c8c8',
    images: {
      front:      cam('axis-p1475le-front.webp'),
      angleLeft:  cam('axis-p1475le-angle-left.webp'),
      angleRight: cam('axis-p1475le-angle-right.webp'),
    },
  },

  /* ── Caméras génériques SVG ── */
  {
    id: 'hik-ds2cd2183g2',
    brand: 'Hikvision',
    model: 'DS-2CD2183G2-I',
    type: 'dome',
    label: 'Dôme 8MP',
    realWidth: 122,
    realHeight: 122,
    color: '#d4d4d4',
  },
  {
    id: 'axis-p3245v',
    brand: 'Axis',
    model: 'P3245-V',
    type: 'dome',
    label: 'Mini Dôme HD',
    realWidth: 102,
    realHeight: 102,
    color: '#c0c0c0',
  },
  {
    id: 'hik-ds2cd2t47g2l',
    brand: 'Hikvision',
    model: 'DS-2CD2T47G2-L',
    type: 'bullet',
    label: 'Bullet 4MP',
    realWidth: 205,
    realHeight: 68,
    color: '#d0d0d0',
  },
  {
    id: 'dahua-ipchfw2849s',
    brand: 'Dahua',
    model: 'IPC-HFW2849S',
    type: 'bullet',
    label: 'Bullet 8MP',
    realWidth: 185,
    realHeight: 65,
    color: '#c8c8c8',
  },
  {
    id: 'axis-q6135le',
    brand: 'Axis',
    model: 'Q6135-LE',
    type: 'ptz',
    label: 'PTZ Ext.',
    realWidth: 220,
    realHeight: 260,
    color: '#b8b8b8',
  },
  {
    id: 'hik-ds2cd63c5g1',
    brand: 'Hikvision',
    model: 'DS-2CD63C5G1',
    type: 'fisheye',
    label: 'Fisheye 12MP',
    realWidth: 150,
    realHeight: 150,
    color: '#d8d8d8',
  },
]
