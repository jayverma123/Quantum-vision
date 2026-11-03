import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Satellite,
    MapPin,
    ArrowRight,
    Search,
    Layers3,
    Target,
    CalendarDays,
    Filter,
} from "lucide-react";

const sites = [
    {
        id: "SITE-014",
        name: "Yamuna Riverside",
        location: "Delhi NCR",
        type: "River Construction",
        similarity: 96.4,
        date: "12 Jun 2025",
        sensor: "Sentinel-2",
    },
    {
        id: "SITE-027",
        name: "Riverbank Development",
        location: "Agra Region",
        type: "River Construction",
        similarity: 91.8,
        date: "08 May 2025",
        sensor: "Sentinel-2",
    },
    {
        id: "SITE-041",
        name: "Urban River Edge",
        location: "Mathura Region",
        type: "Urban Expansion",
        similarity: 88.7,
        date: "21 Apr 2025",
        sensor: "Landsat 9",
    },
    {
        id: "SITE-063",
        name: "Open Ground Activity",
        location: "Jaipur Region",
        type: "Open Ground Activity",
        similarity: 84.9,
        date: "17 Mar 2025",
        sensor: "Sentinel-2",
    },
];

const clusters = [
    { name: "River Construction", count: 18 },
    { name: "Urban Expansion", count: 31 },
    { name: "Open Ground Activity", count: 14 },
    { name: "Water Variation", count: 22 },
];

