import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Goals from "./pages/Goals";
import Analysis from "./pages/Analysis";
import MetricDetail from "./pages/MetricDetail";
import NotFound from "./pages/NotFound";

console.log('React in App.tsx:', React);
console.log('React.useEffect in App.tsx:', React.useEffect);

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...');
  
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="goals" element={<Goals />} />
                <Route path="analysis" element={<Analysis />} />
                <Route path="metric/:metricType" element={<MetricDetail />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
