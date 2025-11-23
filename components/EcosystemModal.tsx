import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Wind, Droplets, Map as MapIcon, Layers, Leaf, Bug, Cat } from 'lucide-react';
import { Observation, WeatherData, BiotaResult } from '../types';
import { fetchHistoricalWeather, fetchNearbyBiota } from '../services/api';
import { CHINA_CITIES } from '../constants';
import ClimateChart from './ClimateChart';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  observation: Observation | null;
  onClose: () => void;
}

const EcosystemModal: React.FC<Props> = ({ observation, onClose }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [biota, setBiota] = useState<BiotaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'climate' | 'map' | 'biota'>('climate');

  useEffect(() => {
    if (!observation) return;

    const loadData = async () => {
      setLoading(true);
      const [lng, lat] = observation.geojson.coordinates;
      
      const [weatherData, biotaData] = await Promise.all([
        fetchHistoricalWeather(lat, lng),
        fetchNearbyBiota(lat, lng)
      ]);
      
      setWeather(weatherData);
      setBiota(biotaData);
      setLoading(false);
    };

    loadData();
  }, [observation]);

  if (!observation) return null;

  const [lng, lat] = observation.geojson.coordinates;
  const similarCity = CHINA_CITIES.reduce((prev, curr) => {
    return (Math.abs(curr.lat - lat) < Math.abs(prev.lat - lat) ? curr : prev);
  });
  
  const latDiff = Math.abs(similarCity.lat - lat);
  const isSimilar = latDiff < 2;

  // Custom icon for mini map
  const miniIcon = new L.DivIcon({
    className: 'bg-transparent',
    html: `<div class="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        {/* Left Column: Visuals & Header */}
        <div className="w-full md:w-5/12 h-1/2 md:h-full bg-slate-100 flex flex-col">
          <div className="h-3/5 w-full relative">
            <img 
              src={observation.photos[0]?.url.replace('square', 'large') || 'https://picsum.photos/800/600'} 
              className="w-full h-full object-cover"
              alt={observation.taxon.name}
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
              <h2 className="text-3xl font-bold text-white mb-1">{observation.taxon.preferred_common_name}</h2>
              <p className="text-slate-300 italic text-lg">{observation.taxon.name}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-0.5 bg-green-500/80 text-white text-xs rounded font-bold uppercase">
                  {observation.quality_grade === 'research' ? 'RG (研究级)' : observation.quality_grade}
                </span>
                <span className="text-white/80 text-sm">{observation.observed_on}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 bg-slate-50 overflow-y-auto">
             <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">地理位置</h3>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">样本坐标</span>
                    <span className="font-mono text-slate-800 text-sm">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                  </div>
                  {isSimilar && (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      <MapIcon size={16} />
                      <span>纬度相近：<strong>{similarCity.name}</strong> ({similarCity.lat}°)</span>
                    </div>
                  )}
                  <a 
                    href={`https://earth.google.com/web/@${lat},${lng},1000d,35y,0h,0t,0r`}
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Layers size={16} /> Google Earth 3D 视图
                  </a>
                </div>
             </div>
             
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                 <h4 className="text-orange-800 font-bold text-sm mb-2 flex items-center gap-2">
                   <Bug size={16} /> 生态位网络
                 </h4>
                 <p className="text-orange-700/80 text-xs leading-relaxed">
                   基于该地理位置，该样本可能栖息于中生林生物群落。其生态位与白尾鹿及多种林地昆虫重叠。
                 </p>
             </div>
          </div>
        </div>

        {/* Right Column: Data Analysis */}
        <div className="w-full md:w-7/12 h-1/2 md:h-full bg-white flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-6 pt-4">
            <button 
              onClick={() => setActiveTab('climate')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'climate' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              气候环境
            </button>
            <button 
              onClick={() => setActiveTab('map')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'map' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              3D 地形
            </button>
            <button 
              onClick={() => setActiveTab('biota')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'biota' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              原生生物 (15km)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 relative">
            {loading && (
               <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
               </div>
            )}

            {activeTab === 'climate' && (
              <div className="space-y-6">
                 {weather ? <ClimateChart data={weather} /> : <p className="text-slate-400 text-sm">正在加载气候数据...</p>}
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Wind size={16} /> <span className="text-xs font-bold uppercase">湿度范围</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-700">
                        {weather ? `${Math.min(...weather.relative_humidity_2m_mean).toFixed(0)} - ${Math.max(...weather.relative_humidity_2m_mean).toFixed(0)}%` : '--'}
                      </div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Droplets size={16} /> <span className="text-xs font-bold uppercase">平均气温</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-700">
                        {weather ? `${(weather.temperature_2m_mean.reduce((a,b)=>a+b,0) / weather.temperature_2m_mean.length).toFixed(1)}°C` : '--'}
                      </div>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 map-3d-container bg-slate-100">
                <div className="map-3d-target w-full h-full">
                  <MapContainer 
                    center={[lat, lng]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    attributionControl={false}
                  >
                    <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" />
                    <Marker position={[lat, lng]} icon={miniIcon} />
                  </MapContainer>
                </div>
                <div className="absolute bottom-8 left-8 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur">
                  模拟低空俯瞰视角
                </div>
              </div>
            )}

            {activeTab === 'biota' && biota && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-bold text-green-700 text-sm uppercase">
                    <Leaf size={16} /> 伴生植物
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {biota.plants.length > 0 ? biota.plants.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-green-50 p-2 rounded-lg border border-green-100">
                        <img src={p.photos[0]?.url} className="w-10 h-10 rounded-md object-cover" alt="" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-green-900">{p.taxon.preferred_common_name}</p>
                          <p className="text-xs text-green-700/70 italic truncate">{p.taxon.name}</p>
                        </div>
                      </div>
                    )) : <p className="text-xs text-slate-400">暂无记录</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-bold text-amber-700 text-sm uppercase">
                    <Bug size={16} /> 昆虫/软体
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {biota.insects.length > 0 ? biota.insects.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <img src={p.photos[0]?.url} className="w-10 h-10 rounded-md object-cover" alt="" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-amber-900">{p.taxon.preferred_common_name}</p>
                          <p className="text-xs text-amber-700/70 italic truncate">{p.taxon.name}</p>
                        </div>
                      </div>
                    )) : <p className="text-xs text-slate-400">暂无记录</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-bold text-slate-700 text-sm uppercase">
                    <Cat size={16} /> 共栖动物
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {biota.animals.length > 0 ? biota.animals.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <img src={p.photos[0]?.url} className="w-10 h-10 rounded-md object-cover" alt="" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-slate-900">{p.taxon.preferred_common_name}</p>
                          <p className="text-xs text-slate-500 italic truncate">{p.taxon.name}</p>
                        </div>
                      </div>
                    )) : <p className="text-xs text-slate-400">暂无记录</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 flex justify-end">
             <a 
               href={`https://www.inaturalist.org/observations/${observation.id}`}
               target="_blank"
               rel="noreferrer"
               className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
             >
               在 iNaturalist 查看原帖 <ExternalLink size={14} />
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcosystemModal;