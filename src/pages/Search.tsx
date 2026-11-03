import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Satellite,
    Search as SearchIcon,
    Map,
    CalendarDays,
    Cloud,
    SlidersHorizontal,
    ArrowLeft,
    ChevronRight,
    Sparkles,
} from "lucide-react";

type SearchResult = {
    id: number;
    location: string;
    date: string;
    sensor: string;
    similarity: string;
    cloud: string;
    resolution: string;
    description: string;
};

const demoResults: SearchResult[] = [
    {
        id: 1,
        location: "Yamuna River Region",
        date: "12 June 2025",
        sensor: "Sentinel-2",
        similarity: "94.2%",
        cloud: "4.2%",
        resolution: "10 m",
        description: "Possible new structures close to a river corridor.",
    },
    {
        id: 2,
        location: "Rajasthan River Basin",
        date: "08 May 2025",
        sensor: "Sentinel-2",
        similarity: "89.7%",
        cloud: "7.1%",
        resolution: "10 m",
        description: "Built-up expansion detected near a water feature.",
    },
    {
        id: 3,
        location: "Northern India",
        date: "21 April 2025",
        sensor: "Landsat 9",
        similarity: "86.4%",
        cloud: "8.6%",
        resolution: "30 m",
        description: "Urban development pattern near a river environment.",
    },
];

