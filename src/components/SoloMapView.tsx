import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import * as Location from 'expo-location';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic291bmRoYXJ5YSIsImEiOiJjbWU4MG0zZHcwNXJ5MmpxeGRxYW1sdWU4In0.R1lZA658526l1ZF2VxGG-w';

const MAP_HTML = (token: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet"/>
  <style>html,body{margin:0;padding:0;height:100%}#map{width:100%;height:100%}.mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib{display:none!important}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = '${token}';
    const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/streets-v11', center: [0,0], zoom: 2 });
    window.userMarker = null; window.userPopup = null; window.searchMarkers = []; window.routeLayerId = 'route-line'; window.routeSourceId = 'route-source';
    function post(m){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
    function handleMessage(data){ if(!data) return;
      if(data.type === 'CENTER' || data.type === 'USER_LOC'){ const lng = data.center[0], lat = data.center[1]; try{ map.flyTo({center:[lng,lat], zoom: data.zoom || 14}) }catch(e){}
        if(!window.userPopup) window.userPopup = new mapboxgl.Popup({ closeOnClick: false }).setHTML('<b>You are here</b>');
        if(!window.userMarker){ window.userMarker = new mapboxgl.Marker({ color: 'blue' }).setLngLat([lng,lat]).setPopup(window.userPopup).addTo(map); try{ window.userMarker.togglePopup(); }catch(e){} }
        else { window.userMarker.setLngLat([lng,lat]); }
      }
      if(data.type === 'PLACES'){ if(window.searchMarkers && window.searchMarkers.length) window.searchMarkers.forEach(m => m.remove()); window.searchMarkers = []; (data.places||[]).forEach(p=>{ const m = new mapboxgl.Marker({color:'red'}).setLngLat([p.longitude,p.latitude]).setPopup(new mapboxgl.Popup().setHTML('<b>'+ (p.name||'') +'</b><br/>'+(p.address||''))).addTo(map); window.searchMarkers.push(m); m.getElement().addEventListener('click',()=>post({type:'PLACE_SELECTED', place: p})); }); if((data.places||[]).length>0){ const bounds = new mapboxgl.LngLatBounds(); data.places.forEach(p=>bounds.extend([p.longitude,p.latitude])); try{ map.fitBounds(bounds,{padding:50}) }catch(e){} } }
      if(data.type === 'ROUTE'){ try{ if(map.getLayer(window.routeLayerId)) map.removeLayer(window.routeLayerId); if(map.getSource(window.routeSourceId)) map.removeSource(window.routeSourceId);}catch(e){} if(data.route){ map.addSource(window.routeSourceId,{ type:'geojson', data: { type:'Feature', geometry: data.route } }); map.addLayer({ id: window.routeLayerId, type: 'line', source: window.routeSourceId, layout: { 'line-join':'round','line-cap':'round' }, paint: { 'line-color':'#007AFF','line-width':5 } }); try{ map.fitBounds([data.start, data.end], { padding: 50 }); }catch(e){} } }
      if(data.type === 'CLEAR_ROUTE'){ try{ if(map.getLayer(window.routeLayerId)) map.removeLayer(window.routeLayerId); if(map.getSource(window.routeSourceId)) map.removeSource(window.routeSourceId);}catch(e){} }
    }
    document.addEventListener('message', (e)=>{ try{ handleMessage(JSON.parse(e.data)); }catch(_){} }); window.addEventListener('message', (e)=>{ try{ handleMessage(typeof e.data === 'string' ? JSON.parse(e.data) : e.data); }catch(_){} }); window.map.on('load', ()=> post({ type: 'MAP_READY' }));
  </script>
</body>
</html>
`;

interface Dest { latitude?: number; longitude?: number; address?: string; name?: string }

export default function SoloMapView({ dest }: { dest?: Dest }) {
  const webRef = useRef<any>(null);
  const watchRef = useRef<any | null>(null);

  const post = useCallback((m: any) => webRef.current?.postMessage(JSON.stringify(m)), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { if (mounted) Alert.alert('Location permission required'); return; }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        post({ type: 'CENTER', center: [loc.coords.longitude, loc.coords.latitude], zoom: 14 });
        // If a destination was provided, fetch route and send to webview
        let finalDest: { latitude: number; longitude: number } | null = null;
        if (dest) {
          if (typeof dest.latitude === 'number' && typeof dest.longitude === 'number') {
            finalDest = { latitude: dest.latitude, longitude: dest.longitude };
          } else if (dest.address) {
            // geocode the address using Mapbox Geocoding API
            try {
              const q = encodeURIComponent(dest.address);
              const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${MAPBOX_TOKEN}&limit=1&proximity=${loc.coords.longitude},${loc.coords.latitude}`;
              const gres = await axios.get(geoUrl);
              const feat = (gres.data as any)?.features?.[0];
              if (feat && feat.center && feat.center.length === 2) {
                finalDest = { latitude: feat.center[1], longitude: feat.center[0] };
              }
            } catch (e) { console.warn('geocode failed', e); }
          }
        }

        if (finalDest) {
          try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${loc.coords.longitude},${loc.coords.latitude};${finalDest.longitude},${finalDest.latitude}?geometries=geojson&steps=false&access_token=${MAPBOX_TOKEN}`;
            const res = await axios.get(url);
            const route = (res.data as any)?.routes?.[0]?.geometry;
            if (route) {
              post({ type: 'ROUTE', route, start: [loc.coords.longitude, loc.coords.latitude], end: [finalDest.longitude, finalDest.latitude] });
            }
          } catch (e) { console.warn('solo route fetch failed', e); }
        }
        watchRef.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Highest, distanceInterval: 5, timeInterval: 4000 }, (pos: any) => {
          post({ type: 'USER_LOC', center: [pos.coords.longitude, pos.coords.latitude] });
          // If destination present, also update route live (optional): compute new route
          (async () => {
            try {
              let updateDest = finalDest;
              if (!updateDest && dest?.address) {
                // try geocode once more based on latest pos
                try {
                  const q2 = encodeURIComponent(dest.address);
                  const geoUrl2 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q2}.json?access_token=${MAPBOX_TOKEN}&limit=1&proximity=${pos.coords.longitude},${pos.coords.latitude}`;
                  const gres2 = await axios.get(geoUrl2);
                  const feat2 = (gres2.data as any)?.features?.[0];
                  if (feat2 && feat2.center && feat2.center.length === 2) updateDest = { latitude: feat2.center[1], longitude: feat2.center[0] };
                } catch (e) { /* ignore */ }
              }
              if (updateDest) {
                const url2 = `https://api.mapbox.com/directions/v5/mapbox/driving/${pos.coords.longitude},${pos.coords.latitude};${updateDest.longitude},${updateDest.latitude}?geometries=geojson&steps=false&access_token=${MAPBOX_TOKEN}`;
                const r2 = await axios.get(url2);
                const rt = (r2.data as any)?.routes?.[0]?.geometry;
                if (rt) post({ type: 'ROUTE', route: rt, start: [pos.coords.longitude, pos.coords.latitude], end: [updateDest.longitude, updateDest.latitude] });
              }
            } catch (e) { /* ignore route update errors */ }
          })();
        });
      } catch (e) { console.warn('solo map loc error', e); }
    })();
    return () => { mounted = false; if (watchRef.current?.remove) watchRef.current.remove(); };
  }, [post, dest]);

  return (
    <View style={styles.container}>
      <WebView ref={webRef} originWhitelist={["*"]} source={{ html: MAP_HTML(MAPBOX_TOKEN) }} style={{ flex: 1 }} onMessage={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
