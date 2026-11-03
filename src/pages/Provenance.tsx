import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Satellite,
    ArrowLeft,
    Download,
    FileJson,
    FileText,
    Map,
    Database,
    Cpu,
    ShieldCheck,
    Clock3,
    CheckCircle2,
    ChevronDown,
    Copy,
    Layers3,
    Settings2,
} from "lucide-react";

export default function Provenance() {
    const navigate = useNavigate();

    const [copied, setCopied] = useState(false);
    const [exported, setExported] = useState("");

    const provenanceId = "QV-CHG-001";

    const copyId = () => {
        navigator.clipboard?.writeText(provenanceId);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 1500);
    };

    const handleExport = (format: string) => {
        setExported(format);

        setTimeout(() => {
            setExported("");
        }, 2500);
    };

    return (
        <main className="provenance-page">

            {/* NAVBAR */}
            <header className="workbench-nav">

                <div className="nav-brand">
                    <div className="nav-brand-icon">
                        <Satellite size={22} />
                    </div>

                    <div>
                        <div className="nav-brand-name">
                            QuantumVision
                        </div>

                        <div className="nav-brand-subtitle">
                            EO ANALYST WORKBENCH
                        </div>
                    </div>
                </div>

                <nav className="nav-links">
                    <button onClick={() => navigate("/home")}>
                        Dashboard
                    </button>

                    <button onClick={() => navigate("/search")}>
                        Search
                    </button>

                    <button onClick={() => navigate("/change")}>
                        Change
                    </button>

                    <button onClick={() => navigate("/explore")}>
                        Explore
                    </button>

                    <button onClick={() => navigate("/similar-sites")}>
                        Similar Sites
                    </button>

                    <button onClick={() => navigate("/review")}>
                        Review
                    </button>

                    <button className="active">
                        Provenance
                    </button>
                </nav>

                <div className="nav-status">
                    <span className="status-dot" />
                    OFFLINE / ON-PREMISES
                </div>

            </header>


            {/* HEADER */}
            <section className="provenance-header">

                <div>

                    <div className="page-eyebrow">
                        ANALYSIS RECORD <span>•</span> PROVENANCE
                    </div>

                    <h1>
                        Every result has a trace.
                    </h1>

                    <p>
                        Inspect the source imagery, processing pipeline, model
                        information and analyst decision associated with this
                        analysis.
                    </p>

                </div>

                <div className="provenance-id">

                    <span>ANALYSIS ID</span>

                    <strong>
                        {provenanceId}
                    </strong>

                    <button onClick={copyId}>
                        {copied ? (
                            <>
                                <CheckCircle2 size={14} />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy size={14} />
                                Copy ID
                            </>
                        )}
                    </button>

                </div>

            </section>


            {/* EXPORT BAR */}
            <section className="export-bar">

                <div className="export-title">

                    <Download size={18} />

                    <div>
                        <strong>
                            Export analysis
                        </strong>

                        <span>
                            Provenance is retained with every export.
                        </span>
                    </div>

                </div>

                <div className="export-buttons">

                    <button onClick={() => handleExport("JSON")}>
                        <FileJson size={17} />
                        JSON
                    </button>

                    <button onClick={() => handleExport("CSV")}>
                        <Database size={17} />
                        CSV
                    </button>

                    <button onClick={() => handleExport("GeoJSON")}>
                        <Map size={17} />
                        GeoJSON
                    </button>

                    <button onClick={() => handleExport("PDF")}>
                        <FileText size={17} />
                        PDF Report
                    </button>

                </div>

            </section>


            {exported && (
                <div className="export-success">
                    <CheckCircle2 size={17} />
                    {exported} export prepared using the local demo record.
                </div>
            )}


            {/* CONTENT */}
            <section className="provenance-content">

                {/* SOURCE */}
                <section className="provenance-card">

                    <div className="provenance-card-header">

                        <div className="provenance-icon">
                            <Satellite size={19} />
                        </div>

                        <div>
                            <span className="card-label">
                                SOURCE
                            </span>

                            <h2>
                                Source Scene
                            </h2>
                        </div>

                    </div>


                    <div className="metadata-grid">

                        <Metadata
                            label="Source"
                            value="Sentinel-2"
                        />

                        <Metadata
                            label="Scene ID"
                            value="S2A_DEMO_20250612"
                        />

                        <Metadata
                            label="Acquisition"
                            value="12 Jun 2025"
                        />

                        <Metadata
                            label="Resolution"
                            value="10 m"
                        />

                        <Metadata
                            label="Cloud coverage"
                            value="4.2%"
                        />

                        <Metadata
                            label="File format"
                            value="Cloud Optimized GeoTIFF"
                        />

                        <Metadata
                            label="CRS"
                            value="EPSG:4326"
                        />

                        <Metadata
                            label="Data status"
                            value="Locally staged"
                        />

                    </div>

                </section>


                {/* LOCATION */}
                <section className="provenance-card">

                    <div className="provenance-card-header">

                        <div className="provenance-icon">
                            <Map size={19} />
                        </div>

                        <div>
                            <span className="card-label">
                                GEOSPATIAL
                            </span>

                            <h2>
                                Location & Coverage
                            </h2>
                        </div>

                    </div>


                    <div className="geo-panel">

                        <div className="geo-visual">

                            <div className="geo-grid" />

                            <div className="geo-crosshair">
                                <span />
                                <span />
                            </div>

                            <div className="geo-point">
                                <div />
                            </div>

                            <div className="geo-label">
                                YAMUNA RIVER REGION
                            </div>

                        </div>


                        <div className="geo-details">

                            <Metadata
                                label="Region"
                                value="Yamuna River Region"
                            />

                            <Metadata
                                label="Latitude"
                                value="28.6139° N"
                            />

                            <Metadata
                                label="Longitude"
                                value="77.2090° E"
                            />

                            <Metadata
                                label="AOI"
                                value="Demo analysis boundary"
                            />

                        </div>

                    </div>

                </section>


                {/* PROCESSING HISTORY */}
                <section className="provenance-card">

                    <div className="provenance-card-header">

                        <div className="provenance-icon">
                            <Layers3 size={19} />
                        </div>

                        <div>
                            <span className="card-label">
                                PROCESSING
                            </span>

                            <h2>
                                Processing History
                            </h2>
                        </div>

                    </div>


                    <div className="processing-list">

                        <ProcessingStep
                            number="01"
                            title="Input scene"
                            description="Satellite scene loaded from local imagery archive."
                        />

                        <ProcessingStep
                            number="02"
                            title="Quality filtering"
                            description="Cloud and invalid-pixel checks applied."
                        />

                        <ProcessingStep
                            number="03"
                            title="Registration"
                            description="Observations aligned to a common spatial reference."
                        />

                        <ProcessingStep
                            number="04"
                            title="Radiometric normalization"
                            description="Image intensity differences normalized before comparison."
                        />

                        <ProcessingStep
                            number="05"
                            title="Feature extraction"
                            description="Local visual and geospatial features generated."
                        />

                        <ProcessingStep
                            number="06"
                            title="Embedding generation"
                            description="Feature representation prepared for local retrieval."
                        />

                        <ProcessingStep
                            number="07"
                            title="Change analysis"
                            description="Multi-temporal comparison produced the candidate change mask."
                        />

                    </div>

                </section>


                {/* MODEL */}
                <section className="provenance-card">

                    <div className="provenance-card-header">

                        <div className="provenance-icon">
                            <Cpu size={19} />
                        </div>

                        <div>
                            <span className="card-label">
                                ARTIFICIAL INTELLIGENCE
                            </span>

                            <h2>
                                Model Information
                            </h2>
                        </div>

                    </div>


                    <div className="model-grid">

                        <Metadata
                            label="Retrieval model"
                            value="Local embedding pipeline"
                        />

                        <Metadata
                            label="Model version"
                            value="QV-Embedding-Demo v1.0"
                        />

                        <Metadata
                            label="Change detector"
                            value="Local temporal detector"
                        />

                        <Metadata
                            label="Model source"
                            value="Locally packaged"
                        />

                        <Metadata
                            label="Inference"
                            value="On-premises"
                        />

                        <Metadata
                            label="License"
                            value="See model manifest"
                        />

                    </div>


                    <div className="model-note">

                        <ShieldCheck size={16} />

                        <span>
                            No external AI API is required for this demonstration.
                            Model provenance is intended to be preserved alongside
                            the analysis record.
                        </span>

                    </div>

                </section>


                {/* ANALYST DECISION */}
                <section className="provenance-card">

                    <div className="provenance-card-header">

                        <div className="provenance-icon">
                            <ShieldCheck size={19} />
                        </div>

                        <div>
                            <span className="card-label">
                                HUMAN REVIEW
                            </span>

                            <h2>
                                Analyst Decision
                            </h2>
                        </div>

                    </div>


                    <div className="decision-record">

                        <div className="decision-status">
                            <CheckCircle2 size={22} />

                            <div>
                                <strong>
                                    Confirmed
                                </strong>

                                <span>
                                    Change verified during analyst review
                                </span>
                            </div>
                        </div>


                        <div className="decision-meta">

                            <Metadata
                                label="Candidate"
                                value="QV-CHG-001"
                            />

                            <Metadata
                                label="Decision"
                                value="Confirmed"
                            />

                            <Metadata
                                label="Recorded"
                                value="13 Jun 2025 • 10:45"
                            />

                            <Metadata
                                label="Reason"
                                value="Evidence supports construction"
                            />

                        </div>

                    </div>

                </section>


                {/* AUDIT TRAIL */}
                <section className="provenance-card">

                    <div className="provenance-card-header">

                        <div className="provenance-icon">
                            <Clock3 size={19} />
                        </div>

                        <div>
                            <span className="card-label">
                                AUDIT
                            </span>

                            <h2>
                                Audit Trail
                            </h2>
                        </div>

                    </div>


                    <div className="audit-list">

                        <Audit
                            time="10:42"
                            title="Candidate generated"
                            description="Change candidate QV-CHG-001 created."
                        />

                        <Audit
                            time="10:43"
                            title="Candidate opened"
                            description="Analyst opened multi-temporal evidence."
                        />

                        <Audit
                            time="10:45"
                            title="Change confirmed"
                            description="Analyst confirmed construction-related change."
                        />

                        <Audit
                            time="10:45"
                            title="Decision stored"
                            description="Decision added to the local audit record."
                        />

                    </div>

                </section>


                {/* MANIFEST */}
                <section className="provenance-card manifest-card">

                    <div>

                        <div className="provenance-card-header">

                            <div className="provenance-icon">
                                <Settings2 size={19} />
                            </div>

                            <div>
                                <span className="card-label">
                                    EXPORT MANIFEST
                                </span>

                                <h2>
                                    Provenance package
                                </h2>
                            </div>

                        </div>

                        <p>
                            The exported package should include the analysis result,
                            source-scene metadata, processing history, model information,
                            quality information and analyst decision.
                        </p>

                    </div>


                    <div className="manifest-tags">

                        <span>Source scene</span>
                        <span>Coordinates</span>
                        <span>Change type</span>
                        <span>Confidence</span>
                        <span>Processing history</span>
                        <span>Model information</span>
                        <span>Analyst decision</span>
                        <span>Audit trail</span>

                    </div>

                </section>

            </section>


            <footer className="workbench-footer">
                <span>QUANTUMVISION</span>
                <span>•</span>
                <span>SIH26227</span>
                <span>•</span>
                <span>PROVENANCE PRESERVED</span>
            </footer>

        </main>
    );
}


/* =========================================================
   COMPONENTS
   ========================================================= */

function Metadata({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="metadata-item">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>
    );
}


function ProcessingStep({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="processing-step">

            <div className="processing-number">
                {number}
            </div>

            <div className="processing-line" />

            <div className="processing-text">

                <strong>
                    {title}
                </strong>

                <span>
                    {description}
                </span>

            </div>

            <CheckCircle2
                size={17}
                className="processing-check"
            />

        </div>
    );
}


function Audit({
    time,
    title,
    description,
}: {
    time: string;
    title: string;
    description: string;
}) {
    return (
        <div className="audit-row">

            <div className="audit-time">
                {time}
            </div>

            <div className="audit-marker">
                <CheckCircle2 size={15} />
            </div>

            <div>

                <strong>
                    {title}
                </strong>

                <span>
                    {description}
                </span>

            </div>

        </div>
    );
}