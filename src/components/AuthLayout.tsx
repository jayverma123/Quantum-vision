import { ReactNode } from "react";
import Logo from "./Logo";

interface AuthLayoutProps {
    children: ReactNode;
    eyebrow: string;
    title: ReactNode;
    description: string;
}

export default function AuthLayout({
    children,
    eyebrow,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <main className="auth-page">

            {/* Left side */}
            <section className="auth-hero">
                <Logo />

                <div className="hero-content">
                    <div className="hero-eyebrow">
                        ◉ SIH26227&nbsp;&nbsp;•&nbsp;&nbsp; SPACE TECHNOLOGY
                    </div>

                    <h1>{title}</h1>

                    <p>{description}</p>
                </div>

                <div className="hero-footer">
                    <span>◉ On-premises intelligence</span>
                    <span>◇ Audit-ready analysis</span>
                    <span>⌁ Multi-temporal evidence</span>
                </div>
            </section>

            {/* Right side */}
            <section className="auth-panel">
                <div className="auth-card">

                    <div className="auth-card-header">
                        <div>
                            <div className="auth-eyebrow">{eyebrow}</div>
                            <h2>
                                {eyebrow === "ANALYST ACCESS"
                                    ? "Welcome back"
                                    : "Create your account"}
                            </h2>

                            <p>
                                {eyebrow === "ANALYST ACCESS"
                                    ? "Sign in to continue to the workbench."
                                    : "Set up a local analyst identity."}
                            </p>
                        </div>

                        <div className="lock-icon">
                            🔒
                        </div>
                    </div>

                    {children}

                    <div className="security-note">
                        🔐 Passwords are hashed locally; sessions use secure httpOnly cookies.
                    </div>

                </div>
            </section>

        </main>
    );
}