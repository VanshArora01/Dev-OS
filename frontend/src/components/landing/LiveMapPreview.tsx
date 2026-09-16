import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";

/* ─── Risk hotspots across Indian cities ─────────────────────────────── */
const hotspots = [
    { lng: 72.8777, lat: 19.076, color: "#f87171", label: "Critical", delay: 0 },
    { lng: 77.209, lat: 28.6139, color: "#facc15", label: "Moderate", delay: 0.2 },
    { lng: 80.2707, lat: 13.0827, color: "#facc15", label: "Moderate", delay: 0.4 },
    { lng: 88.3639, lat: 22.5726, color: "#4ade80", label: "Low", delay: 0.6 },
    { lng: 78.4867, lat: 17.385, color: "#f87171", label: "Critical", delay: 0.8 },
    { lng: 72.5714, lat: 23.0225, color: "#f87171", label: "Critical", delay: 1.0 },
    { lng: 85.8245, lat: 20.2961, color: "#facc15", label: "Moderate", delay: 1.2 },
    { lng: 74.8577, lat: 12.9141, color: "#4ade80", label: "Low", delay: 1.4 },
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;
const STYLE_URL = "mapbox://styles/mapbox/satellite-streets-v12";

function MapSkeleton() {
    return (
        <div className="relative aspect-[21/9] min-h-[280px] w-full overflow-hidden bg-[#080c14]">
            {/* Animated shimmer */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(135deg, #080c14 0%, #0d1520 40%, #080c14 100%)",
                }}
            />
            {/* Grid lines */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />
            {/* Continent blobs */}
            {[
                { w: 180, h: 110, l: "18%", t: "28%", o: 0.06 },
                { w: 140, h: 180, l: "48%", t: "18%", o: 0.05 },
                { w: 200, h: 130, l: "65%", t: "35%", o: 0.04 },
            ].map((b, i) => (
                <div
                    key={i}
                    className="absolute rounded-[40%] bg-emerald-400"
                    style={{ width: b.w, height: b.h, left: b.l, top: b.t, opacity: b.o }}
                />
            ))}
            {/* Skeleton hotspots */}
            {hotspots.map((s, i) => (
                <motion.div
                    key={i}
                    className="absolute h-3 w-3 rounded-full"
                    style={{
                        background: s.color,
                        left: `${20 + i * 9}%`,
                        top: `${30 + (i % 3) * 20}%`,
                        boxShadow: `0 0 8px 2px ${s.color}60`,
                    }}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: s.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
            {/* Loading label */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono tracking-widest text-white/20 uppercase">
                    Loading satellite imagery…
                </span>
            </div>
        </div>
    );
}

export default function LiveMapPreview() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [mapReady, setMapReady] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        // Only initialize the map when the section scrolls into view
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !mapRef.current) {
                    observer.disconnect();
                    initMap();
                }
            },
            { rootMargin: "200px" } // start loading 200px before entering viewport
        );

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    async function initMap() {
        if (!mapContainerRef.current) return;

        try {
            // Dynamic import — only fetches mapbox-gl when needed, not at page load
            const mapboxgl = (await import("mapbox-gl")).default;
            await import("mapbox-gl/dist/mapbox-gl.css");

            if (!mapContainerRef.current) return; // unmounted

            (mapboxgl as any).accessToken = MAPBOX_TOKEN;

            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: STYLE_URL,
                center: [82, 20],
                zoom: 3.9,
                pitch: 0,
                bearing: 0,
                attributionControl: false,
                interactive: true,
            });

            mapRef.current = map;
            setMapReady(true);

            // Inject keyframes + popup styles once
            if (!document.getElementById("climx-map-styles")) {
                const style = document.createElement("style");
                style.id = "climx-map-styles";
                style.textContent = `
                    @keyframes climx-ping {
                        0%   { transform:scale(1); opacity:0.7; }
                        100% { transform:scale(3); opacity:0; }
                    }
                    .climx-map-popup .mapboxgl-popup-content {
                        background:transparent!important;
                        box-shadow:none!important;
                        padding:0!important;
                    }
                    .climx-map-popup .mapboxgl-popup-tip { display:none!important; }
                    .mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib { display:none!important; }
                `;
                document.head.appendChild(style);
            }

            map.on("load", () => {
                hotspots.forEach((spot) => {
                    const el = document.createElement("div");
                    el.style.cssText = "position:relative;width:14px;height:14px;";

                    const dot = document.createElement("div");
                    dot.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${spot.color};box-shadow:0 0 10px 2px ${spot.color}80;`;

                    const ring = document.createElement("div");
                    ring.style.cssText = `position:absolute;inset:-6px;border-radius:50%;border:2px solid ${spot.color};opacity:0;animation:climx-ping 2s ease-out infinite;animation-delay:${spot.delay}s;`;

                    el.appendChild(ring);
                    el.appendChild(dot);

                    const popup = new mapboxgl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                        offset: 14,
                        className: "climx-map-popup",
                    }).setHTML(
                        `<span style="font-size:11px;font-family:monospace;color:${spot.color};background:${spot.color}18;border:1px solid ${spot.color}40;padding:2px 8px;border-radius:99px;white-space:nowrap">${spot.label}</span>`
                    );

                    new mapboxgl.Marker({ element: el, anchor: "center" })
                        .setLngLat([spot.lng, spot.lat])
                        .addTo(map);

                    popup.setLngLat([spot.lng, spot.lat]).addTo(map);
                });

                setMapLoaded(true);
                // Force canvas to fill the full container dimensions
                setTimeout(() => map.resize(), 50);
            });

            return () => {
                map.remove();
                mapRef.current = null;
            };
        } catch (err) {
            console.warn("[LiveMapPreview] Map load error:", err);
        }
    }

    return (
        <section ref={sectionRef} className="relative z-10 px-6 py-32 md:px-12">
            {/* Section header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7 }}
                className="mx-auto mb-12 max-w-2xl text-center"
            >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
                    Live Intelligence
                </p>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                    Explore risk zones in{" "}
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        real time
                    </span>
                </h2>
                <p className="mt-4 text-base text-white/50">
                    Hazard overlays powered by satellite data, IoT sensors, and
                    predictive AI models.
                </p>
            </motion.div>

            {/* Map card */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative mx-auto max-w-5xl"
            >
                {/* Glow halo */}
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-transparent to-cyan-500/10 blur-xl" />

                {/* Card */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08]">
                    {/* Real map container — always in DOM so mapbox can measure it */}
                    <div
                        ref={mapContainerRef}
                        className="aspect-[21/9] min-h-[280px] w-full"
                        style={{ background: "#080c14" }}
                    />

                    {/* Skeleton overlay — sits on top until tiles are ready */}
                    {!mapLoaded && (
                        <div className="absolute inset-0 z-10">
                            <MapSkeleton />
                        </div>
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-xl border border-white/[0.06] bg-black/60 px-4 py-2.5 backdrop-blur-md">
                        {[
                            { color: "#f87171", label: "Critical" },
                            { color: "#facc15", label: "Moderate" },
                            { color: "#4ade80", label: "Low" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                                <span className="text-[11px] text-white/50">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Live badge */}
                    <div className="absolute right-4 top-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/60 px-3 py-2 backdrop-blur-md">
                        <Radio className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] text-white/50">Live · Updated 2s ago</span>
                    </div>

                    {/* Coordinates */}
                    <div className="absolute bottom-4 right-4 rounded-lg border border-white/[0.06] bg-black/60 px-3 py-1.5 font-mono text-[11px] text-white/30 backdrop-blur-md">
                        19.0760°N, 72.8777°E
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
