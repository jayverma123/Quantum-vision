import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


import {
    Satellite,
    Search,
    SlidersHorizontal,
    CheckCircle2,
    XCircle,
    Clock3,
    AlertTriangle,
    MapPin,
    CalendarDays,
    ShieldCheck,
    Activity,
    FileText,
    History,
    ChevronRight,
    LogOut,
} from "lucide-react";

type CandidateStatus =
    | "Pending"
    | "Confirmed"
    | "Rejected"
    | "Needs Review";

type Candidate = {
    id: string;
    location: string;
    changeType: string;
    detectionDate: string;
    beforeDate: string;
    afterDate: string;
    sensor: string;
    confidence: number;
    quality: number;
    status: CandidateStatus;
    description: string;
};

type AuditEntry = {
    time: string;
    action: string;
    detail: string;
};

const initialCandidates: Candidate[] = [
    {
        id: "QV-CHG-001",
        location: "Yamuna River Region",
        changeType: "Construction",
        detectionDate: "12 Jun 2025",
        beforeDate: "18 Apr 2024",
        afterDate: "12 Jun 2025",
        sensor: "Sentinel-2",
        confidence: 92,
        quality: 87,
        status: "Pending",
        description:
            "New built structures detected near the river corridor across multiple observations.",
    },
    {
        id: "QV-CHG-002",
        location: "Rajasthan River Basin",
        changeType: "Water Variation",
        detectionDate: "08 May 2025",
        beforeDate: "14 May 2024",
        afterDate: "08 May 2025",
        sensor: "Sentinel-2",
        confidence: 88,
        quality: 91,
        status: "Needs Review",
        description:
            "Significant variation in visible water extent between supported observations.",
    },
    {
        id: "QV-CHG-003",
        location: "Northern India",
        changeType: "Road Development",
        detectionDate: "21 Apr 2025",
        beforeDate: "03 Mar 2024",
        afterDate: "21 Apr 2025",
        sensor: "Landsat 9",
        confidence: 84,
        quality: 82,
        status: "Pending",
        description:
            "Linear surface expansion suggests possible development of a new road segment.",
    },
    {
        id: "QV-CHG-004",
        location: "Urban Expansion Zone",
        changeType: "Clearance",
        detectionDate: "16 Feb 2025",
        beforeDate: "11 Jan 2024",
        afterDate: "16 Feb 2025",
        sensor: "Sentinel-2",
        confidence: 79,
        quality: 76,
        status: "Pending",
        description:
            "Vegetation/open-surface conditions changed substantially within the selected AOI.",
    },
];

