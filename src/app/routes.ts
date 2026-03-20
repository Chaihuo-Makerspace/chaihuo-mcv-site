import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Deconstruct from "./pages/Deconstruct";
import Documentation from "./pages/Documentation";
import Guide from "./pages/Guide";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/deconstruct",
    Component: Deconstruct,
  },
  {
    path: "/documentation",
    Component: Documentation,
  },
  {
    path: "/guide",
    Component: Guide,
  },
]);