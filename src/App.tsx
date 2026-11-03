import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";



import Login from "./pages/Login";
import Signup from "./pages/signup";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Change from "./pages/Change";
import Explore from "./pages/Explore";
import SimilarSites from "./pages/Similarsites";
import Review from "./pages/Review";
import Provenance from "./pages/Provenance";
import Ingestion from "./pages/Ingestion";


export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/change" element={<Change />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/similar-sites" element={<SimilarSites />} />
            <Route path="/review" element={<Review />} />
            <Route path="/provenance" element={<Provenance />} />
            <Route path="/ingestion" element={<Ingestion />} />

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}