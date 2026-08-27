import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout";
import {
  HomePage,
  SearchPage,
  WishlistPage,
  HistoryPage,
  ContactPage,
  CardDetailPage,
  NotFoundPage,
} from "./pages";

/** Route table. All pages render inside the persistent <Layout /> shell. */
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="buscar" element={<SearchPage />} />
        <Route path="carta/:id" element={<CardDetailPage />} />
        <Route path="deseos" element={<WishlistPage />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
