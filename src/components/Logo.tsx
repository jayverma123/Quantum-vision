import { Satellite } from "lucide-react";

export default function Logo() {
    return (
        <div className="logo">
            <div className="logo-icon">
                <Satellite size={22} strokeWidth={1.8} />
            </div>

            <div className="logo-text">
                <div className="logo-name">QuantumVision</div>
                <div className="logo-subtitle">EO ANALYST WORKBENCH</div>
            </div>
        </div>
    );
}