export default function Review() {
    const navigate = useNavigate();

    const [selectedId, setSelectedId] = useState(initialCandidates[0].id);
    const [statusFilter, setStatusFilter] = useState("All");
    const [search, setSearch] = useState("");

    const [reviewedCandidates, setReviewedCandidates] =
        useState<Candidate[]>(initialCandidates);

    const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([
        {
            time: "09:41",
            action: "Candidate generated",
            detail: "QV-CHG-001 entered the review queue.",
        },
        {
            time: "09:42",
            action: "Quality validation",
            detail: "Cloud, registration and seasonal checks completed.",
        },
        {
            time: "09:43",
            action: "Analyst review",
            detail: "Candidate opened for verification.",
        },
    ]);

    const selected =
        reviewedCandidates.find(
            (candidate) => candidate.id === selectedId
        ) || reviewedCandidates[0];

    const filteredCandidates = reviewedCandidates.filter((candidate) => {
        const matchesStatus =
            statusFilter === "All" || candidate.status === statusFilter;

        const searchValue = search.toLowerCase();

        const matchesSearch =
            candidate.location.toLowerCase().includes(searchValue) ||
            candidate.changeType.toLowerCase().includes(searchValue) ||
            candidate.id.toLowerCase().includes(searchValue);

        return matchesStatus && matchesSearch;
    });

    const updateStatus = (status: CandidateStatus) => {
        if (!selected) return;

        const previousStatus = selected.status;

        setReviewedCandidates((current) =>
            current.map((candidate) =>
                candidate.id === selected.id
                    ? { ...candidate, status }
                    : candidate
            )
        );

        const now = new Date();

        const time = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        setAuditEntries((current) => [
            ...current,
            {
                time,
                action: `Status changed to ${status}`,
                detail: `${selected.id}: ${previousStatus} → ${status}`,
            },
        ]);
    };

    const pendingCount = reviewedCandidates.filter(
        (candidate) => candidate.status === "Pending"
    ).length;

    const confirmedCount = reviewedCandidates.filter(
        (candidate) => candidate.status === "Confirmed"
    ).length;

    const needsReviewCount = reviewedCandidates.filter(
        (candidate) => candidate.status === "Needs Review"
    ).length;

    return (
        <main className="review-page">

            {/* =========================================================
                NAVIGATION
            ========================================================= */}

            <header className="review-navbar">

                <div className="review-brand">

                    <div className="review-brand-icon">
                        <Satellite size={22} />
                    </div>

                    <div>
                        <div className="review-brand-name">
                            QuantumVision
                        </div>

                        <div className="review-brand-subtitle">
                            EO ANALYST WORKBENCH
                        </div>
                    </div>

                </div>

                <nav className="review-nav-links">

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

                    <button
                        onClick={() =>
                            navigate("/similar-sites")
                        }
                    >
                        Similar Sites
                    </button>

                    <button className="active">
                        Review
                    </button>

                </nav>

                <div className="review-nav-status">

                    <span className="status-dot" />

                    OFFLINE / ON-PREMISES

                </div>

            </header>


            {/* =========================================================
                PAGE HEADER
            ========================================================= */}

            <section className="review-header">

                <div>

                    <div className="page-eyebrow">
                        ANALYST WORKFLOW
                        <span>•</span>
                        REVIEW QUEUE
                    </div>

                    <h1>
                        Verify what the system found.
                    </h1>

                    <p>
                        Review detected changes using multi-temporal
                        evidence, quality information and processing
                        provenance.
                    </p>

                </div>


                <div className="review-summary">

                    <div className="summary-item">

                        <strong>
                            {pendingCount}
                        </strong>

                        <span>
                            Pending
                        </span>

                    </div>

                    <div className="summary-item">

                        <strong>
                            {confirmedCount}
                        </strong>

                        <span>
                            Confirmed
                        </span>

                    </div>

                    <div className="summary-item">

                        <strong>
                            {needsReviewCount}
                        </strong>

                        <span>
                            Needs review
                        </span>

                    </div>

                </div>

            </section>


            {/* =========================================================
                TOOLBAR
            ========================================================= */}

            <section className="review-toolbar">

                <div className="review-search">

                    <Search size={17} />

                    <input
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search candidates, locations or change types..."
                    />

                </div>


                <div className="review-filter">

                    <SlidersHorizontal size={16} />

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >

                        <option value="All">
                            All statuses
                        </option>

                        <option value="Pending">
                            Pending
                        </option>

                        <option value="Needs Review">
                            Needs Review
                        </option>

                        <option value="Confirmed">
                            Confirmed
                        </option>

                        <option value="Rejected">
                            Rejected
                        </option>

                    </select>

                </div>

            </section>


            {/* =========================================================
                WORKSPACE
            ========================================================= */}

            <section className="review-workspace">


                {/* =====================================================
                    DETECTION QUEUE
                ===================================================== */}

                <aside className="review-queue">

                    <div className="queue-heading">

                        <div>

                            <span>
                                DETECTION QUEUE
                            </span>

                            <strong>
                                {filteredCandidates.length} candidates
                            </strong>

                        </div>

                    </div>


                    <div className="queue-list">

                        {filteredCandidates.length === 0 ? (

                            <div className="queue-empty">

                                <Search size={22} />

                                <strong>
                                    No candidates found
                                </strong>

                                <span>
                                    Try changing your search or filter.
                                </span>

                            </div>

                        ) : (

                            filteredCandidates.map((candidate) => (

                                <button
                                    key={candidate.id}
                                    className={`queue-item ${selected &&
                                        selected.id === candidate.id
                                        ? "selected"
                                        : ""
                                        }`}
                                    onClick={() =>
                                        setSelectedId(candidate.id)
                                    }
                                >

                                    <div className="queue-item-top">

                                        <span className="candidate-id">
                                            {candidate.id}
                                        </span>

                                        <StatusBadge
                                            status={candidate.status}
                                        />

                                    </div>


                                    <h3>
                                        {candidate.location}
                                    </h3>


                                    <div className="queue-meta">

                                        <span>
                                            {candidate.changeType}
                                        </span>

                                        <span>
                                            •
                                        </span>

                                        <span>
                                            {candidate.detectionDate}
                                        </span>

                                    </div>


                                    <div className="queue-score">

                                        <span>
                                            Confidence
                                        </span>

                                        <strong>
                                            {candidate.confidence}%
                                        </strong>

                                    </div>


                                    <div className="queue-progress">

                                        <span
                                            style={{
                                                width: `${candidate.confidence}%`,
                                            }}
                                        />

                                    </div>


                                    <ChevronRight
                                        className="queue-arrow"
                                        size={17}
                                    />

                                </button>

                            ))

                        )}

                    </div>

                </aside>


                {/* =====================================================
                    DETAIL PANEL
                ===================================================== */}

                {selected && (

                    <section className="review-detail">


                        {/* DETAIL HEADER */}

                        <div className="detail-top">

                            <div>

                                <div className="candidate-label">
                                    CANDIDATE {selected.id}
                                </div>

                                <h2>
                                    {selected.location}
                                </h2>

                                <div className="location-line">

                                    <MapPin size={15} />

                                    <span>
                                        {selected.location}
                                        {" • "}
                                        Demo AOI
                                    </span>

                                </div>

                            </div>


                            <StatusBadge
                                status={selected.status}
                            />

                        </div>


                        {/* =================================================
                            EVIDENCE
                        ================================================= */}

                        <div className="evidence-grid">

                            <EvidenceCard
                                label="BEFORE"
                                date={selected.beforeDate}
                                type="Reference observation"
                            />

                            <EvidenceCard
                                label="AFTER"
                                date={selected.afterDate}
                                type="Detected observation"
                            />


                            <div className="change-evidence">

                                <div className="evidence-label">
                                    CHANGE MAP
                                </div>

                                <div className="change-visual">

                                    <div className="change-grid" />

                                    <div className="change-zone zone-one" />

                                    <div className="change-zone zone-two" />

                                    <div className="change-zone zone-three" />

                                    <span className="change-label">
                                        DETECTED AREA
                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            INFORMATION
                        ================================================= */}

                        <div className="review-info-grid">

                            <InfoBox
                                icon={<Activity size={18} />}
                                label="CHANGE TYPE"
                                value={selected.changeType}
                            />

                            <InfoBox
                                icon={<CalendarDays size={18} />}
                                label="DETECTION DATE"
                                value={selected.detectionDate}
                            />

                            <InfoBox
                                icon={<Satellite size={18} />}
                                label="SENSOR"
                                value={selected.sensor}
                            />

                            <InfoBox
                                icon={<ShieldCheck size={18} />}
                                label="CONFIDENCE"
                                value={`${selected.confidence}%`}
                            />

                        </div>


                        {/* =================================================
                            DESCRIPTION
                        ================================================= */}

                        <div className="review-description">

                            <div className="section-label">

                                <FileText size={16} />

                                SYSTEM INTERPRETATION

                            </div>

                            <p>
                                {selected.description}
                            </p>

                        </div>


                        {/* =================================================
                            QUALITY
                        ================================================= */}

                        <div className="quality-panel">

                            <div className="section-label">

                                <ShieldCheck size={16} />

                                QUALITY & RELIABILITY

                            </div>


                            <div className="quality-grid">

                                <QualityMetric
                                    label="Cloud cover"
                                    value="4.2%"
                                />

                                <QualityMetric
                                    label="Registration"
                                    value="0.93"
                                />

                                <QualityMetric
                                    label="Radiometric"
                                    value="Applied"
                                />

                                <QualityMetric
                                    label="Seasonal risk"
                                    value="Medium"
                                />

                                <QualityMetric
                                    label="Overall quality"
                                    value={`${selected.quality}%`}
                                />

                            </div>

                        </div>


                        {/* =================================================
                            PROCESSING TIMELINE
                        ================================================= */}

                        <div className="timeline-panel">

                            <div className="section-label">

                                <History size={16} />

                                PROCESSING HISTORY

                            </div>


                            <div className="review-timeline">

                                <TimelineStep
                                    time="09:41"
                                    title="Candidate generated"
                                    text="Change detection pipeline completed."
                                    done
                                />

                                <TimelineStep
                                    time="09:42"
                                    title="Quality validation"
                                    text="Cloud, registration and seasonal checks completed."
                                    done
                                />

                                <TimelineStep
                                    time="09:43"
                                    title="Analyst review"
                                    text="Candidate is currently awaiting analyst decision."
                                    active
                                />

                            </div>

                        </div>


                        {/* =================================================
                            DECISION ACTIONS
                        ================================================= */}

                        <div className="review-actions">

                            <button
                                className="review-action confirm"
                                onClick={() =>
                                    updateStatus("Confirmed")
                                }
                            >

                                <CheckCircle2 size={19} />

                                <span>

                                    <strong>
                                        Confirm Change
                                    </strong>

                                    <small>
                                        Save as verified detection
                                    </small>

                                </span>

                            </button>


                            <button
                                className="review-action reject"
                                onClick={() =>
                                    updateStatus("Rejected")
                                }
                            >

                                <XCircle size={19} />

                                <span>

                                    <strong>
                                        Reject Change
                                    </strong>

                                    <small>
                                        Mark as false or unsupported
                                    </small>

                                </span>

                            </button>


                            <button
                                className="review-action review"
                                onClick={() =>
                                    updateStatus("Needs Review")
                                }
                            >

                                <AlertTriangle size={19} />

                                <span>

                                    <strong>
                                        Needs Review
                                    </strong>

                                    <small>
                                        Flag for additional investigation
                                    </small>

                                </span>

                            </button>

                        </div>


                        {/* =================================================
                            AUDIT TRAIL
                        ================================================= */}

                        <div className="audit-panel">

                            <div className="audit-header">

                                <div>

                                    <div className="section-label">

                                        <History size={15} />

                                        AUDIT TRAIL

                                    </div>

                                    <p>
                                        Analyst decisions are recorded
                                        locally with candidate ID,
                                        timestamp and status changes.
                                    </p>

                                </div>

                                <div className="audit-status">

                                    <Clock3 size={15} />

                                    <span>
                                        Local audit storage enabled
                                    </span>

                                </div>

                            </div>


                            <div className="audit-list">

                                {auditEntries.map(
                                    (entry, index) => (

                                        <div
                                            className="audit-row"
                                            key={`${entry.time}-${index}`}
                                        >

                                            <div className="audit-time">
                                                {entry.time}
                                            </div>

                                            <div className="audit-marker">
                                                <span />
                                            </div>

                                            <div className="audit-content">

                                                <strong>
                                                    {entry.action}
                                                </strong>

                                                <span>
                                                    {entry.detail}
                                                </span>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>


                        {/* =================================================
                            PROVENANCE LINK
                        ================================================= */}

                        <button
                            className="review-provenance-link"
                            onClick={() =>
                                navigate("/provenance")
                            }
                        >

                            <div>

                                <ShieldCheck size={18} />

                                <span>

                                    <strong>
                                        View full provenance
                                    </strong>

                                    <small>
                                        Source scene, processing history,
                                        model information and export record
                                    </small>

                                </span>

                            </div>

                            <ChevronRight size={18} />

                        </button>

                    </section>

                )}

            </section>


            {/* =========================================================
                FOOTER
            ========================================================= */}

            <footer className="review-footer">

                <span>
                    QUANTUMVISION
                </span>

                <span>
                    •
                </span>

                <span>
                    SIH26227
                </span>

                <span>
                    •
                </span>

                <span>
                    LOCAL DEMO DATASET
                </span>

            </footer>

        </main>
    );
}


/* ================================================================
   STATUS BADGE
================================================================ */

function StatusBadge({
    status,
}: {
    status: CandidateStatus;
}) {
    const className = status
        .toLowerCase()
        .replace(/\s+/g, "-");

    return (
        <span
            className={`status-badge status-${className}`}
        >
            <span />
            {status}
        </span>
    );
}


/* ================================================================
   EVIDENCE CARD
================================================================ */

function EvidenceCard({
    label,
    date,
    type,
}: {
    label: string;
    date: string;
    type: string;
}) {
    return (
        <div className="evidence-card">

            <div className="evidence-label">
                {label}
            </div>

            <div className="satellite-visual">

                <div className="terrain terrain-one" />

                <div className="terrain terrain-two" />

                <div className="river-line" />

                <div className="settlement settlement-one" />

                <div className="settlement settlement-two" />

                <div className="visual-grid" />

                <span className="demo-label">
                    LOCAL DEMO
                </span>

            </div>


            <div className="evidence-footer">

                <div>

                    <strong>
                        {date}
                    </strong>

                    <span>
                        {type}
                    </span>

                </div>

            </div>

        </div>
    );
}


/* ================================================================
   INFORMATION BOX
================================================================ */

function InfoBox({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="info-box">

            <div className="info-icon">
                {icon}
            </div>

            <div>

                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>

            </div>

        </div>
    );
}


/* ================================================================
   QUALITY METRIC
================================================================ */

function QualityMetric({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="quality-metric">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>
    );
}


/* ================================================================
   TIMELINE STEP
================================================================ */

function TimelineStep({
    time,
    title,
    text,
    done,
    active,
}: {
    time: string;
    title: string;
    text: string;
    done?: boolean;
    active?: boolean;
}) {
    return (
        <div
            className={`timeline-step ${active ? "active" : ""
                }`}
        >

            <div className="timeline-marker">

                {done ? (
                    <CheckCircle2 size={15} />
                ) : (
                    <Clock3 size={15} />
                )}

            </div>


            <div className="timeline-content">

                <div className="timeline-time">
                    {time}
                </div>

                <strong>
                    {title}
                </strong>

                <span>
                    {text}
                </span>

            </div>

        </div>
    );
}