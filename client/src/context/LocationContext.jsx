import { createContext, useState, useContext, useEffect } from "react";
import { getDistricts, getTalukas, INDIA_LOCATIONS } from "../data/locations";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [state, setState] = useState(
    () => localStorage.getItem("lokonomy_state") || "Gujarat",
  );
  const [district, setDistrict] = useState(
    () => localStorage.getItem("lokonomy_district") || "",
  );
  const [taluka, setTaluka] = useState(
    () => localStorage.getItem("lokonomy_taluka") || "",
  );
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableTalukas, setAvailableTalukas] = useState([]);

  useEffect(() => {
    const districts = getDistricts(state);
    setAvailableDistricts(districts);

   
    if (district && !districts.includes(district)) {
      setDistrict("");
      setTaluka("");
    }

    if (state) localStorage.setItem("lokonomy_state", state);
    else localStorage.removeItem("lokonomy_state");
  }, [state]);

  useEffect(() => {
    if (district) {
      const talukas = getTalukas(state, district);
      setAvailableTalukas(talukas);

      if (taluka && !talukas.includes(taluka)) {
        setTaluka("");
      }
    } else {
      setAvailableTalukas([]);
    }

    if (district) localStorage.setItem("lokonomy_district", district);
    else localStorage.removeItem("lokonomy_district");
  }, [district, state]);
  useEffect(() => {
    if (taluka) localStorage.setItem("lokonomy_taluka", taluka);
    else localStorage.removeItem("lokonomy_taluka");
  }, [taluka]);

  const value = {
    state,
    setState,
    district,
    setDistrict,
    taluka,
    setTaluka,
    availableStates: Object.keys(INDIA_LOCATIONS),
    availableDistricts,
    availableTalukas,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
