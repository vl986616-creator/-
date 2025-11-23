import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { ChevronDown, Sliders, Map as MapIcon, ArrowRight, Layers, Maximize2 } from 'lucide-react';
import { TURTLE_SPECIES, GOOGLE_TERRAIN_URL, GOOGLE_HYBRID_URL, MAP_ATTRIBUTION } from './constants';
import { SpeciesConfig, Observation } from './types';
import { searchTaxonId, fetchObservations } from './services/api';
import EcosystemModal from './components/EcosystemModal';

// --- Assets ---
// Manually defining marker icons to avoid build system issues
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const activeFlagHtml = `
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
    <path d="M4 15C4 15 5 16 8 16C11 16 13 14 16 14C19 14 20 15 20 15V3C20 3 19 4 16 4C13 4 11 6 8 6C5 6 4 5 4 5V15Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M4 22V5" stroke="#7f1d1d" stroke-width="2" stroke-linecap="round"/>
  </svg>
`;

const activeIcon = new L.DivIcon({
  html: activeFlagHtml,
  className: 'flag-icon bg-transparent',
  iconSize: [40, 40],
  iconAnchor: [4, 38], // Align bottom of pole
  popupAnchor: [0, -30]
});

// --- Map Controller Helper ---
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

// --- Spatial Hashing Function ---
const getClusteredObservations = (observations: Observation[], gridSizeKm: number) => {
  if (gridSizeKm <= 0) return observations;
  
  // Approx 1 deg lat = 111 km. Grid size in degrees:
  const gridSizeDeg = gridSizeKm / 111;
  const grid: Record<string, Observation> = {};

  observations.forEach(obs => {
    const [lng, lat] = obs.geojson.coordinates;
    const x = Math.floor(lng / gridSizeDeg);
    const y = Math.floor(lat / gridSizeDeg);
    const key = `${x}:${y}`;

    // Prefer Research Grade, then existing
    if (!grid[key]) {
      grid[key] = obs;
    } else {
      if (obs.quality_grade === 'research' && grid[key].quality_grade !== 'research') {
        grid[key] = obs;
      }
    }
  });

  return Object.values(grid);
};

