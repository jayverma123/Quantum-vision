
import React, { useRef, useState } from "react";
// @ts-ignore CSS is loaded by the bundler; TypeScript has no CSS module declaration.
import "./Change.css";

import {
    Upload,
    FolderOpen,
    Satellite,
    CalendarDays,
    MapPin,
    LoaderCircle,
    AlertCircle,
    CheckCircle2,
    Image as ImageIcon,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

type Side = "before" | "after";

type AnalysisResult = {
    status?: string;
    message?: string;
    detail?: string;
    method?: string;
    note?: string;
    analysis?: {
        change_detected?: boolean;
        changed_pixels?: number;
        total_pixels?: number;
        valid_pixels?: number;
        change_percentage?: number;
        threshold?: number;
    };
    quality?: {
        alignment?: string;
        valid_pixels?: number;
        band_count?: number;
    };
    change_percentage?: number;
    change_overlay?: string;
    before_image?: string;
    after_image?: string;
    provenance?: string[];
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024;

const isTiff = (file: File): boolean =>
    /\.(tif|tiff)$/i.test(file.name.trim());

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(value?: number): string {
    if (value === undefined || !Number.isFinite(value)) {
        return "Not provided";
    }

    return value.toLocaleString();
}

export default function Change() {
    const beforeInputRef = useRef<HTMLInputElement>(null);
    const afterInputRef = useRef<HTMLInputElement>(null);

    const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
    const [afterFiles, setAfterFiles] = useState<File[]>([]);

    const [beforeDate, setBeforeDate] = useState("");
    const [afterDate, setAfterDate] = useState("");
    const [region, setRegion] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);

    function updateFiles(side: Side, incoming: FileList | null) {
        if (!incoming) return;

        const files = Array.from(incoming).filter(
            (file) => file.size > 0
        );

        if (files.length === 0) {
            setError("The selected folder contains no usable files.");
            return;
        }

        const oversized = files.find(
            (file) => file.size > MAX_FILE_SIZE
        );

        if (oversized) {
            setError(
                `${oversized.name} exceeds the 100 MB per-file limit.`
            );
            return;
        }

        const totalSize = files.reduce(
            (sum, file) => sum + file.size,
            0
        );

        if (totalSize > MAX_TOTAL_SIZE) {
            setError(
                "The selected files exceed the 500 MB total limit."
            );
            return;
        }

        const tiffs = files.filter(isTiff);
        const selectedFiles = tiffs.length > 0 ? tiffs : files;

        if (side === "before") {
            setBeforeFiles(selectedFiles);
        } else {
            setAfterFiles(selectedFiles);
        }

        setError("");
        setResult(null);
    }

    function getFilesForAnalysis(files: File[]): File[] {
        const tiffs = files.filter(isTiff);
        return tiffs.length > 0 ? tiffs : files;
    }

    async function analyzeChanges(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError("");
        setResult(null);

        if (beforeFiles.length === 0 || afterFiles.length === 0) {
            setError(
                "Please select one BEFORE image and one AFTER image, or matching GeoTIFF inputs."
            );
            return;
        }

        if (!beforeDate || !afterDate) {
            setError("Please enter both image acquisition dates.");
            return;
        }

        if (beforeDate >= afterDate) {
            setError(
                "The AFTER date must be later than the BEFORE date."
            );
            return;
        }

        const beforeSelected = getFilesForAnalysis(beforeFiles);
        const afterSelected = getFilesForAnalysis(afterFiles);

        const beforeTiffs = beforeSelected.filter(isTiff);
        const afterTiffs = afterSelected.filter(isTiff);

        const beforeIsTiff = beforeTiffs.length > 0;
        const afterIsTiff = afterTiffs.length > 0;

        if (beforeIsTiff !== afterIsTiff) {
            setError(
                "The BEFORE and AFTER inputs must both contain TIFF data, or both contain supported non-TIFF images."
            );
            return;
        }

        if (
            !beforeIsTiff &&
            (beforeSelected.length !== 1 ||
                afterSelected.length !== 1)
        ) {
            setError(
                "For non-TIFF input, select one image for BEFORE and one image for AFTER."
            );
            return;
        }

        if (beforeIsTiff && afterIsTiff) {
            if (beforeTiffs.length !== afterTiffs.length) {
                setError(
                    `The number of TIFF files differs: BEFORE has ${beforeTiffs.length}, AFTER has ${afterTiffs.length}. Select matching bands for both dates.`
                );
                return;
            }

            const beforeNames = beforeTiffs.map((file) =>
                file.name
                    .split(/[\\/]/)
                    .pop()!
                    .replace(/\.(tif|tiff)$/i, "")
                    .toLowerCase()
            );

            const afterNames = afterTiffs.map((file) =>
                file.name
                    .split(/[\\/]/)
                    .pop()!
                    .replace(/\.(tif|tiff)$/i, "")
                    .toLowerCase()
            );

            const beforeSet = new Set(beforeNames);
            const afterSet = new Set(afterNames);

            const sameNames =
                beforeSet.size === afterSet.size &&
                [...beforeSet].every((name) => afterSet.has(name));

            if (!sameNames) {
                setError(
                    "The TIFF band filenames do not match. Select corresponding bands for both dates, such as B02, B03, B04 and B08."
                );
                return;
            }
        }

        const formData = new FormData();

        beforeSelected.forEach((file) => {
            formData.append("before_files", file, file.name);
        });

        afterSelected.forEach((file) => {
            formData.append("after_files", file, file.name);
        });

        formData.append("before_date", beforeDate);
        formData.append("after_date", afterDate);
        formData.append("region", region.trim());

        setLoading(true);

        try {
            const response = await fetch(
                `${API}/api/change/analyze-uploaded`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    `Analysis failed with HTTP ${response.status}.`
                );
            }

            if (
                data.status === "error" ||
                data.status === "incomplete"
            ) {
                throw new Error(
                    data.message ||
                    "The backend could not complete the analysis."
                );
            }

            setResult(data as AnalysisResult);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not connect to the analysis backend."
            );
        } finally {
            setLoading(false);
        }
    }

    function renderFileList(files: File[], side: Side) {
        if (files.length === 0) {
            return (
                <p className="mt-3 text-sm text-gray-500">
                    No files selected yet.
                </p>
            );
        }

        const tiffCount = files.filter(isTiff).length;
        const totalSize = files.reduce(
            (sum, file) => sum + file.size,
            0
        );

        return (
            <div className="mt-4">
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                        {files.length} file(s)
                    </span>

                    {tiffCount > 0 && (
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">
                            {tiffCount} TIFF band(s)
                        </span>
                    )}

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                        {formatBytes(totalSize)}
                    </span>
                </div>

                <ul className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                    {files.map((file, index) => (
                        <li
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <ImageIcon
                                    size={16}
                                    className="shrink-0 text-gray-500"
                                />
                                <span className="truncate">
                                    {file.name}
                                </span>
                            </span>

                            <span className="shrink-0 text-xs text-gray-500">
                                {formatBytes(file.size)}
                            </span>
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    className="mt-3 text-sm font-medium text-red-600 hover:underline"
                    onClick={() => {
                        if (side === "before") {
                            setBeforeFiles([]);
                            if (beforeInputRef.current) {
                                beforeInputRef.current.value = "";
                            }
                        } else {
                            setAfterFiles([]);
                            if (afterInputRef.current) {
                                afterInputRef.current.value = "";
                            }
                        }

                        setResult(null);
                        setError("");
                    }}
                >
                    Remove selected files
                </button>
            </div>
        );
    }

    const analysis = result?.analysis;
    const changedPixels = analysis?.changed_pixels;

    const validPixels =
        analysis?.valid_pixels ?? analysis?.total_pixels;

    const calculatedPercentage =
        analysis?.change_percentage ??
        (changedPixels !== undefined &&
            validPixels !== undefined &&
            validPixels > 0
            ? (changedPixels / validPixels) * 100
            : undefined);

    const displayedPercentage =
        result?.change_percentage ?? calculatedPercentage;

    return (
        <main className="qv-change-page">
            <div>
                <header>
                    <div>
                        <div>
                            <Satellite size={28} />
                        </div>

                        <div>
                            <p>QUANTUM VISION</p>
                            <h1>Multi-Temporal Change Analysis</h1>
                        </div>
                    </div>

                    <p>
                        Compare satellite imagery from two dates to identify
                        potential changes. Select matching TIFF bands from
                        the same geographical area.
                    </p>
                </header>

                <form onSubmit={analyzeChanges}>
                    <div>
                        <section>
                            <div>
                                <div>
                                    <CalendarDays size={22} />
                                </div>

                                <div>
                                    <h2>BEFORE Observation</h2>
                                    <p>Older satellite data</p>
                                </div>
                            </div>

                            <label htmlFor="before-date">
                                Acquisition date
                            </label>

                            <input
                                id="before-date"
                                type="date"
                                value={beforeDate}
                                onChange={(event) => {
                                    setBeforeDate(event.target.value);
                                    setResult(null);
                                }}
                                required
                            />

                            <div>
                                <FolderOpen size={32} />

                                <p>Select BEFORE image or GeoTIFF</p>
                                <p>
                                    Supported: JPG, JPEG, PNG, TIFF, or GeoTIFF
                                </p>

                                <input
                                    ref={beforeInputRef}
                                    type="file"
                                    multiple
                                    accept=".tif,.tiff,.png,.jpg,.jpeg"
                                    onChange={(event) =>
                                        updateFiles(
                                            "before",
                                            event.target.files
                                        )
                                    }
                                />
                            </div>

                            {renderFileList(beforeFiles, "before")}
                        </section>

                        <section>
                            <div>
                                <div>
                                    <CalendarDays size={22} />
                                </div>

                                <div>
                                    <h2>AFTER Observation</h2>
                                    <p>Newer satellite data</p>
                                </div>
                            </div>

                            <label htmlFor="after-date">
                                Acquisition date
                            </label>

                            <input
                                id="after-date"
                                type="date"
                                value={afterDate}
                                onChange={(event) => {
                                    setAfterDate(event.target.value);
                                    setResult(null);
                                }}
                                required
                            />

                            <div>
                                <FolderOpen size={32} />

                                <p>Select AFTER image or GeoTIFF</p>
                                <p>
                                    Choose the matching area from the newer date
                                </p>

                                <input
                                    ref={afterInputRef}
                                    type="file"
                                    multiple
                                    accept=".tif,.tiff,.png,.jpg,.jpeg"
                                    onChange={(event) =>
                                        updateFiles(
                                            "after",
                                            event.target.files
                                        )
                                    }
                                />
                            </div>

                            {renderFileList(afterFiles, "after")}
                        </section>
                    </div>

                    <section>
                        <label htmlFor="region">
                            <MapPin size={18} />
                            Region or area name (optional)
                        </label>

                        <input
                            id="region"
                            type="text"
                            value={region}
                            onChange={(event) =>
                                setRegion(event.target.value)
                            }
                            placeholder="e.g. Jaipur, Rajasthan"
                        />

                        <p>
                            Choose images of the same geographical area from two dates. For regular JPG/PNG images, select one image for each date. For geospatial comparisons, use compatible GeoTIFF files.
                        </p>

                        {error && (
                            <div role="alert">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <LoaderCircle
                                        size={20}
                                        className="animate-spin"
                                    />
                                    Analysing satellite data...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Analyse Changes
                                </>
                            )}
                        </button>
                    </section>
                </form>

                {result && (
                    <section>
                        <div>
                            <CheckCircle2 size={28} />

                            <div>
                                <h2>Analysis Response Received</h2>

                                <p>
                                    {result.message ||
                                        result.note ||
                                        "The backend returned an analysis result. Review the measurements below."}
                                </p>
                            </div>
                        </div>

                        <div>
                            <div>
                                <p>Change percentage</p>
                                <p>
                                    {displayedPercentage !== undefined
                                        ? `${displayedPercentage.toFixed(2)}%`
                                        : "Not provided"}
                                </p>
                            </div>

                            <div>
                                <p>Changed pixels</p>
                                <p>{formatNumber(changedPixels)}</p>
                            </div>

                            <div>
                                <p>Valid pixels</p>
                                <p>{formatNumber(validPixels)}</p>
                            </div>
                        </div>

                        {result.change_overlay && (
                            <div>
                                <h3>Change Overlay</h3>

                                <img
                                    src={
                                        result.change_overlay.startsWith(
                                            "data:"
                                        )
                                            ? result.change_overlay
                                            : `data:image/png;base64,${result.change_overlay}`
                                    }
                                    alt="Satellite change detection overlay"
                                />
                            </div>
                        )}

                        <details>
                            <summary>Technical analysis details</summary>

                            <pre>
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>

                        <p>
                            Important: A detected pixel difference is not
                            proof of a real-world change. Clouds, shadows,
                            seasonal effects, and image misalignment can
                            create false detections. Verify potential
                            changes before drawing conclusions.
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}

