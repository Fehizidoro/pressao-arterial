import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PatientProvider } from "./contexts/PatientContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewMeasurement from "./pages/NewMeasurement";
import History from "./pages/History";
import Patients from "./pages/Patients";
import Report from "./pages/Report";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/nova-medicao" component={NewMeasurement} />
      <Route path="/historico" component={History} />
      <Route path="/pacientes" component={Patients} />
      <Route path="/relatorio" component={Report} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <PatientProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </PatientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
