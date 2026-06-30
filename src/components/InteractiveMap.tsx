import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  MapPin, 
  Layers, 
  Filter, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  X,
  Compass,
  Check,
  Building,
  User,
  Activity,
  Award,
  ChevronDown,
  Navigation,
  SlidersHorizontal,
  Info,
  Calendar,
  AlertCircle,
  Radar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Issue, IssueCategory, IssueSeverity, IssueStatus } from "../types";
import L from "leaflet";

// Haversine distance calculator in km
export function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

// Map color-strategy helper to match exact guidelines:
// 🔴 Red: Urgent (Severity = Critical or High)
// 🟡 Yellow: In Progress (Status = "In Progress")
// 🟢 Green: Fixed (Status = "Resolved" or "Closed")
// 🔵 Blue: Newly Reported (Status = "Reported" or "Verified" or "Assigned")
export function getIssueColor(issue: Issue): { hex: string; bgClass: string; textClass: string; ringClass: string; label: string; markerEmoji: string } {
  if (issue.status === "Resolved" || issue.status === "Closed") {
    return { 
      hex: "#10b981", 
      bgClass: "bg-emerald-500", 
      textClass: "text-emerald-700 dark:text-emerald-400", 
      ringClass: "ring-emerald-100 dark:ring-emerald-950/40",
      label: "Fixed",
      markerEmoji: "🟢"
    };
  }
  if (issue.status === "In Progress") {
    return { 
      hex: "#f59e0b", 
      bgClass: "bg-amber-500", 
      textClass: "text-amber-700 dark:text-amber-400", 
      ringClass: "ring-amber-100 dark:ring-amber-950/40",
      label: "In Progress",
      markerEmoji: "🟡"
    };
  }
  if (issue.severity === "Critical" || issue.severity === "High") {
    return { 
      hex: "#ef4444", 
      bgClass: "bg-rose-500", 
      textClass: "text-rose-700 dark:text-rose-400", 
      ringClass: "ring-rose-100 dark:ring-rose-950/40",
      label: "Urgent",
      markerEmoji: "🔴"
    };
  }
  return { 
    hex: "#3b82f6", 
    bgClass: "bg-blue-500", 
    textClass: "text-blue-700 dark:text-blue-400", 
    ringClass: "ring-blue-100 dark:ring-blue-950/40",
    label: "Newly Reported",
    markerEmoji: "🔵"
  };
}

export function getFallbackAddress(lat: number, lng: number) {
  const isKanpur = lat > 25.5 && lat < 27.2 && lng > 79.5 && lng < 81.5;
  const isNoida = lat > 28.0 && lat < 29.0 && lng > 77.0 && lng < 78.0;
  
  const mockSectors = ["Sector 15", "Sector 12", "Sector 18", "Sector 22", "Sector 19", "Sector 62"];
  const mockFeatures = ["Main Road", "Community Center", "Market Lane", "Park View", "Metro Station Exit", "Crossing Road"];
  const randomSec = mockSectors[Math.floor(Math.random() * mockSectors.length)];
  const randomFeat = mockFeatures[Math.floor(Math.random() * mockFeatures.length)];

  if (isKanpur) {
    const kanpurAreas = ["Kalyanpur", "Swaroop Nagar", "Civil Lines", "Kidwai Nagar", "Kakadeo", "Azad Nagar", "Sharda Nagar", "Barra", "Mall Road"];
    const area = kanpurAreas[Math.floor(Math.random() * kanpurAreas.length)];
    return `${randomFeat}, Near ${randomSec}, ${area}, Kanpur, Uttar Pradesh, 208001, India`;
  } else if (isNoida) {
    return `${randomFeat}, ${randomSec}, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301, India`;
  }
  return `${randomFeat}, Local Sector, Town Center, Uttar Pradesh, India`;
}

