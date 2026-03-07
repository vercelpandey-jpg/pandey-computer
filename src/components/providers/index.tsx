import React from "react";
import { SWRConfig } from "swr";
import NextProgress from "./top-loader";
import { Toaster } from "sonner";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        // revalidateOnMount: false,
      }}
    >
      <NextProgress />
      {children}
      <Toaster richColors position="top-center" />
    </SWRConfig>
  );
};

export default Providers;
