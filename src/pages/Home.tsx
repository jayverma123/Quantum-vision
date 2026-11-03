
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Satellite,
    Search,
    Clock3,
    Map,
    Database,
    Activity,
    ArrowUpRight,
    ChevronRight,
    Layers3,
    LogOut,
    RefreshCw,
} from "lucide-react";

import {
    getSatelliteComparison,
    subscribeSatelliteComparison,
    type SatelliteComparison,
} from "../satelliteStore";

const API = "http://127.0.0.1:8000";

export default function Home() {
    const navigate = useNavigate();

    const [comparison, setComparison] =
        useState<SatelliteComparison | null>(
            () => getSatelliteComparison()
        );

    const [backendImage, setBackendImage] =
        useState<string | null>(null);

    const [imageLoading, setImageLoading] =
        useState(true);

    const [imageError, setImageError] =
        useState(false);

    const [refreshKey, setRefreshKey] =
        useState(0);

    /*
     * Listen for uploaded-image updates.
     * Change.tsx dispatches this event after analysis succeeds.
     */
    useEffect(() => {
        const updateComparison = () => {
            setComparison(
                getSatelliteComparison()
            );
        };

        const unsubscribe =
            subscribeSatelliteComparison(
                updateComparison
            );

        window.addEventListener(
            "storage",
            updateComparison
        );

        return () => {
            unsubscribe();

            window.removeEventListener(
                "storage",
                updateComparison
            );
        };
    }, []);

    /*
     * Fetch the Sentinel-2 preview only when no
     * user-uploaded comparison exists.
     */
    useEffect(() => {
        if (comparison) {
            setImageLoading(false);
            setImageError(false);

            return;
        }

        let active = true;
        let objectUrl: string | null = null;

        const loadSatelliteImage = async () => {
            setImageLoading(true);
            setImageError(false);

            try {
                const response = await fetch(
                    `${API}/api/satellite/preview?latitude=26.9124&longitude=75.7873&days_back=30`
                );

                if (!response.ok) {
                    throw new Error(
                        `Satellite request failed with status ${response.status}`
                    );
                }

                const blob = await response.blob();

                if (!blob.type.startsWith("image/")) {
                    throw new Error(
                        "The server did not return an image."
                    );
                }

                objectUrl = URL.createObjectURL(blob);

                if (active) {
                    setBackendImage(objectUrl);
                }
            } catch (error) {
                console.error(
                    "Satellite preview error:",
                    error
                );

                if (active) {
                    setImageError(true);
                    setBackendImage(null);
                }
            } finally {
                if (active) {
                    setImageLoading(false);
                }
            }
        };

        loadSatelliteImage();

        return () => {
            active = false;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [comparison, refreshKey]);

    const displayImage =
        comparison?.after.dataUrl || backendImage;

    const regionLabel = comparison
        ? comparison.region
        : "JAIPUR REGION";

    const locationDescription = comparison
        ? `Capture date: ${comparison.after.captureDate}`
        : "26.9124° N · 75.7873° E";

    const previewSource = comparison
        ? "USER UPLOAD"
        : "SENTINEL-2";

    const clearUploadedPreview = () => {
        sessionStorage.removeItem(
            "quantumvision_satellite_comparison"
        );

        window.dispatchEvent(
            new Event("quantumvision-satellite-updated")
        );

        setComparison(null);
        setBackendImage(null);
        setRefreshKey((previous) => previous + 1);
    };

    return (
        <main className="dashboard">
            <div className="dashboard-orbit orbit-one" />
            <div className="dashboard-orbit orbit-two" />
            <div className="dashboard-glow" />

            {/* NAVBAR */}
            <header className="dashboard-nav">
                <div className="dashboard-brand">
                    <div className="dashboard-brand-icon">
                        <Satellite size={22} strokeWidth={1.7} />
                    </div>

                    <div>
                        <div className="dashboard-brand-name">
                            QuantumVision
                        </div>

                        <div className="dashboard-brand-subtitle">
                            EO ANALYST WORKBENCH
                        </div>
                    </div>
                </div>

                <nav className="dashboard-links">
                    <button className="nav-active">
                        Dashboard
                    </button>

                    <button onClick={() => navigate("/search")}>
                        Search
                    </button>

                    <button onClick={() => navigate("/change")}>
                        Change Analysis
                    </button>

                    <button onClick={() => navigate("/explore")}>
                        Explore
                    </button>

                    <button onClick={() => navigate("/similar-sites")}>
                        Similar Sites
                    </button>

                    <button onClick={() => navigate("/review")}>
                        Review Queue
                    </button>

                    <button onClick={() => navigate("/provenance")}>
                        Provenance
                    </button>

                    <button onClick={() => navigate("/ingestion")}>
                        Ingestion
                    </button>
                </nav>

                <div className="dashboard-nav-right">
                    <div className="dashboard-system-status">
                        <span />
                        SYSTEM ONLINE
                    </div>

                    <button
                        className="dashboard-logout"
                        onClick={() => navigate("/")}
                        title="Log out"
                    >
                        <LogOut size={15} />
                        <span>Log out</span>
                    </button>
                </div>
            </header>

            {/* HERO */}
            <section className="dashboard-hero">
                <div className="hero-copy">
                    <div className="dashboard-eyebrow">
                        <span className="pulse-dot" />
                        SIH26227 • SPACE TECHNOLOGY
                    </div>

                    <h1>
                        See the Earth
                        <br />
                        <span>differently.</span>
                    </h1>

                    <p>
                        Search satellite imagery using natural
                        language, discover meaningful changes
                        over time, and turn Earth observation
                        data into clear evidence.
                    </p>

                    <div className="hero-buttons">
                        <button
                            className="primary-dashboard-button"
                            onClick={() => navigate("/search")}
                        >
                            <Search size={18} />
                            Search Satellite Data
                            <ArrowUpRight size={17} />
                        </button>

                        <button
                            className="secondary-dashboard-button"
                            onClick={() => navigate("/change")}
                        >
                            <Clock3 size={18} />
                            Analyze Changes
                        </button>
                    </div>
                </div>

                {/* SATELLITE OVERVIEW */}
                <div className="hero-overview-panel">
                    <div className="overview-header">
                        <div>
                            <span>
                                LOCAL INTELLIGENCE ENVIRONMENT
                            </span>

                            <h3>
                                {comparison
                                    ? "Latest Uploaded Imagery"
                                    : "Satellite Archive"}
                            </h3>
                        </div>

                        <button
                            type="button"
                            className="overview-status"
                            onClick={() => {
                                if (comparison) {
                                    setComparison(
                                        getSatelliteComparison()
                                    );
                                } else {
                                    setRefreshKey(
                                        (previous) => previous + 1
                                    );
                                }
                            }}
                            title="Refresh the preview"
                            disabled={
                                !comparison && imageLoading
                            }
                            style={{
                                cursor: imageLoading
                                    ? "wait"
                                    : "pointer",
                                border: "none",
                                font: "inherit",
                            }}
                        >
                            <RefreshCw size={12} />

                            {comparison
                                ? "UPLOADED"
                                : imageLoading
                                    ? "LOADING"
                                    : imageError
                                        ? "RETRY"
                                        : "REFRESH"}
                        </button>
                    </div>

                    <div
                        className="overview-preview"
                        style={{
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {displayImage && (
                            <img
                                src={displayImage}
                                alt={
                                    comparison
                                        ? "Newer user-uploaded satellite image"
                                        : "Sentinel-2 satellite imagery of Jaipur"
                                }
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "inherit",
                                }}
                            />
                        )}

                        {!displayImage && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 10,
                                    padding: 16,
                                    background: "#101b2b",
                                    color: "#ffffff",
                                    fontSize: 13,
                                    textAlign: "center",
                                    zIndex: 1,
                                }}
                            >
                                <Satellite size={30} />

                                {imageLoading
                                    ? "Loading satellite imagery..."
                                    : imageError
                                        ? "Satellite imagery unavailable."
                                        : "No satellite image available."}

                                {imageError && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRefreshKey(
                                                (previous) =>
                                                    previous + 1
                                            )
                                        }
                                        style={{
                                            padding: "8px 14px",
                                            borderRadius: 6,
                                            border: "1px solid #64748b",
                                            background: "#1e293b",
                                            color: "#ffffff",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}

                        {/* CHANGE OVERLAY */}
                        {comparison?.changeOverlay && (
                            <img
                                src={`data:image/png;base64,${comparison.changeOverlay}`}
                                alt="RGB pixel difference overlay"
                                title="RGB pixel-difference overlay"
                                style={{
                                    position: "absolute",
                                    right: 10,
                                    bottom: 10,
                                    width: "35%",
                                    maxHeight: "35%",
                                    objectFit: "contain",
                                    border: "1px solid rgba(255,255,255,0.6)",
                                    borderRadius: 8,
                                    background: "#101b2b",
                                    zIndex: 5,
                                }}
                            />
                        )}

                        <div
                            className="preview-grid"
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 2,
                                pointerEvents: "none",
                            }}
                        />

                        <div
                            className="preview-crosshair horizontal"
                            style={{
                                zIndex: 3,
                                pointerEvents: "none",
                            }}
                        />

                        <div
                            className="preview-crosshair vertical"
                            style={{
                                zIndex: 3,
                                pointerEvents: "none",
                            }}
                        />

                        <div
                            className="preview-location"
                            style={{ zIndex: 4 }}
                        >
                            <span className="location-dot" />

                            <div>
                                <strong>
                                    {regionLabel.toUpperCase()}
                                </strong>

                                <small>
                                    {locationDescription}
                                </small>
                            </div>
                        </div>

                        <div
                            className="preview-label"
                            style={{ zIndex: 4 }}
                        >
                            {previewSource}

                            <span>•</span>

                            {comparison
                                ? "USER IMAGE"
                                : "10 m"}
                        </div>
                    </div>

                    {comparison && (
                        <div
                            style={{
                                padding: "12px 0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <div>
                                <strong
                                    style={{
                                        display: "block",
                                        fontSize: 13,
                                    }}
                                >
                                    {comparison.after.name}
                                </strong>

                                <small>
                                    Before: {comparison.before.captureDate}
                                    {" → "}
                                    After: {comparison.after.captureDate}
                                </small>

                                {comparison.changePercentage !==
                                    undefined && (
                                        <small
                                            style={{
                                                display: "block",
                                                marginTop: 4,
                                            }}
                                        >
                                            Pixel difference:{" "}
                                            {comparison.changePercentage}%
                                        </small>
                                    )}
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/change")}
                                className="secondary-dashboard-button"
                            >
                                View Analysis
                            </button>
                        </div>
                    )}

                    {!comparison && (
                        <>
                            {/* Demo counts retained from your original UI */}
                            <div className="overview-metrics">
                                <div>
                                    <span>SCENES</span>
                                    <strong>12,480</strong>
                                </div>

                                <div>
                                    <span>SITES</span>
                                    <strong>3,842</strong>
                                </div>

                                <div>
                                    <span>SENSORS</span>
                                    <strong>03</strong>
                                </div>
                            </div>

                            <div className="overview-footer">
                                <span>INDEX STATUS</span>
                                <strong>
                                    LOCAL VECTOR INDEX READY
                                </strong>
                            </div>
                        </>
                    )}

                    {comparison && (
                        <button
                            type="button"
                            onClick={clearUploadedPreview}
                            style={{
                                marginTop: 8,
                                padding: "8px 12px",
                                border: "1px solid #64748b",
                                borderRadius: 6,
                                background: "transparent",
                                color: "inherit",
                                cursor: "pointer",
                            }}
                        >
                            Clear uploaded preview
                        </button>
                    )}
                </div>
            </section>

            {/* PRIMARY ACTIONS */}
            <section className="dashboard-section">
                <div className="section-heading">
                    <div>
                        <span>ANALYST TOOLS</span>
                        <h2>What do you want to discover?</h2>
                    </div>

                    <p>
                        Start with a question, location, or time period.
                    </p>
                </div>

                <div className="action-grid">
                    <button
                        className="action-card"
                        onClick={() => navigate("/search")}
                    >
                        <div className="action-icon">
                            <Search size={23} />
                        </div>

                        <div className="action-content">
                            <span className="action-number">01</span>
                            <h3>Semantic Search</h3>

                            <p>
                                Find satellite imagery using natural-language
                                descriptions instead of keywords alone.
                            </p>
                        </div>

                        <ChevronRight
                            className="action-arrow"
                            size={20}
                        />
                    </button>

                    <button
                        className="action-card"
                        onClick={() => navigate("/change")}
                    >
                        <div className="action-icon">
                            <Clock3 size={23} />
                        </div>

                        <div className="action-content">
                            <span className="action-number">02</span>
                            <h3>Change Analysis</h3>

                            <p>
                                Compare observations across time and inspect
                                potential visual changes.
                            </p>
                        </div>

                        <ChevronRight
                            className="action-arrow"
                            size={20}
                        />
                    </button>

                    <button
                        className="action-card"
                        onClick={() => navigate("/explore")}
                    >
                        <div className="action-icon">
                            <Map size={23} />
                        </div>

                        <div className="action-content">
                            <span className="action-number">03</span>
                            <h3>Explore Earth</h3>

                            <p>
                                Browse satellite scenes by location, date,
                                sensor, and geographic area.
                            </p>
                        </div>

                        <ChevronRight
                            className="action-arrow"
                            size={20}
                        />
                    </button>
                </div>
            </section>

            {/* ARCHIVE STATISTICS */}
            <section className="stats-section">
                <div className="section-heading compact">
                    <div>
                        <span>ARCHIVE OVERVIEW</span>
                        <h2>Earth observation archive</h2>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-top">
                            <Database size={18} />
                            <span>INDEXED</span>
                        </div>

                        <strong>12,480</strong>
                        <p>Satellite scenes</p>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <Layers3 size={18} />
                            <span>SITES</span>
                        </div>

                        <strong>3,842</strong>
                        <p>Indexed locations</p>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <Activity size={18} />
                            <span>ANALYSIS</span>
                        </div>

                        <strong>126</strong>
                        <p>Detected changes</p>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <Satellite size={18} />
                            <span>SENSORS</span>
                        </div>

                        <strong>03</strong>
                        <p>Supported sources</p>
                    </div>
                </div>

                <p
                    style={{
                        fontSize: 12,
                        opacity: 0.7,
                        marginTop: 12,
                    }}
                >
                    Archive counts are existing demonstration values;
                    they are not live backend statistics.
                </p>
            </section>

            {/* RECENT ANALYSIS */}
            <section className="recent-section">
                <div className="section-heading compact">
                    <div>
                        <span>RECENT ANALYSIS</span>
                        <h2>Latest observations</h2>
                    </div>

                    <button
                        className="view-all"
                        onClick={() => navigate("/review")}
                    >
                        View all
                        <ChevronRight size={15} />
                    </button>
                </div>

                {comparison ? (
                    <div className="analysis-list">
                        <div className="analysis-row">
                            <div className="analysis-marker construction" />

                            <div className="analysis-main">
                                <h3>
                                    Uploaded image comparison
                                </h3>

                                <p>
                                    {comparison.region}
                                    {" • "}
                                    {comparison.before.captureDate}
                                    {" → "}
                                    {comparison.after.captureDate}
                                </p>
                            </div>

                            <div className="confidence">
                                <span>PIXEL DIFFERENCE</span>

                                <strong>
                                    {comparison.changePercentage ?? "—"}
                                    {comparison.changePercentage !==
                                        undefined
                                        ? "%"
                                        : ""}
                                </strong>
                            </div>

                            <div className="analysis-status">
                                ANALYZED
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="analysis-list">
                        <div className="analysis-row">
                            <div className="analysis-marker construction" />

                            <div className="analysis-main">
                                <h3>No uploaded comparison yet</h3>

                                <p>
                                    Upload two images in Change Analysis
                                    to display the latest comparison here.
                                </p>
                            </div>

                            <button
                                className="view-all"
                                onClick={() => navigate("/change")}
                            >
                                Start analysis
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* FOOTER */}
            <footer className="dashboard-footer">
                <span>QUANTUMVISION</span>
                <span>•</span>
                <span>SIH26227</span>
                <span>•</span>
                <span>
                    ON-PREMISES EARTH OBSERVATION INTELLIGENCE
                </span>
            </footer>
        </main>
    );
}

