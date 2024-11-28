/* eslint-disable no-unused-vars */
// import { TransactionsTable } from "./TransactionsTable";
// import { SidebarWithSearch } from "./SidebarwithSearch";
import { useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ContentArea } from "./components/ContentArea";
import { AnalyticsView } from "./components/AnalyticsView";
import { UsersView } from "./components/UsersView";

const ATMPage = () => {
  const [currentView, setCurrentView] = useState("home");

  const renderView = () => {
    switch (currentView) {
      case "analytics":
        return <AnalyticsView />;
      case "users":
        return <UsersView />;
      default:
        return <ContentArea />;
    }
  };
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-800">
        <Sidebar setCurrentView={setCurrentView} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default ATMPage;
