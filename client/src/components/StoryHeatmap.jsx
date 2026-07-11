import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { HiOutlineXMark, HiOutlineMapPin } from "react-icons/hi2";
import { getTypeColor, getIconForType } from "../utils/storyHelpers";
import { useNavigate } from "react-router-dom";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const storyIcon = () => new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">
      <path fill="#7c3aed" stroke="#fff" stroke-width="2"
        d="M15 0C7.8 0 2 5.8 2 13c0 9.3 13 29 13 29S28 22.3 28 13C28 5.8 22.2 0 15 0z"/>
      <circle fill="#fff" cx="15" cy="13" r="5"/>
    </svg>`),
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const StoryHeatmap = ({ isOpen, onClose, stories }) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const mapStories = stories.filter(s => s.location?.coordinates);
  
  const center = mapStories.length > 0 && mapStories[0].location?.coordinates?.length >= 2
    ? [mapStories[0].location.coordinates[1], mapStories[0].location.coordinates[0]]
    : [22.3, 72.6];

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950 flex flex-col"
    >
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <HiOutlineMapPin size={24} />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Story Heatmap</h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Discover updates nearby</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <HiOutlineXMark size={24} />
        </button>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapStories.map(story => (
            <Marker 
              key={story._id} 
              position={[story.location.coordinates[1], story.location.coordinates[0]]}
              icon={storyIcon()}
            >
              <Popup className="story-popup">
                <div className="p-1 w-48">
                  <div className={`text-[9px] font-bold uppercase mb-1 ${getTypeColor(story.type)}`}>
                    {getIconForType(story.type)} {story.type}
                  </div>
                  <h4 className="text-slate-900 font-bold text-xs mb-1 line-clamp-1">{story.title}</h4>
                  <p className="text-slate-600 text-[10px] line-clamp-2 mb-2">{story.content}</p>
                  <button 
                    onClick={() => navigate(`/stories/${story._id}`)}
                    className="w-full py-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-lg hover:bg-violet-500 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <style>{`
        .story-popup .leaflet-popup-content-wrapper {
          background: #ffffff;
          border-radius: 12px;
          padding: 0;
        }
        .story-popup .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
};

export default StoryHeatmap;
