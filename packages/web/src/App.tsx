import { Routes, Route } from "react-router";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Roundtable from "@/pages/Roundtable";
import Research from "@/pages/Research";
import Library from "@/pages/Library";
import Theologians from "@/pages/Theologians";
import TheologianDetail from "@/pages/TheologianDetail";
import Result from "@/pages/Result";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="roundtable" element={<Roundtable />} />
        <Route path="research" element={<Research />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<Result />} />
        <Route path="theologians" element={<Theologians />} />
        <Route path="theologians/:slug" element={<TheologianDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
