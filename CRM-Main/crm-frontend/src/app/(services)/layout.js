import { Providers } from "@/app/(services)/providers";
import "./../globals.css";

import TokenValidationWrapper from "./TokenValidationWrapper";
import RoleGuard from "@/components/RoleGuard";

export const viewport = {
    themeColor: "#2c3e50",
};

export default function ServicesModuleLayout({ children }) {
    return (
        <Providers>
            <TokenValidationWrapper>
                <RoleGuard>
                    {children}
                </RoleGuard>
            </TokenValidationWrapper>
        </Providers>
    );
}
