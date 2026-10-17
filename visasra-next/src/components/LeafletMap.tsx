'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Fix Leaflet's default icon paths in Next.js bundler
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  // 2. Patch Leaflet DomUtil to prevent "Cannot read properties of undefined (reading '_leaflet_pos')"
  // This occurs when zoom/pan transitions fire after or during map detachment / resize.
  if (L.DomUtil) {
    const origGetPosition = L.DomUtil.getPosition;
    L.DomUtil.getPosition = function (el: HTMLElement) {
      if (!el) {
        return new L.Point(0, 0);
      }
      try {
        if (origGetPosition) {
          const pos = origGetPosition.call(L.DomUtil, el);
          if (pos) return pos;
        }
        return (el as unknown as { _leaflet_pos?: L.Point })._leaflet_pos || new L.Point(0, 0);
      } catch {
        return (el as unknown as { _leaflet_pos?: L.Point })?._leaflet_pos || new L.Point(0, 0);
      }
    };

    const origSetPosition = L.DomUtil.setPosition;
    L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
      if (!el) return;
      try {
        if (origSetPosition) {
          origSetPosition.call(L.DomUtil, el, point);
        } else {
          (el as unknown as { _leaflet_pos?: L.Point })._leaflet_pos = point;
        }
      } catch {
        // Safe no-op if element was detached mid-animation
      }
    };
  }
}

export interface MapMarker {
  id?: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  color?: 'blue' | 'orange' | 'green' | 'red';
  openPopup?: boolean;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export default function LeafletMap({
  center = [13.0418, 80.2341],
  zoom = 13,
  markers = [],
  height = '320px',
  className = '',
  style = {},
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const isDestroyedRef = useRef<boolean>(false);

  // Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    isDestroyedRef.current = false;

    // Destroy any stray instance on the container
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    const container = mapContainerRef.current;
    // Clear container child elements if needed to prevent duplicate panes
    if (container.children.length > 0) {
      container.innerHTML = '';
    }

    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
      zoomAnimation: true,
      fadeAnimation: true,
    }).setView(center, zoom);

    mapInstanceRef.current = map;

    // Clean attribution
    L.control.attribution({
      prefix: '<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>',
    }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Dedicated layer group for smooth marker additions/removals
    const markerLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markerLayer;

    // Smooth resize check
    const timer = setTimeout(() => {
      if (!isDestroyedRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {
          // ignore
        }
      }
    }, 200);

    return () => {
      isDestroyedRef.current = true;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup safely handled:', e);
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []); // Only run on mount!

  // Update view when center or zoom changes significantly without recreating map
  useEffect(() => {
    if (!mapInstanceRef.current || isDestroyedRef.current) return;
    try {
      const map = mapInstanceRef.current;
      const currentCenter = map.getCenter();
      const dist = Math.hypot(currentCenter.lat - center[0], currentCenter.lng - center[1]);
      if (dist > 0.0005) {
        map.panTo(center, { animate: true, duration: 0.5 });
      }
    } catch {
      // Safe no-op
    }
  }, [center[0], center[1], zoom]);

  // Update markers smoothly on the dedicated layer without destroying map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || isDestroyedRef.current) return;

    try {
      const layer = markersLayerRef.current;
      layer.clearLayers();

      markers.forEach((m) => {
        let icon: L.Icon | L.DivIcon = new L.Icon.Default();

        if (m.color) {
          const bg =
            m.color === 'orange'
              ? '#FF8A00'
              : m.color === 'green'
              ? '#228A1B'
              : m.color === 'red'
              ? '#E53935'
              : '#1261B5';

          icon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="
              position: relative;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                position: absolute;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${bg};
                opacity: 0.3;
              "></div>
              <div style="
                width: 16px;
                height: 16px;
                background: ${bg};
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                position: relative;
                z-index: 2;
              "></div>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
          });
        }

        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; padding: 2px 4px; min-width: 140px;">
            <div style="font-weight: 800; font-size: 13px; color: #092B55; margin-bottom: 2px;">${m.title}</div>
            ${m.description ? `<div style="font-size: 11.5px; color: #4C6180; line-height: 1.4;">${m.description}</div>` : ''}
          </div>
        `;

        const marker = L.marker([m.lat, m.lng], { icon })
          .addTo(layer)
          .bindPopup(popupHtml);

        if (m.openPopup) {
          marker.openPopup();
        }
      });
    } catch (e) {
      console.warn('Marker update safely caught:', e);
    }
  }, [JSON.stringify(markers)]);

  return (
    <div
      ref={mapContainerRef}
      className={`leaflet-map-root ${className}`}
      style={{
        width: '100%',
        height,
        borderRadius: 14,
        overflow: 'hidden',
        zIndex: 1,
        ...style,
      }}
    />
  );
}