export default function Search() {
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [searched, setSearched] = useState(false);


    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [sensor, setSensor] = useState("All sensors");
    const [maxCloud, setMaxCloud] = useState("30");

    const handleSearch = async () => {
        if (!query.trim()) {
            alert("Please enter a search query");
            return;
        }

        console.log("Searching for:", query);

        setLoading(true);
        setSearched(true);

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/api/search/text",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        query: query,
                    }),
                }
            );

            console.log("Backend response:", response);

            if (!response.ok) {
                throw new Error("Search request failed");
            }

            const data = await response.json();

            console.log("Search data:", data);

            setResults(
                data.results.map((item: any) => ({
                    id: item.id,
                    location: item.location,
                    date: item.date,
                    sensor: item.sensor,
                    similarity: `${item.similarity}%`,
                    cloud: `${item.cloud_cover}%`,
                    resolution: item.resolution,
                    description: `Detected ${item.change_type.toLowerCase()} related activity.`,
                }))
            );
        } catch (error) {
            console.error("Search error:", error);
            alert("Could not connect to QuantumVision backend.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    };
    const filteredResults = results.filter((result) => {
        const sensorMatch =
            sensor === "All sensors" || result.sensor === sensor;

        const cloudMatch =
            Number(result.cloud.replace("%", "")) <= Number(maxCloud);

        return sensorMatch && cloudMatch;
    });

    return (
        <main className="search-page">
            {/* TOP NAVIGATION */}
            <header className="search-nav">
                <div className="search-brand">
                    <div className="search-brand-icon">
                        <Satellite size={22} />
                    </div>

                    <div>
                        <div className="search-brand-name">QuantumVision</div>
                        <div className="search-brand-subtitle">
                            EO ANALYST WORKBENCH
                        </div>
                    </div>
                </div>

                <nav className="search-navigation">
                    <button onClick={() => navigate("/home")}>
                        Dashboard
                    </button>

                    <button className="active">Search</button>

                    <button onClick={() => navigate("/change")}>
                        Change Analysis
                    </button>

                    <button onClick={() => navigate("/explore")}>
                        Explore
                    </button>
                </nav>

                <div className="search-system-status">
                    <span />
                    OFFLINE / ON-PREMISES
                </div>
            </header>

            {/* MAIN CONTENT */}
            <section className="search-content">
                <button
                    className="back-button"
                    onClick={() => navigate("/home")}
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </button>

                <div className="search-heading">
                    <div>
                        <div className="search-eyebrow">
                            <Sparkles size={14} />
                            SEMANTIC RETRIEVAL
                        </div>

                        <h1>Find what you're looking for.</h1>

                        <p>
                            Describe an observation in natural language and
                            QuantumVision will search the indexed satellite archive.
                        </p>
                    </div>

                    <div className="demo-badge">
                        DEMO DATASET
                    </div>
                </div>

                {/* SEARCH BOX */}
                <section className="search-box-card">
                    <div className="search-box">
                        <SearchIcon size={21} />

                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleSearch();
                                }
                            }}
                            placeholder="e.g. newly built structures near a river"
                        />

                        <button onClick={handleSearch}>
                            Search
                            <ChevronRight size={17} />
                        </button>
                    </div>

                    <div className="suggestion-row">
                        <span>Try:</span>

                        <button
                            onClick={() =>
                                setQuery("newly built structures near a river")
                            }
                        >
                            newly built structures near a river
                        </button>

                        <button
                            onClick={() =>
                                setQuery("road development in open land")
                            }
                        >
                            road development in open land
                        </button>

                        <button
                            onClick={() =>
                                setQuery("water extent variation")
                            }
                        >
                            water extent variation
                        </button>
                    </div>
                    <button onClick={() => navigate("/similar-sites")}>
                        Similar Sites
                    </button>
                </section>


                {/* SEARCH MODE */}
                <section className="mode-section">
                    <div className="mode-title">
                        SEARCH MODE
                    </div>

                    <div className="mode-options">
                        <button className="mode-active">
                            <SearchIcon size={16} />
                            Text → Image
                        </button>

                        <button>
                            <Satellite size={16} />
                            Image → Image
                        </button>

                        <button>
                            <Sparkles size={16} />
                            Multimodal
                        </button>
                    </div>
                </section>

                {/* FILTERS */}
                <section className="filters-card">
                    <div className="filters-header">
                        <div>
                            <SlidersHorizontal size={17} />
                            <span>REFINE RESULTS</span>
                        </div>

                        <small>
                            Spatial and temporal filters
                        </small>
                    </div>

                    <div className="filters-grid">
                        <div className="filter">
                            <label>
                                <CalendarDays size={14} />
                                Date range
                            </label>

                            <div className="date-inputs">
                                <input type="date" />
                                <span>to</span>
                                <input type="date" />
                            </div>
                        </div>

                        <div className="filter">
                            <label>
                                <Satellite size={14} />
                                Sensor
                            </label>

                            <select
                                value={sensor}
                                onChange={(event) =>
                                    setSensor(event.target.value)
                                }
                            >
                                <option>All sensors</option>
                                <option>Sentinel-2</option>
                                <option>Landsat 9</option>
                            </select>
                        </div>

                        <div className="filter">
                            <label>
                                <Cloud size={14} />
                                Maximum cloud cover
                            </label>

                            <select
                                value={maxCloud}
                                onChange={(event) =>
                                    setMaxCloud(event.target.value)
                                }
                            >
                                <option value="10">10%</option>
                                <option value="20">20%</option>
                                <option value="30">30%</option>
                                <option value="50">50%</option>
                            </select>
                        </div>

                        <div className="filter">
                            <label>
                                <Map size={14} />
                                Area of interest
                            </label>

                            <button className="aoi-button">
                                Select on map
                            </button>
                        </div>
                    </div>
                </section>

                {/* RESULTS */}
                <section className="results-section">
                    <div className="results-header">
                        <div>
                            <span>RANKED RESULTS</span>
                            <h2>
                                {searched
                                    ? `${filteredResults.length} matching observations`
                                    : "Ready to search the archive"}
                            </h2>
                        </div>

                        {searched && (
                            <div className="result-sort">
                                Ranked by relevance
                            </div>
                        )}
                    </div>

                    {!searched ? (
                        <div className="empty-search">
                            <div className="empty-icon">
                                <SearchIcon size={25} />
                            </div>

                            <h3>Start with a question</h3>

                            <p>
                                Try a natural-language query such as
                                <br />
                                <strong>
                                    "newly built structures near a river"
                                </strong>
                            </p>
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="empty-search">
                            <div className="empty-icon">
                                <SearchIcon size={25} />
                            </div>

                            <h3>No matching observations</h3>

                            <p>
                                Try increasing the cloud-cover limit or selecting
                                another sensor.
                            </p>
                        </div>
                    ) : (
                        <div className="results-list">
                            {filteredResults.map((result, index) => (
                                <article
                                    className="result-card"
                                    key={result.id}
                                >
                                    {/* IMAGE PLACEHOLDER */}
                                    <div className="result-image">
                                        <div className="satellite-preview">
                                            <div className="preview-grid" />
                                            <div className="preview-river" />
                                            <div className="preview-structure" />
                                        </div>

                                        <div className="rank-badge">
                                            #{index + 1}
                                        </div>
                                    </div>

                                    {/* RESULT INFO */}
                                    <div className="result-information">
                                        <div className="result-top">
                                            <div>
                                                <div className="result-location">
                                                    {result.location}
                                                </div>

                                                <h3>
                                                    {query || "Satellite observation"}
                                                </h3>
                                            </div>

                                            <div className="similarity">
                                                <span>SIMILARITY</span>
                                                <strong>{result.similarity}</strong>
                                            </div>
                                        </div>

                                        <p className="result-description">
                                            {result.description}
                                        </p>

                                        <div className="result-metadata">
                                            <span>
                                                <CalendarDays size={14} />
                                                {result.date}
                                            </span>

                                            <span>
                                                <Satellite size={14} />
                                                {result.sensor}
                                            </span>

                                            <span>
                                                <Cloud size={14} />
                                                {result.cloud} cloud
                                            </span>

                                            <span>
                                                {result.resolution}
                                            </span>
                                        </div>

                                        <div className="result-actions">
                                            <button className="view-button">
                                                View Details
                                                <ChevronRight size={15} />
                                            </button>

                                            <button
                                                className="change-button"
                                                onClick={() => navigate("/change")}
                                            >
                                                Analyze Change
                                            </button>

                                            <button className="similar-button">
                                                Find Similar Sites
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}