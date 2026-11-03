export type UploadedSatelliteImage = {
    name: string;
    dataUrl: string;
    captureDate: string;
    uploadedAt: string;
};

export type SatelliteComparison = {
    before: UploadedSatelliteImage;
    after: UploadedSatelliteImage;
    region: string;
    updatedAt: string;
    changeOverlay?: string;
    changePercentage?: number;
    changeType?: string;


    analysisId?: string;

    analysis?: {
        changeDetected: boolean;
        changedPixels: number;
        totalPixels: number;
        threshold: number;
    };

    semanticClassification?: {
        available: boolean;
        method?: string;
        message?: string;
        isConfirmed?: boolean;
        classes?: Array<{
            label: string;
            candidatePixels: number;
            percentageOfValidPixels: number;
            percentageOfChangedPixels: number;
            interpretation: string;
            isConfirmed: boolean;
        }>;
    };

    quality?: {
        imageAlignment: string;
        beforeWidth: number;
        beforeHeight: number;
        comparisonPixels: number;
    };

    provenance?: {
        processing: string[];
    };

};



const STORAGE_KEY = "quantumvision_satellite_comparison";

const UPDATE_EVENT = "quantumvision-satellite-updated";

export function saveSatelliteComparison(
    comparison: SatelliteComparison
): void {
    try {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(comparison)
        );

        window.dispatchEvent(
            new Event(UPDATE_EVENT)
        );
    } catch (error) {
        console.error(
            "Unable to save satellite comparison:",
            error
        );

        throw new Error(
            "Unable to store these images in browser session storage. Try smaller images."
        );
    }
}

export function getSatelliteComparison():
    SatelliteComparison | null {
    try {
        const stored = sessionStorage.getItem(
            STORAGE_KEY
        );

        if (!stored) {
            return null;
        }

        return JSON.parse(
            stored
        ) as SatelliteComparison;
    } catch (error) {
        console.error(
            "Unable to read satellite comparison:",
            error
        );

        return null;
    }
}

export function subscribeSatelliteComparison(
    callback: () => void
): () => void {
    window.addEventListener(
        UPDATE_EVENT,
        callback
    );

    return () => {
        window.removeEventListener(
            UPDATE_EVENT,
            callback
        );
    };
}

export function clearSatelliteComparison(): void {
    sessionStorage.removeItem(
        STORAGE_KEY
    );

    window.dispatchEvent(
        new Event(UPDATE_EVENT)
    );
}

