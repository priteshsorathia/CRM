import { Providers } from "@/app/(retailers)/providers";
import "./../globals.css";
import TokenValidationWrapper from "./TokenValidationWrapper";


export const viewport = {
  themeColor: "#2c3e50",
};

export default function RootLayout({ children }) {
  return (
    <Providers>
      <TokenValidationWrapper>
        {children}
      </TokenValidationWrapper>
    </Providers>
  );
}
