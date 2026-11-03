import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#050b14",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Arial, sans-serif",
                padding: "40px",
            }}
        >
            <div
                style={{
                    width: "420px",
                    padding: "40px",
                    background: "#0b1422",
                    border: "1px solid #1d3045",
                    borderRadius: "12px",
                }}
            >
                <p
                    style={{
                        color: "#63d9ff",
                        letterSpacing: "2px",
                        fontSize: "13px",
                    }}
                >
                    NEW ANALYST
                </p>

                <h1>Create your account</h1>

                <p style={{ color: "#9aa9ba" }}>
                    Set up a local analyst identity for the QuantumVision workbench.
                </p>

                {/* Tabs */}
                <div
                    style={{
                        display: "flex",
                        marginTop: "28px",
                        borderBottom: "1px solid #294158",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: "transparent",
                            color: "#9aa9ba",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Sign in
                    </button>

                    <button
                        type="button"
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: "transparent",
                            color: "#ffffff",
                            border: "none",
                            borderBottom: "2px solid #63d9ff",
                            cursor: "pointer",
                        }}
                    >
                        Create account
                    </button>
                </div>

                {/* Name */}
                <label
                    style={{
                        display: "block",
                        marginTop: "24px",
                        marginBottom: "8px",
                    }}
                >
                    Analyst name
                </label>

                <input
                    type="text"
                    placeholder="e.g. Jay Verma"
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: "#07101c",
                        color: "white",
                        border: "1px solid #294158",
                        borderRadius: "6px",
                    }}
                />

                {/* Email */}
                <label
                    style={{
                        display: "block",
                        marginTop: "16px",
                        marginBottom: "8px",
                    }}
                >
                    Email address
                </label>

                <input
                    type="email"
                    placeholder="analyst@organization.local"
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: "#07101c",
                        color: "white",
                        border: "1px solid #294158",
                        borderRadius: "6px",
                    }}
                />

                {/* Password */}
                <label
                    style={{
                        display: "block",
                        marginTop: "16px",
                        marginBottom: "8px",
                    }}
                >
                    Password
                </label>

                <div style={{ position: "relative" }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        style={{
                            width: "100%",
                            padding: "14px",
                            paddingRight: "70px",
                            background: "#07101c",
                            color: "white",
                            border: "1px solid #294158",
                            borderRadius: "6px",
                        }}
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: "absolute",
                            right: "8px",
                            top: "7px",
                            padding: "7px",
                            background: "transparent",
                            color: "#9aa9ba",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {/* Create button */}
                <button
                    type="button"
                    style={{
                        width: "100%",
                        padding: "14px",
                        marginTop: "24px",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        cursor: "pointer",
                    }}
                >
                    Create local account →
                </button>

                <p
                    style={{
                        color: "#718096",
                        fontSize: "12px",
                        marginTop: "24px",
                        lineHeight: 1.5,
                    }}
                >
                    🔐 Passwords are hashed locally; sessions use secure httpOnly cookies.
                </p>
            </div>
        </main>
    );
}