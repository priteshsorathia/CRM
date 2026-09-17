import { Providers } from "@/app/(restaurants)/providers";
import "./../globals.css";
import TokenValidationWrapper from "./TokenValidationWrapper";

export const viewport = {
  themeColor: "#2c3c50",
};

export default function RestaurantLayout({ children }) {
  return (
    <Providers>
      <TokenValidationWrapper>
        {children}
      </TokenValidationWrapper>
    </Providers>
  );
}
