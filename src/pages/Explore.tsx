import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Satellite,
    Search,
    Map as MapIcon,
    Layers3,
    Target,
    Crosshair,
    Eye,
    EyeOff,
    ArrowLeft,
    Navigation,
    CalendarDays,
    Cloud,
    Maximize2,
} from "lucide-react";

const locations = [
    {
        id: 1,
        name: "Yamuna River Region",
        type: "Construction",
        date: "12 Jun 2025",
        sensor: "Sentinel-2",
        confidence: "92%",
        x: 55,
        y: 42,
    },
    {
        id: 2,
        name: "Rajasthan River Basin",
        type: "Water variation",
        date: "08 May 2025",
        sensor: "Sentinel-2",
        confidence: "87%",
        x: 38,
        y: 61,
    },
    {
        id: 3,
        name: "Northern India",
        type: "Road development",
        date: "21 Apr 2025",
        sensor: "Landsat 9",
        confidence: "81%",
        x: 67,
        y: 30,
    },
    {
        id: 4,
        name: "Urban Expansion Site",
        type: "Expansion",
        date: "18 Mar 2025",
        sensor: "Sentinel-2",
        confidence: "84%",
        x: 72,
        y: 56,
    },
];

export default function Explore() {
    const navigate = useNavigate();

    const [selected, setSelected] = useState(locations[0]);
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(true);
    const [showChanges, setShowChanges] = useState(true);
    const [showSimilar, setShowSimilar] = useState(true);
    const [showAoi, setShowAoi] = useState(false);

    const visibleLocations = locations.filter((location) =>
        location.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="explore-page">

            {/* NAVBAR */}
            <header className="explore-nav">

                <div className="explore-brand">
                    <div className="explore-brand-icon">
                        <Satellite size={21} />
                    </div>

                    <div>
                        <div className="explore-brand-name">
                            QuantumVision
                        </div>

                        <div className="explore-brand-subtitle">
                            EO ANALYST WORKBENCH
                        </div>
                    </div>
                </div>

                <nav className="explore-navigation">

                    <button onClick={() => navigate("/home")}>
                        Dashboard
                    </button>

                    <button onClick={() => navigate("/search")}>
                        Search
                    </button>

                    <button onClick={() => navigate("/change")}>
                        Change Analysis
                    </button>

                    <button className="active">
                        Explore Map
                    </button>

                </nav>

                <div className="explore-status">
                    <span />
                    OFFLINE / ON-PREMISES
                </div>

            </header>


            {/* PAGE */}
            <section className="explore-content">

                <button
                    className="explore-back"
                    onClick={() => navigate("/home")}
                >
                    <ArrowLeft size={15} />
                    Back to dashboard
                </button>


                {/* HEADING */}
                <div className="explore-heading">

                    <div>

                        <div className="explore-eyebrow">
                            <MapIcon size={14} />
                            GEOSPATIAL EXPLORATION
                        </div>

                        <h1>
                            Explore Earth.
                        </h1>

                        <p>
                            Inspect indexed observations, search locations,
                            review detected changes, and open satellite evidence
                            directly from the map.
                        </p>

                    </div>

                    <div className="map-mode-badge">
                        <span />
                        LOCAL MAP PROTOTYPE
                    </div>

                </div>


                {/* MAP WORKSPACE */}
                <section className="map-workspace">

                    {/* MAP TOOLBAR */}
                    <div className="map-toolbar">

                        <div className="map-search">

                            <Search size={15} />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search locations..."
                            />

                        </div>

                        <button
                            className="map-tool-button"
                            onClick={() => setShowAoi(!showAoi)}
                        >
                            <Target size={14} />
                            AOI
                        </button>

                        <button className="map-tool-button">
                            <Maximize2 size={14} />
                            Fullscreen
                        </button>

                    </div>


                    {/* MAP */}
                    <div className="local-map">

                        <div className="map-grid" />

                        <div className="map-contours contour-one" />
                        <div className="map-contours contour-two" />
                        <div className="map-contours contour-three" />

                        <div className="map-river river-one" />
                        <div className="map-river river-two" />

                        <div className="map-road road-one" />
                        <div className="map-road road-two" />

                        {showAoi && (
                            <div className="map-aoi">
                                <span>AOI</span>
                            </div>
                        )}

                        {visibleLocations.map((location) => {

                            const isSelected = selected.id === location.id;

                            return (
                                <button
                                    key={location.id}
                                    className={`map-marker ${isSelected ? "selected" : ""
                                        } ${location.type === "Construction"
                                            ? "change-marker"
                                            : ""
                                        }`}
                                    style={{
                                        left: `${location.x}%`,
                                        top: `${location.y}%`,
                                    }}
                                    onClick={() => setSelected(location)}
                                    title={location.name}
                                >
                                    <span />
                                </button>
                            );
                        })}


                        {/* MAP LABELS */}

                        <div className="map-label label-north">
                            NORTH
                        </div>

                        <div className="map-label label-region">
                            NORTHERN INDIA
                        </div>

                        <div className="map-label label-river">
                            RIVER CORRIDOR
                        </div>


                        {/* MAP SCALE */}

                        <div className="map-scale">
                            <span />
                            <small>50 km</small>
                        </div>


                        {/* COORDINATES */}

                        <div className="map-coordinates">
                            26.8467° N&nbsp;&nbsp; 80.9462° E
                        </div>


                        {/* ZOOM */}

                        <div className="map-zoom">

                            <button>+</button>
                            <button>−</button>

                        </div>

                    </div>


                    {/* MAP LEGEND */}

                    <div className="map-legend">

                        <div className="legend-title">
                            MAP LAYERS
                        </div>

                        <button
                            onClick={() => setShowSearch(!showSearch)}
                        >
                            {showSearch ? (
                                <Eye size={13} />
                            ) : (
                                <EyeOff size={13} />
                            )}

                            Search results

                        </button>

                        <button
                            onClick={() => setShowChanges(!showChanges)}
                        >
                            {showChanges ? (
                                <Eye size={13} />
                            ) : (
                                <EyeOff size={13} />
                            )}

                            Change detection

                        </button>

                        <button
                            onClick={() => setShowSimilar(!showSimilar)}
                        >
                            {showSimilar ? (
                                <Eye size={13} />
                            ) : (
                                <EyeOff size={13} />
                            )}

                            Similar sites

                        </button>

                    </div>

                </section>


                {/* LOWER WORKSPACE */}
                <section className="explore-lower">

                    {/* SELECTED LOCATION */}
                    <div className="location-panel">

                        <div className="panel-heading">

                            <div>
                                <span>SELECTED LOCATION</span>
                                <h2>{selected.name}</h2>
                            </div>

                            <div className="confidence-badge">
                                {selected.confidence}
                            </div>

                        </div>


                        <div className="location-type">
                            <span className="type-dot" />
                            {selected.type}
                        </div>


                        <div className="location-metadata">

                            <div>
                                <CalendarDays size={14} />
                                <span>Acquisition</span>
                                <strong>{selected.date}</strong>
                            </div>

                            <div>
                                <Satellite size={14} />
                                <span>Sensor</span>
                                <strong>{selected.sensor}</strong>
                            </div>

                            <div>
                                <Crosshair size={14} />
                                <span>Coordinates</span>
                                <strong>26.8467° N, 80.9462° E</strong>
                            </div>

                            <div>
                                <Cloud size={14} />
                                <span>Cloud cover</span>
                                <strong>4.2%</strong>
                            </div>

                        </div>


                        <div className="location-actions">

                            <button
                                className="primary-map-action"
                                onClick={() => navigate("/change")}
                            >
                                Analyze Change
                            </button>

                            <button
                                className="secondary-map-action"
                                onClick={() => navigate("/similar-sites")}
                            >
                                Find Similar Sites
                            </button>

                        </div>

                    </div>


                    {/* SUMMARY */}
                    <div className="map-summary">

                        <div className="panel-heading">

                            <div>
                                <span>ARCHIVE OVERVIEW</span>
                                <h2>Indexed observations</h2>
                            </div>

                            <Layers3 size={18} />

                        </div>


                        <div className="summary-grid">

                            <div>
                                <strong>3,842</strong>
                                <span>Sites</span>
                            </div>

                            <div>
                                <strong>12,480</strong>
                                <span>Scenes</span>
                            </div>

                            <div>
                                <strong>04</strong>
                                <span>Change candidates</span>
                            </div>

                            <div>
                                <strong>03</strong>
                                <span>Sensors</span>
                            </div>

                        </div>


                        <div className="map-system-note">

                            <Navigation size={14} />

                            <span>
                                Spatial search and map rendering are currently
                                operating on the bundled local demonstration index.
                            </span>

                        </div>

                    </div>

                </section>

            </section>

        </main>
    );
}