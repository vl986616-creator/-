import { SpeciesConfig } from './types';

export const TURTLE_SPECIES: SpeciesConfig[] = [
  {
    id: 'carolina',
    name: 'Terrapene carolina',
    commonName: '东部箱龟',
    defaultCenter: [35.5, -80.0],
    defaultZoom: 6,
  },
  {
    id: 'triunguis',
    name: 'Terrapene triunguis',
    commonName: '三趾箱龟',
    defaultCenter: [36.0, -92.0],
    defaultZoom: 6,
  },
  {
    id: 'ornata',
    name: 'Terrapene ornata',
    commonName: '锦箱龟',
    defaultCenter: [38.0, -98.0],
    defaultZoom: 6,
  },
  {
    id: 'bauri',
    name: 'Terrapene bauri',
    commonName: '佛罗里达箱龟',
    defaultCenter: [27.0, -81.5],
    defaultZoom: 7,
  },
  {
    id: 'major',
    name: 'Terrapene major',
    commonName: '湾岸箱龟',
    defaultCenter: [30.5, -87.0],
    defaultZoom: 7,
  },
  {
    id: 'mexicana',
    name: 'Terrapene mexicana',
    commonName: '墨西哥箱龟',
    defaultCenter: [22.5, -98.5],
    defaultZoom: 7,
  },
  {
    id: 'yucatana',
    name: 'Terrapene yucatana',
    commonName: '尤卡坦箱龟',
    defaultCenter: [20.5, -89.0],
    defaultZoom: 7,
  },
  {
    id: 'coahuila',
    name: 'Terrapene coahuila',
    commonName: '沼泽箱龟',
    defaultCenter: [26.9, -102.1],
    defaultZoom: 9,
  },
  {
    id: 'nelsoni',
    name: 'Terrapene nelsoni',
    commonName: '斑点箱龟',
    defaultCenter: [25.0, -107.0],
    defaultZoom: 7,
  },
];

export const CHINA_CITIES = [
  { name: '哈尔滨', lat: 45.8 },
  { name: '长春', lat: 43.8 },
  { name: '沈阳', lat: 41.8 },
  { name: '北京', lat: 39.9 },
  { name: '济南', lat: 36.6 },
  { name: '郑州', lat: 34.7 },
  { name: '南京', lat: 32.0 },
  { name: '上海', lat: 31.2 },
  { name: '武汉', lat: 30.5 },
  { name: '杭州', lat: 30.2 },
  { name: '长沙', lat: 28.2 },
  { name: '福州', lat: 26.0 },
  { name: '台北', lat: 25.0 },
  { name: '广州', lat: 23.1 },
  { name: '南宁', lat: 22.8 },
  { name: '香港', lat: 22.3 },
  { name: '海口', lat: 20.0 },
];

export const GOOGLE_TERRAIN_URL = 'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}';
export const GOOGLE_HYBRID_URL = 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}';
export const MAP_ATTRIBUTION = '&copy; Google Maps';