export default function SimilarSites() {
    const navigate = useNavigate();

    const [selectedCluster, setSelectedCluster] = useState("All");
    const [query, setQuery] = useState("");

    const filteredSites = sites.filter((site) => {
        const matchesCluster =
            selectedCluster === "All" || site.type === selectedCluster;

        const matchesSearch =
            site.name.toLowerCase().includes(query.toLowerCase()) ||
            site.location.toLowerCase().includes(query.toLowerCase()) ||
            site.type.toLowerCase().includes(query.toLowerCase());

        return matchesCluster && matchesSearch;
    });

    return (
        <main className="similar-page">

            {/* ================= NAVBAR ================= */}

            <nav className="similar-navbar">

                <button
                    className="similar-logo"
                    onClick={() => navigate("/home")}
                >
                    <div className="similar-logo-icon">
                        <Satellite size={20} />
                    </div>

                    <div>
                        <strong>QuantumVision</strong>
                        <span>EO ANALYST WORKBENCH</span>
                    </div>
                </button>

                <div className="similar-nav-links">

                    <button onClick={() => navigate("/home")}>
                        Dashboard
                    </button>

                    <button onClick={() => navigate("/search")}>
                        Search
                    </button>

                    <button onClick={() => navigate("/explore")}>
                        Explore
                    </button>

                    <button onClick={() => navigate("/change")}>
                        Change Analysis
                    </button>

                    <button className="active">
                        Similar Sites
                    </button>

                </div>

                <div className="similar-system-status">
                    <span />
                    OFFLINE / ON-PREMISES
                </div>

            </nav>


            {/* ================= PAGE HEADER ================= */}

            <section className="similar-header">

                <div className="similar-header-label">
                    <Target size={14} />
                    SIMILARITY DISCOVERY
                </div>

                <h1>
                    Find similar
                    <br />
                    <span>locations.</span>
                </h1>

                <p>
                    Discover locations across the indexed satellite archive
                    that share similar visual and semantic characteristics.
                </p>

            </section>


            {/* ================= REFERENCE SITE ================= */}

            <section className="reference-card">

                <div className="reference-visual">

                    <div className="reference-grid" />

                    <div className="reference-river" />

                    <div className="reference-building building-one" />
                    <div className="reference-building building-two" />
                    <div className="reference-building building-three" />

                    <div className="reference-location">
                        <MapPin size={17} />
                    </div>

                    <div className="reference-tag">
                        REFERENCE OBSERVATION
                    </div>

                </div>


                <div className="reference-content">

                    <div className="content-label">
                        SELECTED SITE
                    </div>

                    <h2>
                        Yamuna River Region
                    </h2>

                    <p>
                        This observation is being used as the reference
                        for similarity discovery across the local archive.
                    </p>


                    <div className="reference-details">

                        <div>
                            <span>SCENE ID</span>
                            <strong>S2A-DEMO-2025-0612</strong>
                        </div>

                        <div>
                            <span>SENSOR</span>
                            <strong>Sentinel-2</strong>
                        </div>

                        <div>
                            <span>ACQUISITION</span>
                            <strong>12 Jun 2025</strong>
                        </div>

                        <div>
                            <span>REFERENCE SCORE</span>
                            <strong className="cyan">
                                94.2%
                            </strong>
                        </div>

                    </div>


                    <div className="reference-buttons">

                        <button
                            className="primary-action"
                            onClick={() => navigate("/change")}
                        >
                            Analyze Change
                            <ArrowRight size={15} />
                        </button>

                        <button
                            className="secondary-action"
                            onClick={() => navigate("/explore")}
                        >
                            <MapPin size={15} />
                            View on Map
                        </button>

                    </div>

                </div>

            </section>


            {/* ================= CLUSTERS ================= */}

            <section className="cluster-section">

                <div className="section-top">

                    <div>
                        <div className="content-label">
                            DISCOVERY GROUPS
                        </div>

                        <h2>
                            Similarity clusters
                        </h2>
                    </div>

                    <div className="cluster-total">
                        <Layers3 size={14} />
                        85 observations
                    </div>

                </div>


                <div className="cluster-grid">

                    <button
                        className={`cluster-card ${selectedCluster === "All" ? "selected" : ""
                            }`}
                        onClick={() => setSelectedCluster("All")}
                    >
                        <span>ALL</span>
                        <strong>All sites</strong>
                        <small>85 observations</small>
                    </button>


                    {clusters.map((cluster) => (
                        <button
                            key={cluster.name}
                            className={`cluster-card ${selectedCluster === cluster.name ? "selected" : ""
                                }`}
                            onClick={() => setSelectedCluster(cluster.name)}
                        >
                            <span>CLUSTER</span>

                            <strong>
                                {cluster.name}
                            </strong>

                            <small>
                                {cluster.count} observations
                            </small>
                        </button>
                    ))}

                </div>

            </section>


            {/* ================= DISCOVERY WORKSPACE ================= */}

            <section className="discovery-section">

                {/* MAP */}

                <div className="similar-map-card">

                    <div className="panel-header">

                        <div>
                            <div className="content-label">
                                SPATIAL DISTRIBUTION
                            </div>

                            <h2>
                                Similar sites
                            </h2>
                        </div>

                        <button className="map-filter">
                            <Filter size={14} />
                            Filter
                        </button>

                    </div>


                    <div className="similar-map">

                        <div className="map-grid" />

                        <div className="map-river-line" />

                        <span className="map-label label-delhi">
                            DELHI NCR
                        </span>

                        <span className="map-label label-agra">
                            AGRA
                        </span>

                        <span className="map-label label-mathura">
                            MATHURA
                        </span>

                        <span className="map-label label-jaipur">
                            JAIPUR
                        </span>


                        <div className="map-marker reference-marker">
                            <span />
                            <label>Reference</label>
                        </div>

                        <div className="map-marker marker-one">
                            <span />
                        </div>

                        <div className="map-marker marker-two">
                            <span />
                        </div>

                        <div className="map-marker marker-three">
                            <span />
                        </div>

                        <div className="map-marker marker-four">
                            <span />
                        </div>


                        <div className="map-legend">

                            <div>
                                <i className="reference-dot" />
                                Reference
                            </div>

                            <div>
                                <i className="similar-dot" />
                                Similar site
                            </div>

                        </div>

                        <div className="map-scale">
                            0 — 50 — 100 km
                        </div>

                    </div>

                </div>


                {/* RESULTS */}

                <div className="similar-results-card">

                    <div className="panel-header">

                        <div>
                            <div className="content-label">
                                RANKED MATCHES
                            </div>

                            <h2>
                                Similar observations
                            </h2>
                        </div>

                        <span className="result-count">
                            {filteredSites.length} results
                        </span>

                    </div>


                    {/* SEARCH */}

                    <div className="similar-search">

                        <Search size={15} />

                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search locations..."
                        />

                    </div>


                    <div className="result-list">

                        {filteredSites.map((site, index) => (

                            <article
                                className="similar-result"
                                key={site.id}
                            >

                                <div className="result-number">
                                    #{String(index + 1).padStart(2, "0")}
                                </div>


                                <div className="result-thumbnail">
                                    <div />
                                </div>


                                <div className="result-information">

                                    <div className="result-title">

                                        <h3>
                                            {site.name}
                                        </h3>

                                        <strong>
                                            {site.similarity}%
                                        </strong>

                                    </div>

                                    <p>
                                        {site.location}
                                    </p>


                                    <div className="result-metadata">

                                        <span>
                                            <Target size={11} />
                                            {site.type}
                                        </span>

                                        <span>
                                            <CalendarDays size={11} />
                                            {site.date}
                                        </span>

                                        <span>
                                            {site.sensor}
                                        </span>

                                    </div>

                                </div>


                                <button
                                    className="result-action"
                                    onClick={() => navigate("/change")}
                                >
                                    <ArrowRight size={15} />
                                </button>

                            </article>

                        ))}


                        {filteredSites.length === 0 && (

                            <div className="no-results">
                                No similar observations found.
                            </div>

                        )}

                    </div>

                </div>

            </section>


            {/* ================= METHOD ================= */}

            <section className="method-section">

                <div className="method-intro">

                    <div>
                        <div className="content-label">
                            DISCOVERY METHOD
                        </div>

                        <h2>
                            From one location
                            <br />
                            to many.
                        </h2>
                    </div>

                    <p>
                        QuantumVision represents indexed observations as
                        feature embeddings and searches the local vector
                        index to identify visually and semantically similar
                        locations.
                    </p>

                </div>


                <div className="method-flow">

                    <div>
                        <span>01</span>
                        <strong>Reference</strong>
                        <small>Selected observation</small>
                    </div>

                    <div>
                        <span>02</span>
                        <strong>Embedding</strong>
                        <small>Feature representation</small>
                    </div>

                    <div>
                        <span>03</span>
                        <strong>Vector search</strong>
                        <small>Nearest neighbours</small>
                    </div>

                    <div>
                        <span>04</span>
                        <strong>Discovery</strong>
                        <small>Ranked locations</small>
                    </div>

                </div>

            </section>

        </main>
    );
}