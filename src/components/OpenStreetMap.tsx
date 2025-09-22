import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { EnduroSpot, UserLocation } from "../types";

interface OpenStreetMapProps {
  location: UserLocation | null;
  spots: EnduroSpot[];
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (spot: EnduroSpot) => void;
  onNavigateToSpot?: (destination: {
    latitude: number;
    longitude: number;
    name: string;
  }) => void;
  onStartGPSNavigation?: (destination: {
    latitude: number;
    longitude: number;
    name: string;
  }) => void;
  autoNavigateToSpot?: EnduroSpot | null; // Automatycznie nawiguj do tego miejsca
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  location,
  spots,
  onMapPress,
  onMarkerPress,
  onNavigateToSpot,
  onStartGPSNavigation,
  autoNavigateToSpot,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  console.log(
    "OpenStreetMap rendering with location:",
    location,
    "spots count:",
    spots.length
  );

  // Automatyczna nawigacja gdy jest ustawiony cel
  useEffect(() => {
    if (autoNavigateToSpot && mapReady && webViewRef.current) {
      console.log("Auto-navigating to:", autoNavigateToSpot.name);
      const script = `navigateToSpot(${autoNavigateToSpot.latitude}, ${autoNavigateToSpot.longitude}, '${autoNavigateToSpot.name}');`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [autoNavigateToSpot, mapReady]);

  // Generate HTML content for OpenStreetMap with Leaflet
  const generateMapHTML = () => {
    const centerLat = location?.latitude || 50.0755; // Praha default
    const centerLng = location?.longitude || 14.4378;

    const spotsData = spots.map((spot) => ({
      id: spot.id,
      lat: spot.latitude,
      lng: spot.longitude,
      name: spot.name,
      difficulty: spot.difficulty,
      categories: spot.categories,
    }));

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enduro Tracker - OpenStreetMap</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <style>
            body, html { 
                margin: 0; 
                padding: 0; 
                height: 100%; 
                overflow: hidden;
                background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%);
            }
            #map { 
                width: 100%; 
                height: 100vh; 
            }
            .leaflet-popup-content-wrapper {
                background: #ffffff;
                color: #2c3e50;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border: 1px solid #e1e8ed;
            }
            .leaflet-popup-content {
                margin: 12px 16px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 13px;
                line-height: 1.4;
            }
            .spot-name {
                font-weight: 600;
                color: #3498db;
                margin-bottom: 6px;
                font-size: 15px;
            }
            .spot-difficulty {
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 6px;
                display: inline-block;
                margin-top: 4px;
                color: white;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .difficulty-easy { background: linear-gradient(135deg, #66bb6a, #81c784); }
            .difficulty-moderate { background: linear-gradient(135deg, #ffb74d, #ffcc80); }
            .difficulty-hard { background: linear-gradient(135deg, #ef5350, #e57373); }
            .difficulty-extreme { background: linear-gradient(135deg, #ba68c8, #ce93d8); }
            .leaflet-popup-tip {
                background: #ffffff;
                border: 1px solid #e1e8ed;
            }
            /* Modern controls */
            .leaflet-control-attribution {
                background: rgba(255, 255, 255, 0.9);
                color: #666;
                font-size: 10px;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .leaflet-control-zoom a {
                background: #ffffff;
                color: #3498db;
                border: 1px solid #e1e8ed;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }
            .leaflet-control-zoom a:hover {
                background: #3498db;
                color: white;
                transform: scale(1.05);
            }
            /* Modern routing control */
            .leaflet-routing-container {
                background: rgba(255, 255, 255, 0.95) !important;
                color: #2c3e50 !important;
                border-radius: 12px !important;
                border: 1px solid #e1e8ed !important;
                max-width: 320px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
            }
            .leaflet-routing-container h2,
            .leaflet-routing-container h3 {
                color: #3498db !important;
                margin: 12px 0 !important;
                font-weight: 600 !important;
            }
            .leaflet-routing-alt {
                background: rgba(248, 249, 250, 0.9) !important;
                border: 1px solid #dee2e6 !important;
                margin: 6px 0 !important;
                padding: 10px !important;
                border-radius: 8px !important;
                transition: all 0.2s ease !important;
            }
            .leaflet-routing-alt:hover {
                background: rgba(52, 152, 219, 0.1) !important;
                border-color: #3498db !important;
            }
            .leaflet-routing-instruction {
                color: #495057 !important;
                font-size: 14px !important;
                line-height: 1.4 !important;
            }
            .leaflet-routing-distance {
                color: #3498db !important;
                font-weight: 600 !important;
            }
            /* Markery trasy */
            .custom-marker {
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
            }
            /* Modern clear route button */
            .clear-route-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                background: linear-gradient(135deg, #ffffff, #f8f9fa) !important;
                color: #495057 !important;
                border: 1px solid #dee2e6 !important;
                padding: 12px 18px !important;
                border-radius: 10px !important;
                cursor: pointer !important;
                font-weight: 500 !important;
                font-size: 13px !important;
                z-index: 1000 !important;
                display: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                transition: all 0.2s ease !important;
            }
            .clear-route-btn.show {
                display: block;
            }
            .clear-route-btn:hover {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef) !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <button id="clearRouteBtn" class="clear-route-btn" onclick="clearRoute()">
            🗑️ Usuń trasę
        </button>
        
        <script>
            console.log('OpenStreetMap HTML loading...');
            let map;
            let routingControl = null;
            
            // Initialize OpenStreetMap with Leaflet
            function initMap() {
                console.log('Initializing OpenStreetMap...');
                // Create map
                map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
                
                // Add OpenStreetMap tiles - terrain style
                L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    maxZoom: 17,
                    attribution: '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
                }).addTo(map);
                
                // Alternative: Standard OSM tiles
                // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                //     maxZoom: 19,
                //     attribution: '© OpenStreetMap contributors'
                // }).addTo(map);
                
                // Add user location marker
                ${
                  location
                    ? `
                var userIcon = L.divIcon({
                    html: \`
                        <div style="
                            width: 24px; 
                            height: 24px; 
                            background: linear-gradient(135deg, #3498db, #5dade2); 
                            border: 3px solid white; 
                            border-radius: 50%; 
                            box-shadow: 0 3px 8px rgba(52, 152, 219, 0.4);
                            position: relative;
                        ">
                            <div style="
                                width: 8px; 
                                height: 8px; 
                                background: white; 
                                border-radius: 50%; 
                                margin: 4px auto;
                                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                            "></div>
                            <div style="
                                position: absolute;
                                top: -2px;
                                left: -2px;
                                width: 28px;
                                height: 28px;
                                border: 2px solid rgba(52, 152, 219, 0.3);
                                border-radius: 50%;
                                animation: pulse 2s infinite;
                            "></div>
                        </div>
                        <style>
                            @keyframes pulse {
                                0% { transform: scale(1); opacity: 1; }
                                100% { transform: scale(1.5); opacity: 0; }
                            }
                        </style>\`,
                    className: 'user-location-marker',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                L.marker([${centerLat}, ${centerLng}], {icon: userIcon})
                    .addTo(map)
                    .bindPopup('<b>Twoja lokalizacja</b>');
                `
                    : ""
                }
                
                // Add spot markers
                var spots = ${JSON.stringify(spotsData)};
                var userLocation = ${
                  location ? JSON.stringify(location) : "null"
                };
                console.log('Adding', spots.length, 'spots to map');
                spots.forEach(function(spot) {
                    var difficultyColor = getDifficultyColor(spot.difficulty);
                    var categoryIcon = getCategoryIcon(spot.categories[0] || 'climb'); // Używamy pierwszej kategorii dla ikony
                    
                    var spotIcon = L.divIcon({
                        html: \`
                            <div style="
                                width: 24px; 
                                height: 32px; 
                                background: \${difficultyColor}; 
                                border: 2px solid white; 
                                border-radius: 50% 50% 50% 0; 
                                transform: rotate(-45deg); 
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                position: relative;
                            ">
                                <div style="
                                    position: absolute;
                                    top: 3px;
                                    left: 3px;
                                    width: 14px;
                                    height: 14px;
                                    background: white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: \${difficultyColor};
                                    transform: rotate(45deg);
                                ">\${categoryIcon}</div>
                            </div>\`,
                        className: 'spot-marker',
                        iconSize: [24, 32],
                        iconAnchor: [12, 32]
                    });
                    
                    var marker = L.marker([spot.lat, spot.lng], {icon: spotIcon})
                        .addTo(map);
                    
                    // Add popup with spot info
                    var popupContent = \`
                        <div class="spot-name">\${spot.name}</div>
                        <div class="spot-difficulty difficulty-\${spot.difficulty}">
                            \${getDifficultyLabel(spot.difficulty)}
                        </div>
                        <div style="margin-top: 8px; color: #ccc; font-size: 11px;">
                            Kategorie: \${spot.categories.map(cat => getCategoryLabel(cat)).join(', ')}
                        </div>
                        <button 
                            onclick="navigateToSpot(\${spot.lat}, \${spot.lng}, '\${spot.name}')" 
                            style="
                                background: linear-gradient(135deg, #3498db, #5dade2); 
                                color: white; 
                                border: none; 
                                padding: 10px 18px; 
                                border-radius: 8px; 
                                margin-top: 12px; 
                                cursor: pointer;
                                font-weight: 500;
                                font-size: 13px;
                                width: 100%;
                                margin-bottom: 8px;
                                box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(52, 152, 219, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(52, 152, 219, 0.3)';">
                            🗺️ Wyznacz trasę
                        </button>
                        <button 
                            onclick="startGPSNavigation(\${spot.lat}, \${spot.lng}, '\${spot.name}')" 
                            style="
                                background: linear-gradient(135deg, #27ae60, #2ecc71); 
                                color: white; 
                                border: none; 
                                padding: 10px 18px; 
                                border-radius: 8px; 
                                cursor: pointer;
                                font-weight: 500;
                                font-size: 13px;
                                width: 100%;
                                box-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(39, 174, 96, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(39, 174, 96, 0.3)';">
                            🧭 Nawigacja GPS
                        </button>\`;
                    
                    marker.bindPopup(popupContent);
                    
                    // Handle marker click
                    marker.on('click', function() {
                        console.log('Marker clicked:', spot.name);
                        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'markerPress',
                            spot: spot
                        }));
                    });
                });
                
                // Map click handler
                map.on('click', function(e) {
                    console.log('Map clicked at:', e.latlng.lat, e.latlng.lng);
                    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapPress',
                        coordinate: {
                            latitude: e.latlng.lat,
                            longitude: e.latlng.lng
                        }
                    }));
                });
                
                console.log('OpenStreetMap initialized successfully');
                
                // Test routing library
                console.log('Testing routing library availability...');
                console.log('L.Routing:', typeof L.Routing);
                console.log('L.Routing.control:', typeof L.Routing?.control);
                console.log('L.Routing.osrmv1:', typeof L.Routing?.osrmv1);
                
                // Notify React Native that map is ready
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapReady'
                }));
            }
            
            function getDifficultyColor(difficulty) {
                switch(difficulty) {
                    case 'easy': return '#4CAF50';
                    case 'moderate': return '#FF9800';
                    case 'hard': return '#F44336';
                    case 'extreme': return '#9C27B0';
                    default: return '#2196F3';
                }
            }
            
            function getDifficultyLabel(difficulty) {
                switch(difficulty) {
                    case 'easy': return 'Łatwy';
                    case 'moderate': return 'Średni';
                    case 'hard': return 'Trudny';
                    case 'extreme': return 'Ekstremalny';
                    default: return 'Nieznany';
                }
            }
            
            function getCategoryIcon(category) {
                switch(category) {
                    case 'climb': return '↗';
                    case 'technical': return '⚙';
                    case 'jump': return '✈';
                    case 'creek': return '≋';
                    case 'rocks': return '◆';
                    case 'mud': return '●';
                    default: return '📍';
                }
            }
            
            function getCategoryLabel(category) {
                switch(category) {
                    case 'climb': return 'Podjazd';
                    case 'technical': return 'Techniczny';
                    case 'jump': return 'Skok';
                    case 'creek': return 'Potok';
                    case 'rocks': return 'Kamienie';
                    case 'mud': return 'Błoto';
                    default: return 'Inne';
                }
            }
            
            function navigateToSpot(lat, lng, name) {
                console.log('=== NAVIGATION DEBUG START ===');
                console.log('Navigation requested to:', name, lat, lng);
                console.log('User location available:', userLocation);
                console.log('User location type:', typeof userLocation);
                console.log('User location structure:', JSON.stringify(userLocation, null, 2));
                console.log('L object available:', typeof L);
                console.log('L.Routing available:', typeof L.Routing);
                console.log('L.Routing.control available:', typeof L.Routing?.control);
                console.log('L.Routing.osrmv1 available:', typeof L.Routing?.osrmv1);
                
                // Sprawdź czy biblioteka routing jest załadowana
                if (!L.Routing) {
                    console.error('Leaflet Routing Machine nie jest załadowany!');
                    alert('Błąd: Brak biblioteki routingu. Spróbuj odświeżyć aplikację.');
                    return;
                }
                
                // Pokaż trasę na mapie jeśli mamy lokalizację użytkownika
                const userLoc = userLocation;
                if (userLoc) {
                    console.log('User location found, starting route calculation...');
                    
                    // Spróbuj różne struktury danych dla userLocation
                    let userLat, userLng;
                    if (userLoc.coords) {
                        userLat = userLoc.coords.latitude;
                        userLng = userLoc.coords.longitude;
                        console.log('Using coords structure:', userLat, userLng);
                    } else if (userLoc.latitude) {
                        userLat = userLoc.latitude;
                        userLng = userLoc.longitude;
                        console.log('Using direct latitude/longitude:', userLat, userLng);
                    } else {
                        console.error('Cannot determine user coordinates from:', userLoc);
                        alert('Nie można określić Twojej lokalizacji - nieprawidłowa struktura danych');
                        return;
                    }
                    
                    console.log('Final coordinates - User:', userLat, userLng, 'Destination:', lat, lng);
                    console.log('Final coordinates - User:', userLat, userLng, 'Destination:', lat, lng);
                    
                    // Usuń poprzednią trasę jeśli istnieje
                    if (routingControl) {
                        console.log('Removing existing route...');
                        map.removeControl(routingControl);
                        routingControl = null;
                    }
                    
                    console.log('Creating route control...');
                    try {
                        routingControl = L.Routing.control({
                            waypoints: [
                                L.latLng(userLat, userLng),
                                L.latLng(lat, lng)
                            ],
                            routeWhileDragging: false,
                            addWaypoints: false,
                            show: true,
                            createMarker: function(i, waypoint, n) {
                                console.log('Creating marker', i, 'at', waypoint.latLng);
                                // Tworzymy custom markery
                                if (i === 0) {
                                    // Marker startu - użytkownik
                                    return L.marker(waypoint.latLng, {
                                        icon: L.divIcon({
                                            html: '<div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(39, 174, 96, 0.4);">A</div>',
                                            iconSize: [28, 28],
                                            className: 'custom-marker'
                                        })
                                    });
                                } else {
                                    // Marker celu
                                    return L.marker(waypoint.latLng, {
                                        icon: L.divIcon({
                                            html: '<div style="background: linear-gradient(135deg, #e74c3c, #ec7063); color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(231, 76, 60, 0.4);">B</div>',
                                            iconSize: [28, 28],
                                            className: 'custom-marker'
                                        })
                                    });
                                }
                            },
                            lineOptions: {
                                styles: [{ 
                                    color: '#3498db', 
                                    weight: 6, 
                                    opacity: 0.8,
                                    dashArray: null
                                }]
                            },
                            router: L.Routing.osrmv1({
                                serviceUrl: 'https://router.project-osrm.org/route/v1',
                                profile: 'driving',
                                timeout: 30000,
                                suppressDemoServerWarning: true
                            })
                        }).on('routesfound', function(e) {
                            console.log('=== ROUTE FOUND ===');
                            console.log('Routes data:', e.routes);
                            var routes = e.routes;
                            var summary = routes[0].summary;
                            console.log('Route summary:', summary);
                            
                            // Dodaj informację o trasie
                            var distance = (summary.totalDistance / 1000).toFixed(1);
                            var time = Math.round(summary.totalTime / 60);
                            
                            console.log('Route info - Distance:', distance, 'km, Time:', time, 'min');
                            
                            // Pokaż popup z informacją o trasie
                            L.popup()
                                .setLatLng([lat, lng])
                                .setContent(
                                    '<div style="text-align: center; color: #2c3e50; font-family: \'Segoe UI\', sans-serif;">' +
                                        '<strong style="color: #3498db; font-size: 16px;">Trasa do: ' + name + '</strong><br>' +
                                        '<span style="color: #27ae60; font-weight: 500;">📍 ' + distance + ' km</span><br>' +
                                        '<span style="color: #e67e22; font-weight: 500;">⏱️ ' + time + ' min</span>' +
                                    '</div>'
                                )
                                .openOn(map);
                        }).on('routingerror', function(e) {
                            console.error('=== ROUTING ERROR ===');
                            console.error('Error details:', e);
                            
                            // Backup plan - narysuj prostą linię
                            console.log('Attempting backup route - straight line...');
                            
                            // Usuń routing control jeśli istnieje
                            if (routingControl) {
                                map.removeControl(routingControl);
                                routingControl = null;
                            }
                            
                            // Dodaj markery ręcznie
                            var startMarker = L.marker([userLat, userLng], {
                                icon: L.divIcon({
                                    html: '<div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(39, 174, 96, 0.4);">A</div>',
                                    iconSize: [28, 28]
                                })
                            }).addTo(map).bindPopup('Start - Twoja lokalizacja');
                            
                            var endMarker = L.marker([lat, lng], {
                                icon: L.divIcon({
                                    html: '<div style="background: linear-gradient(135deg, #e74c3c, #ec7063); color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(231, 76, 60, 0.4);">B</div>',
                                    iconSize: [28, 28]
                                })
                            }).addTo(map).bindPopup('Cel: ' + name);
                            
                            // Dodaj prostą linię między punktami
                            var straightLine = L.polyline([
                                [userLat, userLng],
                                [lat, lng]
                            ], {
                                color: '#3498db',
                                weight: 5,
                                opacity: 0.7,
                                dashArray: '8, 8'
                            }).addTo(map);
                            
                            // Oblicz prostą odległość
                            var distance = map.distance([userLat, userLng], [lat, lng]) / 1000;
                            
                            // Pokaż informację o linii prostej
                            L.popup()
                                .setLatLng([lat, lng])
                                .setContent(
                                    '<div style="text-align: center; color: #2c3e50; font-family: \'Segoe UI\', sans-serif;">' +
                                        '<strong style="color: #3498db; font-size: 16px;">Linia prosta do: ' + name + '</strong><br>' +
                                        '<span style="color: #27ae60; font-weight: 500;">📍 ' + distance.toFixed(1) + ' km</span><br>' +
                                        '<span style="color: #f39c12; font-weight: 500;">⚠️ Bez nawigacji drogowej</span>' +
                                    '</div>'
                                )
                                .openOn(map);
                            
                            // Dopasuj widok
                            var group = new L.featureGroup([startMarker, endMarker]);
                            map.fitBounds(group.getBounds().pad(0.1));
                            
                            alert('Nie można wyznaczyć trasy drogowej. Pokazano linię prostą. Błąd: ' + (e.error?.message || 'Problem z połączeniem'));
                        }).on('routingstart', function() {
                            console.log('=== ROUTING STARTED ===');
                        }).addTo(map);
                        
                        console.log('Route control created and added to map');
                        console.log('Routing control object:', routingControl);
                        
                    } catch (error) {
                        console.error('Error creating route control:', error);
                        alert('Błąd podczas tworzenia trasy: ' + error.message);
                        return;
                    }
                    } catch (error) {
                        console.error('Error creating route control:', error);
                        alert('Błąd podczas tworzenia trasy: ' + error.message);
                        return;
                    }
                    
                    // Pokaż przycisk do usuwania trasy
                    document.getElementById('clearRouteBtn').classList.add('show');
                    
                    // Dopasuj widok do trasy po chwili
                    setTimeout(function() {
                        console.log('Fitting bounds to route...');
                        if (routingControl) {
                            try {
                                var group = new L.featureGroup([
                                    L.marker([userLat, userLng]),
                                    L.marker([lat, lng])
                                ]);
                                map.fitBounds(group.getBounds().pad(0.1));
                                console.log('Bounds fitted successfully');
                            } catch (error) {
                                console.error('Error fitting bounds:', error);
                            }
                        }
                    }, 2000);
                    
                    console.log('=== NAVIGATION DEBUG END ===');
                } else {
                    console.error('No user location available');
                    alert('Nie można określić Twojej lokalizacji');
                }
                
                // Nie otwieraj zewnętrznej aplikacji - nawigacja jest w aplikacji
                console.log('Trasa powinna być wygenerowana w aplikacji');
            }
            
            function clearRoute() {
                console.log('Clearing route...');
                if (routingControl) {
                    map.removeControl(routingControl);
                    routingControl = null;
                    
                    // Ukryj przycisk do usuwania trasy
                    document.getElementById('clearRouteBtn').classList.remove('show');
                }
            }
            
            function startGPSNavigation(lat, lng, name) {
                console.log('GPS Navigation requested to:', name, lat, lng);
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'startGPSNavigation',
                    destination: {
                        latitude: lat,
                        longitude: lng,
                        name: name
                    }
                }));
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initMap);
            } else {
                initMap();
            }
        </script>
    </body>
    </html>`;
  };

  const handleMessage = (event: any) => {
    console.log("OpenStreetMap WebView message:", event.nativeEvent.data);
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "mapReady":
          console.log("OpenStreetMap is ready");
          setMapReady(true);
          break;
        case "mapPress":
          console.log("OpenStreetMap press:", data.coordinate);
          if (onMapPress) {
            onMapPress(data.coordinate);
          }
          break;
        case "markerPress":
          console.log("OpenStreetMap marker press:", data.spot);
          if (onMarkerPress) {
            const spot = spots.find((s) => s.id === data.spot.id);
            if (spot) onMarkerPress(spot);
          }
          break;
        case "navigateToSpot":
          console.log("Navigation requested:", data.destination);
          if (onNavigateToSpot) {
            onNavigateToSpot(data.destination);
          }
          break;
        case "startGPSNavigation":
          console.log("GPS Navigation requested:", data.destination);
          if (onStartGPSNavigation) {
            onStartGPSNavigation(data.destination);
          }
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const centerOnLocation = (latitude: number, longitude: number) => {
    if (webViewRef.current && mapReady) {
      const script = `
        if (map) {
          map.setView([${latitude}, ${longitude}], 15);
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        onError={(error) => console.error("WebView error:", error)}
        onHttpError={(error) => console.error("WebView HTTP error:", error)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f4f8",
  },
  webview: {
    flex: 1,
    backgroundColor: "#e8f4f8",
  },
});

export default OpenStreetMap;
