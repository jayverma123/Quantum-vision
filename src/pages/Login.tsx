import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Satellite,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    ScanLine,
    Clock3,
} from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <main className="login-page">
            {/* LEFT SIDE */}
            <section className="login-hero">
                <div className="brand">
                    <div className="brand-icon">
                        <Satellite size={25} strokeWidth={1.7} />
                    </div>

                    <div>
                        <div className="brand-name">QuantumVision</div>
                        <div className="brand-subtitle">EO ANALYST WORKBENCH</div>
                    </div>
                </div>

                <div className="hero-content">
                    <div className="hero-eyebrow">
                        <span className="status-dot" />
                        SIH26227
                        <span>•</span>
                        SPACE TECHNOLOGY
                    </div>

                    <h1>
                        Evidence begins
                        <br />
                        <span>with access.</span>
                    </h1>

                    <p>
                        Securely enter the on-premises intelligence environment for
                        satellite image retrieval and multi-temporal change analysis.
                    </p>
                </div>

                <div className="hero-features">
                    <div>
                        <ShieldCheck size={17} />
                        <span>On-premises intelligence</span>
                    </div>

                    <div>
                        <ScanLine size={17} />
                        <span>Audit-ready analysis</span>
                    </div>

                    <div>
                        <Clock3 size={17} />
                        <span>Multi-temporal evidence</span>
                    </div>
                </div>
            </section>

            {/* RIGHT SIDE */}
            <section className="login-panel">
                <div className="login-card">
                    <div className="card-header">
                        <div>
                            <div className="card-eyebrow">ANALYST ACCESS</div>

                            <h2>Welcome back</h2>

                            <p>Sign in to continue to the workbench.</p>
                        </div>

                        <div className="security-icon">
                            <Lock size={19} />
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="auth-tabs">
                        <button className="active" type="button">
                            Sign in
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/signup")}
                        >
                            Create account
                        </button>
                    </div>

                    {/* FORM */}
                    <form
                        className="login-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            navigate("/home");
                        }}
                    >
                        <div className="field">
                            <label>Email address</label>

                            <div className="field-wrapper">
                                <Mail size={17} />

                                <input
                                    type="email"
                                    placeholder="analyst@organization.local"
                                    required
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label>Password</label>

                            <div className="field-wrapper">
                                <Lock size={17} />

                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="eye-button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={
                                        showPassword ? "Hide password" : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button className="enter-button" type="submit">
                            <span>Enter workbench</span>
                            <ArrowRight size={19} />
                        </button>
                    </form>

                    <div className="security-note">
                        <Lock size={13} />
                        <span>
                            Passwords are hashed locally; sessions use secure
                            httpOnly cookies.
                        </span>
                    </div>
                </div>

                <div className="panel-footer">
                    QUANTUMVISION <span>•</span> SIH26227
                </div>
            </section>
        </main>
    );
}