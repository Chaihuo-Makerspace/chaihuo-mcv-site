import { createBrowserRouter } from "react-router";
import { Layout } from "./components/PageTransition";
import Home from "./pages/Home";
import Deconstruct from "./pages/Deconstruct";
import Documentation from "./pages/Documentation";
import Guide from "./pages/Guide";
import About from "./pages/About";

export const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
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
      {
        path: "/about",
        Component: About,
      },
    ],
  },
]);