// --- Main App ---
const App: React.FC = () => {
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesConfig>(TURTLE_SPECIES[0]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [filteredObservations, setFilteredObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gridSize, setGridSize] = useState(25); // km
  const [mapType, setMapType] = useState<'terrain' | 'hybrid'>('terrain');
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [showEcosystemModal, setShowEcosystemModal] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setObservations([]);
      setSelectedObs(null);

      const taxonId = await searchTaxonId(selectedSpecies.name);
      if (taxonId) {
        // Fetch 3 pages in parallel for speed
        const [p1, p2, p3] = await Promise.all([
           fetchObservations(taxonId, 1),
           fetchObservations(taxonId, 2),
           fetchObservations(taxonId, 3)
        ]);
        const allObs = [...p1, ...p2, ...p3];
        setObservations(allObs);
      }
      setLoading(false);
    };
    loadData();
  }, [selectedSpecies]);

  // Update Clusters
  useEffect(() => {
    const clustered = getClusteredObservations(observations, gridSize);
    setFilteredObservations(clustered);
  }, [observations, gridSize]);

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const species = TURTLE_SPECIES.find(s => s.id === e.target.value);
    if (species) setSelectedSpecies(species);
  };

  const openEcosystem = () => {
    if (selectedObs) setShowEcosystemModal(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-slate-100">
      {/* Header / Navbar */}
      <div className="z-[1000] absolute top-0 left-0 right-0 bg-white/95 backdrop-blur shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Terrapene Atlas</h1>
            <p className="text-xs text-slate-500">原生环境图谱</p>
          </div>
        </div>

        {/* Species Selector */}
        <div className="flex items-center gap-4">
           <div className="relative group">
             <select 
               className="appearance-none bg-slate-100 hover:bg-slate-200 border-none rounded-full py-2 pl-4 pr-10 text-sm font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
               value={selectedSpecies.id}
               onChange={handleSpeciesChange}
               disabled={loading}
             >
               {TURTLE_SPECIES.map(s => (
                 <option key={s.id} value={s.id}>{s.commonName}</option>
               ))}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
           </div>
        </div>
        
        <div className="flex items-center gap-4 text-slate-600 text-xs sm:text-sm font-medium">
           <div className="hidden md:flex items-center gap-2">
              <span className="whitespace-nowrap">网格</span>
              <input 
                type="range" 
                min="5" 
                max="55" 
                value={gridSize} 
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-24 accent-emerald-600 cursor-pointer"
              />
              <span className="w-10 text-right">{gridSize}km</span>
           </div>
           <div className="text-right">
             <span className="block text-2xl font-bold text-blue-600 leading-none">{filteredObservations.length}</span>
             <span className="text-[10px] text-slate-400 uppercase tracking-wide">有效样本</span>
           </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={selectedSpecies.defaultCenter} 
          zoom={selectedSpecies.defaultZoom} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <MapController center={selectedSpecies.defaultCenter} zoom={selectedSpecies.defaultZoom} />
          
          <TileLayer
            attribution={MAP_ATTRIBUTION}
            url={mapType === 'terrain' ? GOOGLE_TERRAIN_URL : GOOGLE_HYBRID_URL}
            maxZoom={20}
            subdomains={['mt0','mt1','mt2','mt3']}
          />

          <ZoomControl position="bottomright" />

          {/* Markers */}
          {filteredObservations.map(obs => {
            const isSelected = selectedObs?.id === obs.id;
            return (
              <Marker
                key={obs.id}
                position={[obs.geojson.coordinates[1], obs.geojson.coordinates[0]]}
                icon={isSelected ? activeIcon : defaultIcon}
                eventHandlers={{
                  click: () => setSelectedObs(obs),
                }}
              />
            );
          })}
        </MapContainer>

        {/* Map Type Toggle */}
        <div className="absolute bottom-6 right-16 z-[500] bg-white rounded-lg shadow-lg p-1 flex">
          <button 
            onClick={() => setMapType('terrain')}
            className={`p-2 rounded-md transition-colors ${mapType === 'terrain' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
            title="地形图"
          >
            <MapIcon size={20} />
          </button>
          <button 
            onClick={() => setMapType('hybrid')}
            className={`p-2 rounded-md transition-colors ${mapType === 'hybrid' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
            title="卫星图"
          >
            <Layers size={20} />
          </button>
        </div>
      </div>

      {/* Floating Detail Card (Bottom Left) */}
      {selectedObs && (
        <div className="absolute bottom-6 left-4 md:left-6 z-[1000] w-[calc(100%-2rem)] md:w-96 bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden border border-white/50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            className="absolute top-2 right-2 p-1 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors z-10"
            onClick={() => setSelectedObs(null)}
          >
            <ChevronDown size={16} />
          </button>

          <div className="relative h-48 bg-slate-200 group">
             <img 
               src={selectedObs.photos[0]?.url.replace('square', 'medium')} 
               alt="Turtle" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                <span className="text-white text-lg font-bold">{selectedObs.taxon.preferred_common_name}</span>
                <span className="text-slate-300 text-sm italic">{selectedObs.taxon.name}</span>
             </div>
             
             {/* Open Full Screen Action */}
             <button 
                onClick={openEcosystem}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 backdrop-blur border border-white/40 text-white px-4 py-2 rounded-full flex items-center gap-2"
             >
                <Maximize2 size={16} /> 查看详情
             </button>
          </div>

          <div className="p-4">
             <div className="flex justify-between items-start mb-4">
               <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">观测日期</div>
                  <div className="text-slate-800 text-sm font-medium">{selectedObs.observed_on}</div>
               </div>
               <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">地点</div>
                  <div className="text-slate-800 text-sm font-medium">{selectedObs.location}</div>
               </div>
             </div>

             <button 
               onClick={openEcosystem}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
             >
               开启原生生态链 <ArrowRight size={18} />
             </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          正在获取生物多样性数据...
        </div>
      )}

      {/* Ecosystem Full Screen Modal */}
      {showEcosystemModal && selectedObs && (
        <EcosystemModal 
          observation={selectedObs} 
          onClose={() => setShowEcosystemModal(false)} 
        />
      )}
    </div>
  );
};

export default App;