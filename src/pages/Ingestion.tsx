import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Satellite,
    Upload,
    CheckCircle2,
    AlertCircle,
    Database,
    FileImage,
    RefreshCw,
    ArrowRight,
} from "lucide-react";

export default function Ingestion() {
    const navigate = useNavigate();

    const [fileSelected, setFileSelected] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processed, setProcessed] = useState(false);

    const handleProcess = () => {
        setProcessing(true);

        setTimeout(() => {
            setProcessing(false);
            setProcessed(true);
        }, 1200);
    };

    return (
        <main className="ingestion-page">

            {/* NAVBAR */}
            <nav className="workbench-nav">
                <div
                    className="nav-brand"
                    onClick={() => navigate("/home")}
                >
                    <div className="nav-brand-icon">
                        <Satellite size={20} />
                    </div>

                    <div>
                        <strong>QuantumVision</strong>
                        <span>EO ANALYST WORKBENCH</span>
                    </div>
                </div>

                <div className="nav-links">
                    <button onClick={() => navigate("/home")}>Dashboard</button>
                    <button onClick={() => navigate("/search")}>Search</button>
                    <button onClick={() => navigate("/explore")}>Explore</button>
                    <button onClick={() => navigate("/change")}>Change Analysis</button>
                    <button onClick={() => navigate("/similar-sites")}>
                        Similar Sites
                    </button>
                    <button onClick={() => navigate("/review")}>Review Queue</button>
                    <button onClick={() => navigate("/provenance")}>
                        Provenance
                    </button>
                    <button className="active">Ingestion</button>
                </div>

                <div className="offline-status">
                    <span />
                    OFFLINE / ON-PREMISES
                </div>
            </nav>

            {/* HEADER */}
            <header className="ingestion-header">
                <div>
                    <div className="ingestion-eyebrow">
                        DATA MANAGEMENT
                    </div>

                    <h1>Ingest satellite imagery.</h1>

                    <p>
                        Validate, process and incrementally index new Earth observation
                        scenes without rebuilding the complete archive.
                    </p>
                </div>

                <div className="ingestion-summary">
                    <span>INDEXED SCENES</span>
                    <strong>1,207</strong>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <section className="ingestion-content">

                {/* UPLOAD */}
                <div className="ingestion-card upload-card">

                    <div className="card-heading">
                        <div className="card-icon">
                            <Upload size={19} />
                        </div>

                        <div>
                            <h2>Add imagery</h2>
                            <p>
                                Upload GeoTIFF or Cloud Optimized GeoTIFF imagery.
                            </p>
                        </div>
                    </div>

                    <label className="upload-zone">

                        <input
                            type="file"
                            accept=".tif,.tiff,.cog"
                            onChange={(event) => {
                                if (event.target.files?.length) {
                                    setFileSelected(true);
                                    setProcessed(false);
                                }
                            }}
                        />

                        <FileImage size={32} />

                        {fileSelected ? (
                            <>
                                <strong>Satellite scene selected</strong>
                                <span>Ready for validation</span>
                            </>
                        ) : (
                            <>
                                <strong>Choose a satellite scene</strong>
                                <span>
                                    Drag & drop or click to browse
                                </span>
                            </>
                        )}

                        <small>
                            Supported: GeoTIFF • COG
                        </small>
                    </label>

                    {fileSelected && (
                        <div className="selected-file">
                            <div>
                                <FileImage size={18} />

                                <div>
                                    <strong>satellite_scene_2026.tif</strong>
                                    <span>GeoTIFF • Local file</span>
                                </div>
                            </div>

                            <CheckCircle2 size={19} />
                        </div>
                    )}
                </div>

                {/* SCENE METADATA */}
                <div className="ingestion-card">

                    <div className="card-heading">
                        <div className="card-icon">
                            <Database size={19} />
                        </div>

                        <div>
                            <h2>Scene metadata</h2>
                            <p>
                                Metadata preserved during ingestion.
                            </p>
                        </div>
                    </div>

                    <div className="ingestion-metadata">

                        <div>
                            <span>Scene ID</span>
                            <strong>S2A_DEMO_2026_001</strong>
                        </div>

                        <div>
                            <span>Sensor</span>
                            <strong>Sentinel-2</strong>
                        </div>

                        <div>
                            <span>Acquisition date</span>
                            <strong>12 June 2026</strong>
                        </div>

                        <div>
                            <span>Resolution</span>
                            <strong>10 m</strong>
                        </div>

                        <div>
                            <span>CRS</span>
                            <strong>EPSG:32643</strong>
                        </div>

                        <div>
                            <span>Cloud coverage</span>
                            <strong>4.2%</strong>
                        </div>

                    </div>
                </div>

                {/* VALIDATION / PROCESSING */}
                <div className="ingestion-card">

                    <div className="card-heading">
                        <div className="card-icon">
                            <RefreshCw size={19} />
                        </div>

                        <div>
                            <h2>Processing pipeline</h2>
                            <p>
                                Prepare the scene for search and analysis.
                            </p>
                        </div>
                    </div>

                    <div className="pipeline">

                        <div className="pipeline-step completed">
                            <span>01</span>
                            <div>
                                <strong>Validate file</strong>
                                <p>Format and metadata verification</p>
                            </div>
                            <CheckCircle2 size={18} />
                        </div>

                        <div className="pipeline-step completed">
                            <span>02</span>
                            <div>
                                <strong>Quality filtering</strong>
                                <p>Cloud and valid-data checks</p>
                            </div>
                            <CheckCircle2 size={18} />
                        </div>

                        <div className="pipeline-step">
                            <span>03</span>
                            <div>
                                <strong>Preprocess</strong>
                                <p>Normalization and tile preparation</p>
                            </div>
                        </div>

                        <div className="pipeline-step">
                            <span>04</span>
                            <div>
                                <strong>Generate embeddings</strong>
                                <p>Create searchable feature representation</p>
                            </div>
                        </div>

                        <div className="pipeline-step">
                            <span>05</span>
                            <div>
                                <strong>Update vector index</strong>
                                <p>Incremental indexing without full rebuild</p>
                            </div>
                        </div>

                    </div>

                    <div className="ingestion-actions">

                        <button className="secondary-action">
                            <AlertCircle size={17} />
                            Validate
                        </button>

                        <button
                            className="primary-action"
                            disabled={!fileSelected || processing}
                            onClick={handleProcess}
                        >
                            {processing ? "Processing..." : "Process & Index"}
                            <ArrowRight size={17} />
                        </button>

                    </div>

                    {processed && (
                        <div className="ingestion-success">
                            <CheckCircle2 size={18} />

                            <div>
                                <strong>Incremental ingestion completed</strong>
                                <span>
                                    1 scene processed and added to the local vector index.
                                </span>
                            </div>
                        </div>
                    )}

                </div>

                {/* CURRENT INDEX */}
                <div className="index-status">

                    <div>
                        <span>Current index</span>
                        <strong>READY</strong>
                    </div>

                    <div>
                        <span>Indexed scenes</span>
                        <strong>1,207</strong>
                    </div>

                    <div>
                        <span>New scenes</span>
                        <strong>38</strong>
                    </div>

                    <div>
                        <span>Last update</span>
                        <strong>Today, 10:42</strong>
                    </div>

                    <div>
                        <span>Mode</span>
                        <strong>LOCAL</strong>
                    </div>

                </div>

            </section>

            <footer className="workbench-footer">
                QUANTUMVISION <span>•</span> SIH26227
            </footer>

        </main>
    );
}