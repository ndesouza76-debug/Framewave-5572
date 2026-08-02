import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { Navbar } from "./components/navbar";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import Index from "./pages/index";
import LoginPage from "./pages/login";
import StudioPage from "./pages/studio";
import HistoryPage from "./pages/history";
import GalleryPage from "./pages/gallery";
import VideoPage from "./pages/video";
import PricingPage from "./pages/pricing";

function App() {
  return (
    <Provider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/login" component={LoginPage} />
            <Route path="/studio" component={StudioPage} />
            <Route path="/history" component={HistoryPage} />
            <Route path="/gallery" component={GalleryPage} />
            <Route path="/v/:id" component={VideoPage} />
            <Route path="/pricing" component={PricingPage} />
            <Route>
              <div className="grid min-h-[60vh] place-items-center px-5 text-center">
                <div>
                  <h1 className="gradient-text text-6xl font-semibold">404</h1>
                  <p className="mt-3 text-muted-foreground">This page drifted off frame.</p>
                </div>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
