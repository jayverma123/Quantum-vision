import { ReactNode } from "react";

interface InputFieldProps {
    label: string;
    type?: string;
    placeholder?: string;
    icon?: ReactNode;
}

export default function InputField({
    label,
    type = "text",
    placeholder,
    icon,
}: InputFieldProps) {
    return (
        <div className="input-group">
            <label>{label}</label>

            <div className="input-wrapper">
                {icon && <span className="input-icon">{icon}</span>}

                <input
                    type={type}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}