export function reverseGeocode(
  lat: number,
  lng: number,
  callback: (
    address: string,
    details?: {
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    }
  ) => void
) {
  fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`)
    .then((res) => {
      if (!res.ok) throw new Error("Server proxy failed");
      return res.json();
    })
    .then((data) => {
      if (data && data.display_name) {
        const address = data.display_name;
        const details = data.address || {};
        const city = details.city || details.town || details.village || details.suburb || "";
        const state = details.state || "";
        const country = details.country || "";
        const postalCode = details.postcode || "";
        callback(address, {
          city,
          state,
          country,
          postalCode
        });
      } else {
        const fallback = getFallbackAddress(lat, lng);
        callback(fallback, {
          city: "Noida",
          state: "Uttar Pradesh",
          country: "India",
          postalCode: "201301"
        });
      }
    })
    .catch((err) => {
      console.error("OSM Geocoding failed, using fallback:", err);
      const fallback = getFallbackAddress(lat, lng);
      callback(fallback, {
        city: "Noida",
        state: "Uttar Pradesh",
        country: "India",
        postalCode: "201301"
      });
    });
}

interface InteractiveMapProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onDropPin?: (coords: { lat: number; lng: number; address: string; city?: string; state?: string; country?: string; postalCode?: string }) => void;
  lang: 'en' | 'hi';
}

export default function InteractiveMap({ issues, onSelectIssue, onDropPin, lang }: InteractiveMapProps) {
  // Sidebar Tabs
  const [activeTab, setActiveTab] = useState<"filters" | "radar">("filters");

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true); // Enabled by default for clean rendering
  
  // Custom pin dropping
  const [droppedPin, setDroppedPin] = useState<{ 
    lat: number; 
    lng: number; 
    address: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  } | null>(null);

  // Search Map Coordinates
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Radar/Nearby Issue Detection states
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [radarRadius, setRadarRadius] = useState<number>(2.5); // 2.5 km default
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMobileIssue, setSelectedMobileIssue] = useState<Issue | null>(null);

  // References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const radarCircleLayerRef = useRef<L.Circle | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const droppedPinMarkerRef = useRef<L.Marker | null>(null);

  // Base list of filtered issues based on filters & search queries
  const baseFilteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (selectedCategory !== "All" && issue.category !== selectedCategory) return false;
      if (selectedSeverity !== "All" && issue.severity !== selectedSeverity) return false;
      if (selectedStatus !== "All" && issue.status !== selectedStatus) return false;
      
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          issue.id.toLowerCase().includes(query) ||
          (issue.coordinates.address && issue.coordinates.address.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [issues, selectedCategory, selectedSeverity, selectedStatus, searchQuery]);

  // Compute reference center for the Radar
  const radarCenter = useMemo(() => {
    if (userCoords) return userCoords;
    if (droppedPin) return { lat: droppedPin.lat, lng: droppedPin.lng };
    return { lat: 28.5355, lng: 77.3910 }; // Default Noida
  }, [userCoords, droppedPin]);

  // Final issues incorporating Radar filter if enabled
  const finalFilteredIssues = useMemo(() => {
    if (!radarEnabled) return baseFilteredIssues;
    return baseFilteredIssues.filter(issue => {
      const distance = getDistanceInKm(
        radarCenter.lat,
        radarCenter.lng,
        issue.coordinates.lat,
        issue.coordinates.lng
      );
      return distance <= radarRadius;
    });
  }, [baseFilteredIssues, radarEnabled, radarCenter, radarRadius]);

  // Compute nearby list with distances for display in sidebar Radar panel
  const nearbyIssuesWithDistance = useMemo(() => {
    return baseFilteredIssues
      .map(issue => {
        const distance = getDistanceInKm(
          radarCenter.lat,
          radarCenter.lng,
          issue.coordinates.lat,
          issue.coordinates.lng
        );
        return { issue, distance };
      })
      .filter(item => item.distance <= radarRadius)
      .sort((a, b) => a.distance - b.distance);
  }, [baseFilteredIssues, radarCenter, radarRadius]);

  // GPS/Geolocation logic
  const detectUserLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 14);
            
            // Add or update blue marker for user location
            if (userLocationMarkerRef.current) {
              userLocationMarkerRef.current.setLatLng([latitude, longitude]);
            } else {
              const bluePulseIcon = L.divIcon({
                className: 'user-location-marker',
                html: `
                  <div class="relative flex items-center justify-center">
                    <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-40 animate-ping"></div>
                    <div class="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });
              
              const userMarker = L.marker([latitude, longitude], { icon: bluePulseIcon })
                .addTo(mapRef.current)
                .bindPopup(`<b>${lang === 'en' ? 'Your Current GPS Location' : 'आपकी वर्तमान जीपीएस स्थिति'}</b>`);
              userLocationMarkerRef.current = userMarker;
            }
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Search Address using Nominatim
  const handleLocationSearch = () => {
    if (!locationSearchQuery.trim()) return;
    setIsSearchingLocation(true);
    fetch(`/api/geocode/search?q=${encodeURIComponent(locationSearchQuery)}`)
      .then(res => {
        if (!res.ok) throw new Error("Server search proxy failed");
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const targetLat = parseFloat(lat);
          const targetLng = parseFloat(lon);
          if (mapRef.current) {
            mapRef.current.setView([targetLat, targetLng], 14);
            
            // Auto drop a marker at the searched location to make report easy
            reverseGeocode(targetLat, targetLng, (resolvedAddress, details) => {
              const pin = { 
                lat: targetLat, 
                lng: targetLng, 
                address: resolvedAddress,
                ...details
              };
              setDroppedPin(pin);
              if (onDropPin) {
                onDropPin(pin);
              }
            });
          }
        } else {
          alert(lang === 'en' ? "Location not found" : "स्थान नहीं मिला");
        }
      })
      .catch(err => {
        console.error("Nominatim search failed:", err);
      })
      .finally(() => {
        setIsSearchingLocation(false);
      });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map and center on Noida/Delhi Area by default
    const map = L.map(mapContainerRef.current, {
      center: [28.5355, 77.3910],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Load OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    // Try locating user automatically
    detectUserLocation();

    // Map Click - Drag/Drop Pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickedLat = parseFloat(e.latlng.lat.toFixed(5));
      const clickedLng = parseFloat(e.latlng.lng.toFixed(5));

      reverseGeocode(clickedLat, clickedLng, (resolvedAddress, details) => {
        const pin = { 
          lat: clickedLat, 
          lng: clickedLng, 
          address: resolvedAddress,
          ...details
        };
        setDroppedPin(pin);
        if (onDropPin) {
          onDropPin(pin);
        }
      });
    });

    // Event Delegation: listen to opened popup's Details button click
    map.on('popupopen', (e) => {
      const popup = e.popup;
      const container = popup.getElement();
      if (container) {
        const btn = container.querySelector('.view-details-btn');
        if (btn) {
          const issueId = btn.getAttribute('data-issue-id');
          btn.addEventListener('click', () => {
            const found = issues.find(i => i.id === issueId);
            if (found) {
              onSelectIssue(found);
            }
          });
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Dropped Pin Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (droppedPinMarkerRef.current) {
      droppedPinMarkerRef.current.remove();
      droppedPinMarkerRef.current = null;
    }

    if (droppedPin) {
      const pinIcon = L.divIcon({
        className: 'custom-dropped-pin',
        html: `
          <div class="relative flex items-center justify-center animate-bounce">
            <div class="w-9 h-9 rounded-full bg-indigo-650 border-2 border-white flex items-center justify-center shadow-xl text-white">
              <span class="text-xs">📍</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const pinMarker = L.marker([droppedPin.lat, droppedPin.lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans">
            <b class="text-xs text-slate-800">${lang === 'en' ? 'Selected Workspace Location' : 'चुना गया नया स्थान'}</b>
            <p class="text-[10px] text-slate-500 mt-1">${droppedPin.address}</p>
          </div>
        `);
      
      droppedPinMarkerRef.current = pinMarker;
    }
  }, [droppedPin, lang]);

  // Draw or update Radar Circle overlay on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (radarCircleLayerRef.current) {
      radarCircleLayerRef.current.remove();
      radarCircleLayerRef.current = null;
    }

    if (radarEnabled) {
      const circle = L.circle([radarCenter.lat, radarCenter.lng], {
        radius: radarRadius * 1000, // in meters
        color: '#6366f1',
        weight: 1.5,
        dashArray: '5, 10',
        fillColor: '#818cf8',
        fillOpacity: 0.1
      }).addTo(map);

      radarCircleLayerRef.current = circle;
    }
  }, [radarEnabled, radarCenter, radarRadius]);

  // Update Markers, Clustering and Heatmap layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous issue markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear previous heatmap layers
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.clearLayers();
    } else {
      heatmapLayerRef.current = L.layerGroup().addTo(map);
    }

    // 1. Heatmap draw logic
    if (showHeatmap) {
      finalFilteredIssues.forEach((issue) => {
        const { lat, lng } = issue.coordinates;
        const color = getIssueColor(issue);
        const radius = issue.severity === "Critical" ? 380 : issue.severity === "High" ? 280 : 180;
        
        // Translucent glow circles
        L.circle([lat, lng], {
          radius: radius * 1.6,
          color: color.hex,
          weight: 0,
          fillColor: color.hex,
          fillOpacity: 0.12
        }).addTo(heatmapLayerRef.current!);

        L.circle([lat, lng], {
          radius: radius * 0.7,
          color: color.hex,
          weight: 0,
          fillColor: color.hex,
          fillOpacity: 0.38
        }).addTo(heatmapLayerRef.current!);
      });
    }

    // 2. Clustering vs normal markers draw
    if (showClusters) {
      const clusters: { [key: string]: Issue[] } = {};
      const scale = map.getZoom();
      // Grid sizing scales with zoom levels
      const clusterGridSize = 0.0055 * Math.pow(2, 13 - scale); 

      finalFilteredIssues.forEach(issue => {
        const gridX = Math.round(issue.coordinates.lat / clusterGridSize);
        const gridY = Math.round(issue.coordinates.lng / clusterGridSize);
        const key = `${gridX}_${gridY}`;
        if (!clusters[key]) {
          clusters[key] = [];
        }
        clusters[key].push(issue);
      });

      Object.keys(clusters).forEach(key => {
        const group = clusters[key];
        if (group.length === 1) {
          createMarkerForIssue(group[0]);
        } else {
          const avgLat = group.reduce((sum, i) => sum + i.coordinates.lat, 0) / group.length;
          const avgLng = group.reduce((sum, i) => sum + i.coordinates.lng, 0) / group.length;

          // Glowing glassmorphic cluster indicator
          const clusterIcon = L.divIcon({
            className: 'custom-cluster-marker',
            html: `
              <div class="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 border border-indigo-400 text-white text-xs font-black shadow-2xl relative">
                <div class="absolute inset-0 rounded-full border border-indigo-500/40 animate-ping"></div>
                <span>${group.length}</span>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          const clusterMarker = L.marker([avgLat, avgLng], { icon: clusterIcon })
            .addTo(map)
            .on('click', () => {
              map.setView([avgLat, avgLng], map.getZoom() + 2);
            });
          markersRef.current.push(clusterMarker);
        }
      });
    } else {
      finalFilteredIssues.forEach(issue => {
        createMarkerForIssue(issue);
      });
    }

    // Marker Creator
    function createMarkerForIssue(issue: Issue) {
      const { lat, lng, address } = issue.coordinates;
      const colorInfo = getIssueColor(issue);

      const issueIcon = L.divIcon({
        className: 'custom-issue-marker',
        html: `
          <div class="relative flex items-center justify-center hover:scale-125 active:scale-95 transition-transform duration-200">
            <span class="absolute w-8 h-8 rounded-full ${colorInfo.bgClass} opacity-25 animate-ping"></span>
            <div class="w-8.5 h-8.5 rounded-full ${colorInfo.bgClass} border border-white flex items-center justify-center shadow-lg text-white">
              <span class="text-xs font-bold">${colorInfo.markerEmoji}</span>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17]
      });

      const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const threshold = issue.verificationThreshold || 5;
      const isCommunityVerified = issue.verifications >= threshold;

      // Custom styled popup content
      const popupContent = `
        <div class="p-3 max-w-[280px] text-slate-800 dark:text-slate-100 font-sans">
          <div class="rounded-2xl overflow-hidden h-28 w-full bg-slate-100 dark:bg-slate-900 mb-2.5 relative shadow-sm border border-slate-200 dark:border-slate-800">
            <img src="${issue.imageUrl}" class="w-full h-full object-cover" alt="${issue.title}" referrerPolicy="no-referrer" />
            <span class="absolute top-1.5 left-1.5 text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg bg-slate-950/80 text-white backdrop-blur-xs">
              ${issue.severity} Severity ${isCommunityVerified ? ' | ✨ Verified' : ''}
            </span>
          </div>
          <h4 class="font-extrabold text-sm text-slate-900 truncate mb-0.5">${issue.title}</h4>
          <p class="text-[11px] text-indigo-600 font-bold mb-2">${issue.category}</p>
          
          <div class="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-500 mb-3 border-t border-slate-100 pt-2">
            <div><strong class="text-slate-400 block uppercase tracking-wider text-[8px]">Reporter</strong> <span class="truncate text-slate-700">${issue.reporterName}</span></div>
            <div><strong class="text-slate-400 block uppercase tracking-wider text-[8px]">Status</strong> <span class="font-bold text-emerald-600">${issue.status === 'Verified' || isCommunityVerified ? '✨ Community Verified' : issue.status}</span></div>
            <div class="col-span-2 text-slate-400 mt-1 line-clamp-2">📍 ${address || 'Local coordinates'}</div>
          </div>

          <div class="flex items-center gap-1.5 pt-1">
            <button class="view-details-btn flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center text-xs shadow-sm cursor-pointer transition-colors" data-issue-id="${issue.id}">
              ${lang === 'en' ? 'View Details' : 'विवरण देखें'}
            </button>
            <a href="${navigateUrl}" target="_blank" rel="noopener noreferrer" class="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-center text-xs border border-slate-200 flex items-center gap-1 shrink-0">
              🧭 Navigate
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: issueIcon })
        .addTo(map)
        .bindPopup(popupContent, { maxWidth: 300, minWidth: 260 })
        .on('click', () => {
          setSelectedMobileIssue(issue); // Save for bottom drawer layout
        });
      
      markersRef.current.push(marker);
    }
  }, [finalFilteredIssues, showClusters, showHeatmap, lang]);

  const categoriesList: IssueCategory[] = [
    "Pothole", "Garbage", "Water Leakage", "Street Light Problem", 
    "Traffic Signal Issue", "Fallen Tree", "Other"
  ];

  // Focus and open popup helper for Radar clicks
  const focusOnIssue = (issue: Issue) => {
    setSelectedMobileIssue(issue);
    if (mapRef.current) {
      mapRef.current.setView([issue.coordinates.lat, issue.coordinates.lng], 15);
      
      // Look for the marker coordinate and trigger popup open if available
      const match = markersRef.current.find(m => {
        const latLng = m.getLatLng();
        return latLng.lat === issue.coordinates.lat && latLng.lng === issue.coordinates.lng;
      });

      if (match) {
        match.openPopup();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[720px] relative">
      
      {/* 1. LEFT SIDEBAR PANEL: Controls, Filters and Radar */}
      <div className="w-full md:w-85 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("filters")}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "filters"
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Filters' : 'फ़िल्टर'}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("radar");
              setRadarEnabled(true);
            }}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "radar"
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Radar className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{lang === 'en' ? 'Radar Alert' : 'राडार रडार'}</span>
          </button>
        </div>

        {/* Content of panels */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          
          <AnimatePresence mode="wait">
            {activeTab === "filters" ? (
              <motion.div
                key="filters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{lang === 'en' ? 'Dashboard Queries' : 'डैशबोर्ड खोज'}</span>
                  </h3>
                  
                  {/* Search Title/Address */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? "Search by title, sector or description..." : "शीर्षक, क्षेत्र या विवरण से खोजें..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-850 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Categories Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    {lang === 'en' ? 'Civic Category' : 'समस्या वर्ग'}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="All">{lang === 'en' ? 'All Categories (सभी)' : 'सभी श्रेणियां'}</option>
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Severity Badge Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    {lang === 'en' ? 'Severity Index' : 'तीव्रता सूचकांक'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Critical", "High", "Medium", "Low"].map(sev => (
                      <button
                        key={sev}
                        onClick={() => setSelectedSeverity(sev)}
                        className={`text-[10px] font-black tracking-wider uppercase px-3 py-2 rounded-xl border transition-all ${
                          selectedSeverity === sev
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    {lang === 'en' ? 'Lifecycle Stage' : 'प्रगति स्तर'}
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="All">{lang === 'en' ? 'All Lifecycle Stages' : 'सभी स्थितियां'}</option>
                    <option value="Reported">{lang === 'en' ? 'Reported (दर्ज)' : 'रिपोर्ट की गई'}</option>
                    <option value="Verified">{lang === 'en' ? 'Verified (सत्यापित)' : 'सत्यापित'}</option>
                    <option value="Assigned">{lang === 'en' ? 'Assigned (विभाग आवंटित)' : 'अधिकारी नियुक्त'}</option>
                    <option value="In Progress">{lang === 'en' ? 'In Progress (प्रगति पर)' : 'कार्य चालू'}</option>
                    <option value="Resolved">{lang === 'en' ? 'Resolved (समाधानित)' : 'समाधान हो चुका'}</option>
                    <option value="Closed">{lang === 'en' ? 'Closed (सत्यापित बंद)' : 'बंद'}</option>
                  </select>
                </div>

                {/* Interactive Layers Overlays */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {lang === 'en' ? 'Tactical Map Layers' : 'नक्शा मानचित्र परतें'}
                  </label>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold border transition-all ${
                        showHeatmap 
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${showHeatmap ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span>{lang === 'en' ? 'AI Severity Heatmap' : 'AI तीव्रता हॉटस्पॉट'}</span>
                      </span>
                      <span className="text-[10px] font-mono bg-white dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Toggle</span>
                    </button>

                    <button
                      onClick={() => setShowClusters(!showClusters)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold border transition-all ${
                        showClusters
                          ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-250 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${showClusters ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span>{lang === 'en' ? 'Cluster Clump Nodes' : 'स्मार्ट संपीड़न नोड्स'}</span>
                      </span>
                      <span className="text-[10px] font-mono bg-white dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Toggle</span>
                    </button>
                  </div>
                </div>

                {/* Color Legend section */}
                <div className="p-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black text-slate-400 tracking-widest block uppercase">{lang === 'en' ? 'Map Key Legend' : 'नक्शा संकेतक'}</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{lang === 'en' ? '🔴 Urgent' : '🔴 अति-आवश्यक'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{lang === 'en' ? '🟡 In Progress' : '🟡 काम चालू'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{lang === 'en' ? '🟢 Fixed' : '🟢 समाधानित'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{lang === 'en' ? '🔵 Reported' : '🔵 नव-दर्ज'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="radar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center space-x-2">
                    <Radar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <span>{lang === 'en' ? 'Nearby Issue Radar' : 'नागरिक संकट राडार'}</span>
                  </h3>
                  <button
                    onClick={() => setRadarEnabled(!radarEnabled)}
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${
                      radarEnabled
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    {radarEnabled ? "ACTIVE" : "DISABLED"}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {lang === 'en'
                    ? 'Detects and clusters reported complaints in a custom radial radius around your current position or pinned location.'
                    : 'आपके चयनित केंद्र के चारों ओर एक निश्चित दायरे में दर्ज शिकायतों की निगरानी करें।'}
                </p>

                {/* Radar Radius Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-655">
                    <span>{lang === 'en' ? 'Detection Circle Radius' : 'खोज क्षेत्र त्रिज्या'}</span>
                    <span className="font-mono text-indigo-600">{radarRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.5"
                    value={radarRadius}
                    onChange={(e) => setRadarRadius(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>0.5 km</span>
                    <span>5.0 km</span>
                    <span>10.0 km</span>
                  </div>
                </div>

                {/* Detected count listing */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      {lang === 'en' ? 'Radar Detections' : 'क्षेत्रीय परिणाम'} ({nearbyIssuesWithDistance.length})
                    </span>
                    {userCoords && (
                      <span className="text-[9px] font-mono text-indigo-500 flex items-center space-x-0.5">
                        <Compass className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>GPS Synced</span>
                      </span>
                    )}
                  </div>

                  {nearbyIssuesWithDistance.length === 0 ? (
                    <div className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl italic text-[11px] text-slate-400">
                      {lang === 'en' ? 'No reports detected in this radius. Expand the slider!' : 'दिए गए त्रिज्या में कोई शिकायत नहीं मिली। क्षेत्र का दायरा बढ़ाएं!'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {nearbyIssuesWithDistance.map(({ issue, distance }) => {
                        const issueColor = getIssueColor(issue);
                        return (
                          <button
                            key={issue.id}
                            onClick={() => focusOnIssue(issue)}
                            className="w-full text-left p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-start space-x-3 shadow-xs hover:shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 dark:border-slate-850">
                              <img src={issue.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-mono font-extrabold tracking-wider text-indigo-600 block truncate">
                                  {issue.category}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">
                                  {distance.toFixed(2)} km
                                </span>
                              </div>
                              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                                {issue.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-1">
                                <span className={`w-2 h-2 rounded-full ${issueColor.bgClass}`} />
                                <span className="truncate">{issueColor.label} • {issue.severity}</span>
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Tip / Footer Info Section */}
        <div className="p-4 bg-[#1E293B] text-slate-200 border-t border-slate-800 text-[11px] leading-relaxed shrink-0">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-1">
            <Sparkles className="w-4 h-4 animate-bounce" />
            <span>{lang === 'en' ? 'Interactive Smart Pin' : 'इंटरैक्टिव स्मार्ट सुई'}</span>
          </div>
          {lang === 'en' 
            ? "Click anywhere on the map grid to immediately drop a reporter coordinates helper pin!" 
            : "मानचित्र पर कहीं भी क्लिक करके तुरंत निर्देशांक पिन दर्ज करें!"}
        </div>
      </div>

      {/* 2. RIGHT PANEL: Leaflet Map Surface Workspace */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden flex flex-col">
        
        {/* Floating Top Left Alert Banner Count */}
        <div className="absolute top-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-md text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
          <span>{lang === 'en' ? `Active: ${finalFilteredIssues.length} points` : `${finalFilteredIssues.length} सक्रिय शिकायतें`}</span>
        </div>

        {/* Location search panel */}
        <div className="absolute top-3 right-3 z-[400] flex items-center space-x-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-lg max-w-xs sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={lang === 'en' ? "Search city, sector, area..." : "शहर, क्षेत्र, सेक्टर खोजें..."}
            value={locationSearchQuery}
            onChange={(e) => setLocationSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLocationSearch();
              }
            }}
            className="bg-transparent border-none text-xs focus:outline-none w-32 sm:w-48 text-slate-800 dark:text-white font-semibold"
          />
          <button
            onClick={handleLocationSearch}
            disabled={isSearchingLocation}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isSearchingLocation ? "..." : (lang === 'en' ? "Go" : "खोजें")}
          </button>
        </div>

        {/* GPS Locate button */}
        <button
          onClick={detectUserLocation}
          className="absolute bottom-24 right-4 z-[400] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-2xl text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title={lang === 'en' ? "GPS Synchronizer" : "जीपीएस सिंक"}
        >
          <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
        </button>

        {/* The Map Div surface container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Interactive Floating Details for Mobile drawer or bottom selection */}
        <AnimatePresence>
          {selectedMobileIssue && (
            <motion.div
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 120 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="absolute bottom-4 left-4 right-4 bg-white dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xl z-[500] flex flex-col gap-3.5 max-w-md mx-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 shrink-0">
                    <img src={selectedMobileIssue.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-indigo-600 uppercase block">
                      {selectedMobileIssue.category}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {selectedMobileIssue.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <span className={`text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded-lg text-white ${getIssueColor(selectedMobileIssue).bgClass}`}>
                    {selectedMobileIssue.status}
                  </span>
                  <button 
                    onClick={() => setSelectedMobileIssue(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 italic">
                📍 {selectedMobileIssue.coordinates.address || 'Local Sector Address'}
              </p>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                <button
                  onClick={() => {
                    onSelectIssue(selectedMobileIssue);
                    setSelectedMobileIssue(null);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs text-center transition-colors"
                >
                  {lang === 'en' ? 'Open Details 🔍' : 'विवरण खोलें'}
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMobileIssue.coordinates.lat},${selectedMobileIssue.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropped Pin active helper widget panel */}
        <AnimatePresence>
          {droppedPin && !selectedMobileIssue && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-4 left-4 right-4 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur text-white border border-slate-800 rounded-3xl p-4 shadow-2xl z-[500] max-w-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-xl">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">{lang === 'en' ? 'Active Locator Pin' : 'सक्रिय सहायक पिन'}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Lat: {droppedPin.lat} | Lng: {droppedPin.lng}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setDroppedPin(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-200 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 italic truncate">
                📍 {droppedPin.address}
              </p>

              <div className="mt-3.5 flex justify-end space-x-2">
                <button
                  onClick={() => setDroppedPin(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  {lang === 'en' ? 'Dismiss' : 'रद्द करें'}
                </button>
                <button
                  onClick={() => {
                    if (onDropPin && droppedPin) {
                      onDropPin(droppedPin);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow"
                >
                  <span>{lang === 'en' ? 'File Complaint Here' : 'यहाँ शिकायत दर्ज करें'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
